import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Grid, Paper, useTheme } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Define interface for prompt performance metrics
interface PromptMetric {
  id: string;
  timestamp: string;
  responseTime: number;
  tokenCount: number;
  tokenUsage: number;
  successRate: number;
  completionRate: number;
  userSatisfactionScore?: number;
}

// Interface for the component props
interface PromptPerformanceProps {
  promptId: string;
}

const PromptPerformance: React.FC<PromptPerformanceProps> = ({ promptId }) => {
  const [metrics, setMetrics] = useState<PromptMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<keyof PromptMetric>('responseTime');
  const [hoveredRun, setHoveredRun] = useState<PromptMetric | null>(null);
  
  const theme = useTheme();

  // Fetch prompt performance data
  useEffect(() => {
    const fetchPromptPerformance = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be an API call
        // const response = await api.get(`/api/prompts/${promptId}/performance`);
        
        // Simulate API response with mock data
        const mockMetrics: PromptMetric[] = Array.from({ length: 10 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (10 - i));
          
          return {
            id: `run-${i + 1}`,
            timestamp: date.toISOString(),
            responseTime: Math.random() * 1000 + 500, // 500-1500ms
            tokenCount: Math.floor(Math.random() * 500 + 100), // 100-600 tokens
            tokenUsage: Math.random() * 0.8 + 0.2, // 20-100% usage
            successRate: Math.random() * 0.3 + 0.7, // 70-100% success
            completionRate: Math.random() * 0.4 + 0.6, // 60-100% completion
            userSatisfactionScore: Math.random() * 5, // 0-5 score
          };
        });
        
        setMetrics(mockMetrics);
        setLoading(false);
      } catch (err) {
        setError('Failed to load prompt performance data');
        setLoading(false);
      }
    };

    fetchPromptPerformance();
  }, [promptId]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Prepare chart data
  const chartData = {
    labels: metrics.map(metric => formatDate(metric.timestamp)),
    datasets: [
      {
        label: getMetricLabel(selectedMetric),
        data: metrics.map(metric => metric[selectedMetric] as number),
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}33`, // Add transparency
        fill: true,
        tension: 0.4,
      }
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Prompt Performance: ${getMetricLabel(selectedMetric)}`,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const run = metrics[index];
            setHoveredRun(run);
            return `${getMetricLabel(selectedMetric)}: ${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
      }
    },
    onHover: (_: any, elements: any[]) => {
      if (elements.length === 0) {
        setHoveredRun(null);
      }
    }
  };

  // Helper function to get readable metric names
  function getMetricLabel(metric: keyof PromptMetric): string {
    const labels: Record<string, string> = {
      responseTime: 'Response Time (ms)',
      tokenCount: 'Token Count',
      tokenUsage: 'Token Usage Ratio',
      successRate: 'Success Rate',
      completionRate: 'Completion Rate',
      userSatisfactionScore: 'User Satisfaction'
    };
    return labels[metric] || metric;
  }

  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Prompt Performance Analytics
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box height={300}>
              <Line data={chartData} options={chartOptions} />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Performance Metrics
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={1}>
                {Object.keys(metrics[0] || {})
                  .filter(key => key !== 'id' && key !== 'timestamp')
                  .map(metric => (
                    <Box 
                      key={metric} 
                      sx={{ 
                        p: 1, 
                        cursor: 'pointer',
                        bgcolor: selectedMetric === metric ? 'primary.light' : 'background.paper',
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'primary.light' }
                      }}
                      onClick={() => setSelectedMetric(metric as keyof PromptMetric)}
                    >
                      <Typography variant="body2">{getMetricLabel(metric as keyof PromptMetric)}</Typography>
                    </Box>
                  ))}
              </Box>
            </Paper>
          </Grid>
          
          {hoveredRun && (
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Run Details: {formatDate(hoveredRun.timestamp)}
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(hoveredRun)
                    .filter(([key]) => key !== 'id' && key !== 'timestamp')
                    .map(([key, value]) => (
                      <Grid item xs={6} sm={4} md={2} key={key}>
                        <Typography variant="caption" color="textSecondary">
                          {getMetricLabel(key as keyof PromptMetric)}
                        </Typography>
                        <Typography variant="body2">
                          {typeof value === 'number' ? value.toFixed(2) : value}
                        </Typography>
                      </Grid>
                    ))}
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PromptPerformance; 