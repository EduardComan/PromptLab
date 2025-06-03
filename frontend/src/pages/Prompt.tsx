import {
  AutoAwesome,
  Check as CheckIcon,
  Close as CloseIcon,
  Commit as CommitIcon,
  Edit as EditIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  QuestionMark
} from '@mui/icons-material';
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Tooltip as ChartTooltip,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MergeRequest,
  Organization,
  PromptParameters,
  PromptRun,
  Prompt as PromptType,
  PromptVersion,
  TabPanelProps
} from '../interfaces';
import { PromptService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import OrganizationService from '../services/OrganizationService';

// Register Chart.js components
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

// Constants
const DEFAULT_PARAMETERS: PromptParameters = {
  temperature: 0.7,
  top_p: 1.0,
  frequency_penalty: 0.0,
  max_tokens: 500
};

const PARAMETER_ORDER = ['temperature', 'top_p', 'frequency_penalty', 'max_tokens'];

// Utility functions
const normalizeParameters = (params: PromptParameters): PromptParameters => {
  const normalized = { ...DEFAULT_PARAMETERS, ...params };
  const additionalKeys = Object.keys(params).filter(key => !PARAMETER_ORDER.includes(key)).sort();
  
  const result = { ...DEFAULT_PARAMETERS } as PromptParameters;
  PARAMETER_ORDER.forEach(key => { if (normalized[key] !== undefined) result[key] = normalized[key]; });
  additionalKeys.forEach(key => { result[key] = params[key]; });
  
  return result;
};

const deepEqualParameters = (obj1: PromptParameters, obj2: PromptParameters): boolean => {
  const allKeys = Array.from(new Set([...Object.keys(obj1), ...Object.keys(obj2)])).sort();
  return allKeys.every(key => {
    const val1 = obj1[key] !== undefined ? obj1[key] : DEFAULT_PARAMETERS[key];
    const val2 = obj2[key] !== undefined ? obj2[key] : DEFAULT_PARAMETERS[key];
    return val1 === val2;
  });
};

const formatCost = (cost: number): string => {
  if (cost === 0) return '$0.000000';
  if (cost < 0.000001) return `$${cost.toExponential(2)}`;
  if (cost < 0.01) return `$${cost.toFixed(8).replace(/\.?0+$/, '')}`;
  return `$${cost.toFixed(6)}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return rtf.format(-diffMinutes, 'minute');
      }
      return rtf.format(-diffHours, 'hour');
    }
    return rtf.format(-diffDays, 'day');
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

// Helper functions
const getContent = (version: PromptVersion): string => {
  return typeof version.content === 'string' ? version.content : 
         typeof version.content_snapshot === 'string' ? version.content_snapshot : '';
};

const getCommitId = (id: string): string => id.substring(0, 8);

const detectParameters = (content: string): string[] => {
  const matches = content.match(/{{\s*([\w\d_-]+)\s*}}/g);
  return matches ? Array.from(new Set(matches.map(p => p.replace(/[{}]/g, '').trim()))) : [];
};

const renderPromptWithParameters = (content: string, values: Record<string, string>): string => {
  let rendered = content;
  Object.entries(values).forEach(([param, value]) => {
    rendered = rendered.replace(new RegExp(`{{\\s*${param}\\s*}}`, 'g'), value);
  });
  return rendered;
};

// Component functions
function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

const a11yProps = (index: number) => ({
  id: `prompt-tab-${index}`,
  'aria-controls': `prompt-tabpanel-${index}`,
});

// Common styles
const commonStyles = {
  expandableRow: {
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'action.hover' }
  },
  codeBlock: {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    p: 2,
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    overflowX: 'auto',
    bgcolor: 'background.paper',
    fontSize: '0.875rem'
  },
  parameterBox: {
    display: 'flex',
    justifyContent: 'space-between',
    p: 1.5,
    bgcolor: 'grey.100',
    borderRadius: 1
  },
  statusChip: (status: string, isSuccess?: boolean) => ({
    backgroundColor: status === 'success' || isSuccess ? '#c8e6c9' : 
                     status === 'error' ? '#ffcdd2' : '#fff3e0',
    color: status === 'success' || isSuccess ? '#2e7d32' : 
           status === 'error' ? '#c62828' : '#e65100',
    fontFamily: 'monospace',
    fontSize: '0.75rem'
  })
};

// Common UI components
const StatusChip: React.FC<{ success?: boolean; errorMessage?: string; label?: string }> = ({ 
  success, errorMessage, label 
}) => {
  const getStatus = () => {
    if (errorMessage) return { label: 'Failed', color: 'error' };
    if (label) return { label, color: success ? 'success' : 'warning' };
    return { label: success ? 'Success' : 'Pending', color: success ? 'success' : 'warning' };
  };

  const status = getStatus();
  return (
    <Chip 
      label={status.label} 
      size="small" 
      sx={commonStyles.statusChip(status.color, success)}
    />
  );
};

const ParameterDisplay: React.FC<{ parameters?: PromptParameters }> = ({ parameters }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    {Object.entries(normalizeParameters(parameters || DEFAULT_PARAMETERS)).map(([key, value]) => (
      <Box key={key} sx={commonStyles.parameterBox}>
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}:
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
          {typeof value === 'number' ? value : JSON.stringify(value)}
        </Typography>
      </Box>
    ))}
  </Box>
);

const ExpandableTableRow: React.FC<{
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  colSpan: number;
  expandedContent: React.ReactNode;
}> = ({ isExpanded, onToggle, children, colSpan, expandedContent }) => (
  <>
    <TableRow sx={commonStyles.expandableRow} onClick={onToggle}>
      {children}
    </TableRow>
    <TableRow>
      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={colSpan}>
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ margin: 2 }}>{expandedContent}</Box>
        </Collapse>
      </TableCell>
    </TableRow>
  </>
);

// Expandable Version Row Component
interface VersionRowProps {
  version: PromptVersion;
  isCurrentVersion: boolean;
  onVersionSelect: (version: PromptVersion) => void;
  formatDate: (dateString: string) => string;
  defaultParameters: PromptParameters;
}

const VersionRow: React.FC<VersionRowProps> = ({ version, isCurrentVersion, onVersionSelect, formatDate, defaultParameters }) => {
  const [expanded, setExpanded] = useState(false);
  const parameters = version.metadata_json?.parameters || version.parameters || defaultParameters;

  const expandedContent = (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Typography variant="h6" gutterBottom>Prompt Content</Typography>
        <Box sx={{ ...commonStyles.codeBlock, minHeight: '200px' }}>
          {getContent(version) || 'No content available'}
        </Box>
      </Grid>
      <Grid item xs={12} md={4}>
        <Typography variant="h6" gutterBottom>Parameters</Typography>
        <ParameterDisplay parameters={parameters} />
      </Grid>
    </Grid>
  );

  return (
    <ExpandableTableRow
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      colSpan={5}
      expandedContent={expandedContent}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" sx={{ mr: 1 }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          v{version.version_number}
          {isCurrentVersion && <Chip label="Current" size="small" color="primary" sx={{ ml: 1 }} />}
        </Box>
      </TableCell>
      <TableCell>
        <Chip 
          label={getCommitId(version.id)} 
          size="small" 
          sx={{ backgroundColor: '#c8e6c9', color: '#2e7d32', fontFamily: 'monospace', fontSize: '0.75rem' }} 
        />
      </TableCell>
      <TableCell>{version.commit_message || 'No message'}</TableCell>
      <TableCell>{version.author?.username || version.created_by?.username || 'Unknown'}</TableCell>
      <TableCell>{formatDate(version.created_at || version.created_at_deprecated || '')}</TableCell>
    </ExpandableTableRow>
  );
};

// Expandable Run Row Component
interface RunRowProps {
  run: PromptRun;
  onRowClick: (id: string) => void;
  expanded: boolean;
  formatDate: (dateString: string) => string;
}

const RunRow: React.FC<RunRowProps> = ({ run, onRowClick, expanded, formatDate }) => {
  const handleRowClick = (event: React.MouseEvent) => {
    // Don't expand if clicking on action buttons
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    onRowClick(run.id);
  };

  const getStatusChipColor = (success: boolean, errorMessage?: string) => {
    if (errorMessage) return 'error';
    return success ? 'success' : 'warning';
  };

  const getStatusLabel = (success: boolean, errorMessage?: string) => {
    if (errorMessage) return 'Failed';
    return success ? 'Success' : 'Pending';
  };

  const formatMetrics = (metadata: any) => {
    const metrics = {
      processing_time_ms: metadata?.processing_time_ms || 0,
      tokens_input: metadata?.tokens_input || 0,
      tokens_output: metadata?.tokens_output || 0,
      total_tokens: metadata?.total_tokens || 0,
      cost_usd: metadata?.cost_usd || 0,
      cost_input: metadata?.cost_input || 0,
      cost_output: metadata?.cost_output || 0
    };
    
    // Debug logging for cost values
    if (metadata) {
      console.log('Run metadata:', metadata);
      console.log('Formatted metrics:', metrics);
      console.log('Cost breakdown:', {
        cost_input: metrics.cost_input,
        cost_output: metrics.cost_output,
        cost_usd: metrics.cost_usd
      });
    }
    
    return metrics;
  };

  const metrics = formatMetrics(run.metadata);

  return (
    <>
      <TableRow 
        sx={{ 
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
        onClick={handleRowClick}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" sx={{ mr: 1 }}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {run.id}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip 
            label={run.model} 
            size="small" 
            variant="outlined"
            sx={{ fontFamily: 'monospace' }}
          />
        </TableCell>
        <TableCell>
          <Chip 
            label={getStatusLabel(run.success, run.error_message)} 
            size="small" 
            sx={{ 
              backgroundColor: getStatusChipColor(run.success, run.error_message) === 'success' ? '#c8e6c9' : 
                              getStatusChipColor(run.success, run.error_message) === 'error' ? '#ffcdd2' : '#fff3e0',
              color: getStatusChipColor(run.success, run.error_message) === 'success' ? '#2e7d32' : 
                     getStatusChipColor(run.success, run.error_message) === 'error' ? '#c62828' : '#e65100',
              fontFamily: 'monospace',
              fontSize: '0.75rem'
            }}
          />
        </TableCell>
        <TableCell>
          {metrics.processing_time_ms && (
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {metrics.processing_time_ms}ms
            </Typography>
          )}
        </TableCell>
        <TableCell>{formatDate(run.created_at)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
                             {/* Main Content Box */}
               <Box sx={{ 
                 border: '1px solid', 
                 borderColor: 'divider', 
                 borderRadius: 2, 
                 p: 3, 
                 mb: 3,
                 bgcolor: 'background.paper'
               }}>
                 <Grid container spacing={3}>
                   {/* Column 1: Prompt and Output */}
                   <Grid item xs={12} md={8}>
                     {/* Prompt */}
                     <Box sx={{ mb: 3 }}>
                       <Typography variant="h6" gutterBottom>
                         Input Prompt
                       </Typography>
                       <Box
                         sx={{
                           border: '1px solid',
                           borderColor: 'divider',
                           borderRadius: 1,
                           p: 2,
                           minHeight: '100px',
                           maxHeight: '300px',
                           fontFamily: 'monospace',
                           whiteSpace: 'pre-wrap',
                           overflowY: 'auto',
                           bgcolor: 'grey.50',
                           fontSize: '0.875rem'
                         }}
                       >
                         {run.metadata?.prompt_content || run.prompt_content || 'No prompt content available'}
                       </Box>
                     </Box>

                     {/* Output */}
                     <Box>
                       <Typography variant="h6" gutterBottom>
                         Output
                       </Typography>
                       <Box
                         sx={{
                           border: '1.5px solid',
                           borderColor: run.success ? 'success.light' : 'error.light',
                           borderRadius: 2,
                           p: 2,
                           minHeight: '100px',
                           maxHeight: '300px',
                           whiteSpace: 'pre-wrap',
                           overflowY: 'auto',
                          //  bgcolor: run.success ? 'success.light' : 'error.light',
                           fontSize: '0.875rem',
                           opacity: 0.9,
                           bgcolor: 'grey.50',
                         }}
                       >
                         {run.error_message ? (
                           <Typography color="error.dark">
                             Error: {run.error_message}
                           </Typography>
                         ) : (
                           run.output || 'No output available'
                         )}
                       </Box>
                     </Box>
                   </Grid>

                   {/* Column 2: Metadata */}
                   <Grid item xs={12} md={4}>
                     <Typography variant="h6" gutterBottom>
                       Metadata
                     </Typography>
                     
                     <Box sx={{ 
                       border: '1px solid', 
                       borderColor: 'divider', 
                       borderRadius: 1, 
                       p: 2, 
                       height: '427px',
                       overflowY: 'auto',
                       bgcolor: 'grey.50',
                     }}>
                       {/* Model */}
                       <Box sx={{ mb: 3 }}>
                         <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                           Model: <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 'normal' }}>{run.model}</Typography>
                         </Typography>
                       </Box>

                       {/* Processing Time */}
                       {metrics.processing_time_ms && (
                         <Box sx={{ mb: 3 }}>
                           <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                             Processing Time: <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 'normal' }}>{metrics.processing_time_ms}ms</Typography>
                           </Typography>
                         </Box>
                       )}

                       {/* Parameters */}
                       {run.metadata?.model_parameters && Object.keys(run.metadata.model_parameters).length > 0 && (
                         <Box sx={{ mb: 2 }}>
                           <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
                             Parameters:
                           </Typography>
                           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                             {(() => {
                               // Order parameters to match Overview page: temperature, top_p, frequency_penalty, max_tokens, then others
                               const orderedKeys = ['temperature', 'top_p', 'frequency_penalty', 'max_tokens'];
                               const params = run.metadata.model_parameters;
                               const sortedEntries = [];
                               
                               // Add ordered parameters first
                               for (const key of orderedKeys) {
                                 if (params[key] !== undefined) {
                                   sortedEntries.push([key, params[key]]);
                                 }
                               }
                               
                               // Add any remaining parameters
                               for (const [key, value] of Object.entries(params)) {
                                 if (!orderedKeys.includes(key)) {
                                   sortedEntries.push([key, value]);
                                 }
                               }
                               
                               return sortedEntries.map(([key, value]) => (
                                 <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                                   <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                     {key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}:
                                   </Typography>
                                   <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                     {typeof value === 'number' ? value : JSON.stringify(value)}
                                   </Typography>
                                 </Box>
                               ));
                             })()}
                           </Box>
                         </Box>
                       )}
                     </Box>
                   </Grid>
                 </Grid>
               </Box>

               {/* Cost Breakdown Donut Chart - Below the main box */}
               {(metrics.cost_usd || metrics.cost_input || metrics.cost_output) && (
                 <Box sx={{ 
                   border: '1px solid', 
                   borderColor: 'divider', 
                   borderRadius: 2, 
                   p: 3,
                   bgcolor: 'background.paper'
                 }}>
                   <Typography variant="h6" gutterBottom>
                     Cost Breakdown
                   </Typography>
                   <Grid container spacing={3} alignItems="center">
                     {/* Modern Donut Chart */}
                     <Grid item xs={12} md={8}>
                       <Box sx={{ height: 300, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                         {(() => {
                           const inputCost = metrics.cost_input || 0;
                           const outputCost = metrics.cost_output || 0;
                           const totalCost = inputCost + outputCost;
                           
                           if (totalCost === 0) {
                             return (
                               <Box sx={{ textAlign: 'center' }}>
                                 <Typography variant="body2" color="text.secondary">
                                   No cost data available
                                 </Typography>
                               </Box>
                             );
                           }
                           
                           const chartData = {
                             labels: ['Input Tokens', 'Output Tokens'],
                             datasets: [
                               {
                                 data: [inputCost, outputCost],
                                 backgroundColor: [
                                   'rgba(255, 193, 7, 0.8)',
                                   'rgba(54, 162, 235, 0.8)'
                                 ],
                                 borderWidth: 2,
                                 hoverBackgroundColor: [
                                   'rgba(255, 193, 7, 1)',
                                   'rgba(54, 162, 235, 1)'
                                 ],
                                 hoverBorderWidth: 3,
                                 cutout: '70%',
                               }
                             ]
                           };
                           
                           const chartOptions: ChartOptions<'doughnut'> = {
                             responsive: true,
                             maintainAspectRatio: false,
                             plugins: {
                               legend: {
                                 display: false
                               },
                               tooltip: {
                                 enabled: true,
                                 backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                 titleColor: 'white',
                                 bodyColor: 'white',
                                 borderColor: 'rgba(255, 255, 255, 0.2)',
                                 borderWidth: 1,
                                 cornerRadius: 8,
                                 displayColors: true,
                                 callbacks: {
                                   label: function(context) {
                                     const label = context.label || '';
                                     const value = context.parsed;
                                     const tokens = label === 'Input Tokens' ? metrics.tokens_input : metrics.tokens_output;
                                     return `${label}: ${formatCost(value)} (${tokens} tokens)`;
                                   }
                                 }
                               }
                             },
                             onHover: (event, elements) => {
                               const centerTextElement = document.getElementById(`center-text-${run.id}`);
                               if (centerTextElement) {
                                 if (elements.length > 0) {
                                   const elementIndex = elements[0].index;
                                   const value = chartData.datasets[0].data[elementIndex];
                                   const label = chartData.labels[elementIndex];
                                   const tokens = elementIndex === 0 ? metrics.tokens_input : metrics.tokens_output;
                                   
                                   centerTextElement.innerHTML = `
                                     <div style="text-align: center;">
                                       <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #666;">${label}</div>
                                       <div style="font-size: 16px; font-weight: bold; font-family: monospace; color: #1976d2;">${formatCost(value)}</div>
                                       <div style="font-size: 12px; color: #999; margin-top: 2px;">${tokens} tokens</div>
                                     </div>
                                   `;
                                 } else {
                                   centerTextElement.innerHTML = `
                                     <div style="text-align: center;">
                                       <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #666;">Total Cost</div>
                                       <div style="font-size: 16px; font-weight: bold; font-family: monospace; color: #1976d2;">${formatCost(totalCost)}</div>
                                       <div style="font-size: 12px; color: #999; margin-top: 2px;">${metrics.total_tokens || 0} tokens</div>
                                     </div>
                                   `;
                                 }
                               }
                             },
                             animation: {
                               animateRotate: true,
                               animateScale: true,
                               duration: 1000,
                               easing: 'easeOutQuart'
                             }
                           };
                           
                           return (
                             <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                               <Doughnut data={chartData} options={chartOptions} />
                               <Box
                                 id={`center-text-${run.id}`}
                                 sx={{
                                   position: 'absolute',
                                   top: '50%',
                                   left: '50%',
                                   transform: 'translate(-50%, -50%)',
                                   pointerEvents: 'none',
                                   zIndex: 10
                                 }}
                               >
                                 <div style={{ textAlign: 'center' }}>
                                   <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#666' }}>Total Cost</div>
                                   <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', color: '#1976d2' }}>{formatCost(totalCost)}</div>
                                   <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>{metrics.total_tokens || 0} tokens</div>
                                 </div>
                               </Box>
                             </Box>
                           );
                         })()}
                       </Box>
                     </Grid>
                     
                     {/* Legend */}
                     <Grid item xs={12} md={4}>
                       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                         {(() => {
                           const inputCost = metrics.cost_input || 0;
                           const outputCost = metrics.cost_output || 0;
                           const totalCost = inputCost + outputCost;
                           
                           const data = [
                             {
                               name: 'Input Tokens',
                               value: inputCost,
                               tokens: metrics.tokens_input || 0,
                               color: 'linear-gradient(45deg, #ffc107, #ffeb3b)'
                             },
                             {
                               name: 'Output Tokens',
                               value: outputCost,
                               tokens: metrics.tokens_output || 0,
                               color: 'linear-gradient(45deg, #36a2eb, #64b5f6)'
                             }
                           ];
                           
                           return (
                             <>
                               {data.map((entry) => (
                                 entry.value > 0 && (
                                   <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                     <Box sx={{ width: 20, height: 20, borderRadius: '50%', background: entry.color }} />
                                     <Box sx={{ flex: 1 }}>
                                       <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                         {entry.name}
                                       </Typography>
                                       <Typography variant="body2" color='#1976d2'>
                                         {entry.tokens} tokens
                                       </Typography>
                                     </Box>
                                     <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', color: '#1976d2' }}>
                                       {formatCost(entry.value)}
                                     </Typography>
                                   </Box>
                                 )
                               ))}
                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: '0.5px solid', borderRadius: 1, bgcolor: 'grey.50', borderColor: 'divider' }}>
                                 <Box sx={{ flex: 1 }}>
                                   <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                     Total cost
                                   </Typography>
                                   <Typography variant="body2" color="text.secondary">
                                     {metrics.total_tokens || 0} tokens
                                   </Typography>
                                 </Box>
                                 <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                   {formatCost(totalCost)}
                                 </Typography>
                               </Box>
                             </>
                           );
                         })()}
                       </Box>
                     </Grid>
                   </Grid>
                 </Box>
               )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// Expandable Merge Request Row Component
interface MergeRequestRowProps {
  mergeRequest: MergeRequest;
  currentContent: string;
  currentParameters: PromptParameters;
  onMerge: (id: string) => void;
  onReject: (id: string) => void;
  onRowClick: (id: string) => void;
  expanded: boolean;
  loading: boolean;
  formatDate: (dateString: string) => string;
  canManage: boolean;
}

const MergeRequestRow: React.FC<MergeRequestRowProps> = ({ 
  mergeRequest, 
  currentContent, 
  currentParameters, 
  onMerge, 
  onReject, 
  onRowClick, 
  expanded, 
  loading,
  formatDate,
  canManage
}) => {
  const getMergeRequestParameters = (mr: MergeRequest): PromptParameters => {
    const params = mr.metadata_json?.parameters || currentParameters;
    return normalizeParameters(params);
  };

  const getNormalizedCurrentParameters = (): PromptParameters => {
    return normalizeParameters(currentParameters);
  };

  const getCommitId = (mr: MergeRequest): string => {
    return mr.id.substring(0, 8);
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'warning';
      case 'MERGED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'Open';
      case 'MERGED':
        return 'Merged';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  const handleRowClick = (event: React.MouseEvent) => {
    // Don't expand if clicking on action buttons
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    onRowClick(mergeRequest.id);
  };

  return (
    <>
      <TableRow 
        sx={{ 
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
        onClick={handleRowClick}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" sx={{ mr: 1 }}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Chip 
              label={getCommitId(mergeRequest)} 
              size="small" 
              sx={{ 
                backgroundColor: '#f5f5f5', 
                color: '#616161',
                fontFamily: 'monospace',
                fontSize: '0.75rem'
              }} 
            />
          </Box>
        </TableCell>
        <TableCell>{mergeRequest.description}</TableCell>
        <TableCell>{mergeRequest.creator?.username || 'Unknown'}</TableCell>
        <TableCell>
          <Chip 
            label={getStatusLabel(mergeRequest.status)} 
            size="small" 
            sx={{ 
              backgroundColor: getStatusChipColor(mergeRequest.status) === 'success' ? '#c8e6c9' : 
                              getStatusChipColor(mergeRequest.status) === 'error' ? '#ffcdd2' : '#fff3e0',
              color: getStatusChipColor(mergeRequest.status) === 'success' ? '#2e7d32' : 
                     getStatusChipColor(mergeRequest.status) === 'error' ? '#c62828' : '#e65100',
              fontFamily: 'monospace',
              fontSize: '0.75rem'
            }}
          />
        </TableCell>
        <TableCell>{formatDate(mergeRequest.created_at)}</TableCell>
        <TableCell>
          {mergeRequest.status === 'OPEN' && canManage ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                variant="outlined" 
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(mergeRequest.id);
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={16} /> : 'Reject'}
              </Button>
              <Button 
                size="small" 
                variant="contained" 
                color="success"
                onClick={(e) => {
                  e.stopPropagation();
                  onMerge(mergeRequest.id);
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={16} /> : 'Merge'}
              </Button>
            </Box>
          ) : (
            <Button size="small" variant="outlined" disabled>
              {getStatusLabel(mergeRequest.status)}
            </Button>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom>
                Proposed Changes
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom color="error.main">
                    Base Version Content
                  </Typography>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'error.light',
                      borderRadius: 1,
                      p: 2,
                      minHeight: '200px',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      overflowX: 'auto',
                      bgcolor: '#ffebee',
                      fontSize: '0.875rem'
                    }}
                  >
                    {currentContent || 'No base version content'}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom color="success.main">
                    Proposed Content
                  </Typography>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'success.light',
                      borderRadius: 1,
                      p: 2,
                      minHeight: '200px',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      overflowX: 'auto',
                      bgcolor: '#e8f5e8',
                      fontSize: '0.875rem'
                    }}
                  >
                    {mergeRequest.content || 'No proposed content'}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Base Version Parameters
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {Object.entries(getNormalizedCurrentParameters()).map(([key, value]) => (
                      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: '#ffebee', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          {typeof value === 'number' ? value : JSON.stringify(value)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Proposed Parameters
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {Object.entries(getMergeRequestParameters(mergeRequest)).map(([key, value]) => (
                      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          {typeof value === 'number' ? value : JSON.stringify(value)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const Prompt: React.FC = () => {
  const { promptId } = useParams<{ promptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State hooks
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState<PromptType | null>(null);
  const [currentVersion, setCurrentVersion] = useState<PromptVersion | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [promptRuns, setPromptRuns] = useState<PromptRun[]>([]);
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);
  const [mergeRequestFilter, setMergeRequestFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [parameters, setParameters] = useState<PromptParameters>({
    temperature: 0.7,
    top_p: 1.0,
    frequency_penalty: 0.0,
    max_tokens: 500
  });
  const [error, setError] = useState<string | null>(null);
  
  // Merge Request Modal state
  const [mergeRequestModalOpen, setMergeRequestModalOpen] = useState(false);
  const [mergeRequestForm, setMergeRequestForm] = useState({
    description: ''
  });

  // Prompt Optimizer Modal state
  const [promptOptimizerModalOpen, setPromptOptimizerModalOpen] = useState(false);
  const [optimizerForm, setOptimizerForm] = useState({
    instructions: ''
  });
  
  // Optimization results state
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);

  // Parameter Injection state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [detectedParameters, setDetectedParameters] = useState<string[]>([]);
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({});
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testRunId, setTestRunId] = useState<string | null>(null);
  const [testMetrics, setTestMetrics] = useState<any>(null);
  
  // Model selection state
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Merge Request state
  const [expandedMergeRequests, setExpandedMergeRequests] = useState<Set<string>>(new Set());
  const [mergeRequestLoading, setMergeRequestLoading] = useState<string | null>(null);

  // Runs table state
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
  const [runSearchQuery, setRunSearchQuery] = useState<string>('');

  // Version metrics state for evolution analytics
  const [versionMetrics, setVersionMetrics] = useState<any[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // User organizations for permission checking
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);

  // Permission checking functions
  const canEditPrompt = (): boolean => {
    if (!user || !prompt) return false;
    
    // User owns the repository that contains the prompt
    if (prompt.repository?.owner_user_id === user.id) {
      return true;
    }
    
    // For organization-owned repositories, check if user is a member
    if (prompt.repository?.owner_org_id) {
      return userOrganizations.some(org => org.id === prompt.repository?.owner_org_id);
    }
    
    return false;
  };

  const canManageMergeRequests = (): boolean => {
    return canEditPrompt(); // Same permissions for now
  };

  // Get content depending on what's available in the version
  const getContent = (version: PromptVersion): string => {
    if (typeof version.content === 'string') {
      return version.content;
    } 
    if (typeof version.content_snapshot === 'string') {
      return version.content_snapshot;
    }
    return '';
  };

  // Set edited content from version
  const setContentFromVersion = (version: PromptVersion) => {
    setEditedContent(getContent(version));
  };

  // Parameter detection and rendering functions
  const detectParameters = (content: string): string[] => {
    const paramMatches = content.match(/{{\s*([\w\d_-]+)\s*}}/g);
    if (!paramMatches) return [];
    
    const uniqueParams = Array.from(new Set(paramMatches.map(p => p.replace(/[{}]/g, '').trim())));
    return uniqueParams;
  };

  const renderPromptWithParameters = (content: string, values: Record<string, string>): string => {
    let renderedPrompt = content;
    Object.entries(values).forEach(([param, value]) => {
      const regex = new RegExp(`{{\\s*${param}\\s*}}`, 'g');
      renderedPrompt = renderedPrompt.replace(regex, value);
    });
    return renderedPrompt;
  };

  // Check if current edits are different from the latest version
  const hasChanges = (): boolean => {
    if (!currentVersion) return true;
    
    const currentContent = getContent(currentVersion);
    const currentParams = currentVersion.metadata_json?.parameters || currentVersion.parameters || {
      temperature: 0.7,
      top_p: 1.0,
      frequency_penalty: 0.0,
      max_tokens: 500
    };
    
    const contentChanged = editedContent !== currentContent;
    
    // Deep compare parameters with consistent ordering
    const paramsChanged = !deepEqualParameters(parameters, currentParams);
    
    return contentChanged || paramsChanged;
  };

  // Handle merge request form submission
  const handleMergeRequestSubmit = async () => {
    if (!hasChanges()) {
      setError('No changes detected. Cannot create merge request.');
      return;
    }
    
    if (!promptId) {
      setError('Prompt ID is required.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create merge request using the API
      const mergeRequestData = {
        description: mergeRequestForm.description,
        content: editedContent,
        metadata_json: {
          parameters: normalizeParameters(parameters)
        }
      };
      
      await PromptService.createMergeRequest(promptId, mergeRequestData);
      
      // Refresh merge requests data
      const mergeRequestsData = await PromptService.getPromptMergeRequests(promptId);
      setMergeRequests(mergeRequestsData || []);
      
      // Close modal and reset form
      setMergeRequestModalOpen(false);
      setMergeRequestForm({ description: '' });
      
      // Show success message
      setError(null);
      // You could add a success toast here
      
    } catch (error: any) {
      console.error('Error creating merge request:', error);
      setError(error.response?.data?.message || 'Failed to create merge request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening merge request modal
  const handleOpenMergeRequest = () => {
    if (!hasChanges()) {
      setError('No changes detected. Make changes to the content or parameters first.');
      return;
    }
    setMergeRequestModalOpen(true);
  };

  // Handle enhance button click
  const handleEnhanceClick = () => {
    if (!editMode) {
      setEditMode(true);
      if (currentVersion) {
        setContentFromVersion(currentVersion);
      }
    }
    setPromptOptimizerModalOpen(true);
  };

  // Handle closing prompt optimizer modal
  const handleCloseOptimizerModal = () => {
    setPromptOptimizerModalOpen(false);
    setOptimizationResult(null);
    setOptimizerForm({ instructions: '' });
    setError(null);
  };

  // Handle prompt optimizer form submission
  const handleOptimizerSubmit = async () => {
    try {
      setOptimizationLoading(true);
      setError(null);
      
      const optimizationData = {
        prompt: editedContent,
        instructions: optimizerForm.instructions,
        temperature: parameters.temperature,
        max_tokens: parameters.max_tokens,
        model: selectedModel || 'gemini-1.5-flash'
      };
      
      console.log('Sending optimization request:', optimizationData);
      
      // Use PromptService for consistency with other API calls
      const result = await PromptService.optimizePrompt(optimizationData);
      
      console.log('Optimization result:', result);
      setOptimizationResult(result);
      
      // Don't close modal - show results instead
      
    } catch (error: any) {
      console.error('Error optimizing prompt:', error);
      
      // Provide more specific error messages based on error type
      if (error.response) {
        // API returned an error response
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error;
        
        if (status === 401) {
          setError('Authentication required. Please log in again.');
        } else if (status === 404) {
          setError('Optimization service not found. Please check if the backend server is running.');
        } else if (status === 503) {
          setError('Optimization service temporarily unavailable. Please try again later.');
        } else {
          setError(message || `Server error (${status}). Please try again.`);
        }
      } else if (error.request) {
        // Network error
        setError('Could not connect to the server. Please ensure the backend is running.');
      } else {
        // Other error
        setError(error.message || 'Failed to optimize prompt. Please try again.');
      }
    } finally {
      setOptimizationLoading(false);
    }
  };
  
  // Handle accepting optimized prompt
  const handleAcceptOptimization = () => {
    if (optimizationResult && optimizationResult.optimized_prompt) {
      setEditedContent(optimizationResult.optimized_prompt);
      setPromptOptimizerModalOpen(false);
      setOptimizationResult(null);
      setOptimizerForm({ instructions: '' });
    }
  };
  
  // Handle rejecting optimized prompt
  const handleRejectOptimization = () => {
    setOptimizationResult(null);
    // Keep modal open so user can try different instructions
  };

  // Handle test button click - unified behavior for all prompts
  const handleTestClick = () => {
    const content = editMode ? editedContent : (currentVersion ? getContent(currentVersion) : '');
    const params = detectParameters(content);
    
    // Always show the modal for prompt preview and model selection (unified behavior)
    setDetectedParameters(params);
    const initialValues: Record<string, string> = {};
    params.forEach(param => {
      initialValues[param] = '';
    });
    setParameterValues(initialValues);
    
    // Reset any previous test results
    setTestResult(null);
    setTestRunId(null);
    setTestMetrics(null);
    setError(null);
    
    setTestModalOpen(true);
  };

  // Handle running the test with parameters
  const handleRunTest = async (content: string, values: Record<string, string>) => {
    if (!promptId) return;
    
    try {
      setTestLoading(true);
      setError(null);
      
      const renderedPrompt = renderPromptWithParameters(content, values);
      
      // Execute prompt using the API
      const promptRunData = {
        prompt: renderedPrompt,
        parameters: parameters, // Model parameters (temperature, top_p, etc.)
        input: values, // Input variables for the prompt
        model: selectedModel || 'gemini-1.5-flash' // Default model if none selected
      };
      
      const result = await PromptService.executePrompt(promptId, promptRunData);
      setTestResult(result.output || result.response || 'Test completed successfully.');
      setTestRunId(result.run_id || null);
      setTestMetrics(result.metrics || null);
      
      // Refresh the runs data to show the new run
      if (promptId) {
        try {
          const runsData = await PromptService.getPromptRuns(promptId);
          setPromptRuns(runsData?.runs || []);
        } catch (error) {
          console.error('Error refreshing runs data:', error);
        }
      }
      
      // Don't close modal - show results within the same modal
    } catch (error: any) {
      console.error('Error running prompt test:', error);
      setError(error.response?.data?.message || 'Failed to run prompt test. Please try again.');
    } finally {
      setTestLoading(false);
    }
  };

  // Handle parameter value change
  const handleParameterValueChange = (param: string, value: string) => {
    setParameterValues(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // Handle test modal submit
  const handleTestModalSubmit = () => {
    const content = editMode ? editedContent : (currentVersion ? getContent(currentVersion) : '');
    
    // Check if model is selected
    if (!selectedModel) {
      setError('Please select a model first');
      return;
    }
    
    // Check if all parameters have values (only if parameters are detected)
    const missingParams = detectedParameters.filter(param => !parameterValues[param]?.trim());
    if (detectedParameters.length > 0 && missingParams.length > 0) {
      setError(`Please provide values for: ${missingParams.join(', ')}`);
      return;
    }
    
    handleRunTest(content, parameterValues);
  };

  // Handle merge request row expansion
  const handleMergeRequestRowClick = (mergeRequestId: string) => {
    setExpandedMergeRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mergeRequestId)) {
        newSet.delete(mergeRequestId);
      } else {
        newSet.add(mergeRequestId);
      }
      return newSet;
    });
  };

  // Handle merge request merge
  const handleMergeMergeRequest = async (mergeRequestId: string) => {
    if (!promptId) return;
    
    try {
      setMergeRequestLoading(mergeRequestId);
      setError(null);
      
      await PromptService.mergeMergeRequest(mergeRequestId);
      
      // Refresh data
      const [mergeRequestsData, versionsData, metricsData] = await Promise.all([
        PromptService.getPromptMergeRequests(promptId),
        PromptService.getPromptVersions(promptId),
        PromptService.getPromptVersionMetrics(promptId)
      ]);
      
      setMergeRequests(mergeRequestsData || []);
      setVersions(versionsData || []);
      setVersionMetrics(metricsData.version_metrics || []);
      
      // Update current version to the latest
      if (versionsData && versionsData.length > 0) {
        const latestVersion = versionsData.sort((a: PromptVersion, b: PromptVersion) => 
          new Date(b.created_at || b.created_at_deprecated || '').getTime() - 
          new Date(a.created_at || a.created_at_deprecated || '').getTime()
        )[0];
        setCurrentVersion(latestVersion);
        setContentFromVersion(latestVersion);
      }
      
    } catch (error: any) {
      console.error('Error merging merge request:', error);
      setError(error.response?.data?.message || 'Failed to merge request. Please try again.');
    } finally {
      setMergeRequestLoading(null);
    }
  };

  // Handle merge request rejection
  const handleRejectMergeRequest = async (mergeRequestId: string) => {
    if (!promptId) return;
    
    try {
      setMergeRequestLoading(mergeRequestId);
      setError(null);
      
      await PromptService.rejectMergeRequest(mergeRequestId);
      
      // Refresh merge requests data
      const mergeRequestsData = await PromptService.getPromptMergeRequests(promptId);
      setMergeRequests(mergeRequestsData || []);
      
    } catch (error: any) {
      console.error('Error rejecting merge request:', error);
      setError(error.response?.data?.message || 'Failed to reject request. Please try again.');
    } finally {
      setMergeRequestLoading(null);
    }
  };

  // Handle run row expansion
  const handleRunRowClick = (runId: string) => {
    setExpandedRuns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(runId)) {
        newSet.delete(runId);
      } else {
        newSet.add(runId);
      }
      return newSet;
    });
  };

  // Filter runs based on search query
  const getFilteredRuns = () => {
    if (!runSearchQuery.trim()) {
      return promptRuns;
    }
    return promptRuns.filter(run => 
      run.id.toLowerCase().includes(runSearchQuery.toLowerCase())
    );
  };

  // Fetch version metrics for evolution analytics
  const fetchVersionMetrics = async () => {
    if (!promptId) return;
    
    try {
      setMetricsLoading(true);
      const metricsData = await PromptService.getPromptVersionMetrics(promptId);
      setVersionMetrics(metricsData.version_metrics || []);
    } catch (error) {
      console.error('Error fetching version metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await PromptService.getAvailableModels();
        setAvailableModels(models);
        if (models.length > 0) {
          setSelectedModel(models[0].id);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        // Set a fallback model if fetch fails
        // const fallbackModels = [
        //   { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google' }
        // ];
        // setAvailableModels(fallbackModels);
        setSelectedModel('gemini-1.5-flash');
      }
    };
    
    fetchModels();
  }, []);

  // Fetch prompt, versions, runs, and merge requests
  useEffect(() => {
    const fetchUserOrganizations = async () => {
      if (!user) {
        setUserOrganizations([]);
        return;
      }
      
      try {
        const response = await OrganizationService.getUserOrganizations();
        setUserOrganizations(response || []);
      } catch (error) {
        console.error('Error fetching user organizations:', error);
        setUserOrganizations([]);
      }
    };

    const fetchPromptData = async () => {
      if (!promptId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user organizations first for permission checking
        await fetchUserOrganizations();
        
        // Fetch prompt data
        const promptData = await PromptService.getPrompt(promptId);
        setPrompt(promptData);
        
        // Fetch versions
        const versionsData = await PromptService.getPromptVersions(promptId);
        setVersions(versionsData || []);
        
        // Fetch prompt runs
        const runsData = await PromptService.getPromptRuns(promptId);
        setPromptRuns(runsData?.runs || []);
        
        // Fetch merge requests
        const mergeRequestsData = await PromptService.getPromptMergeRequests(promptId);
        setMergeRequests(mergeRequestsData || []);

        // Fetch version metrics
        const metricsData = await PromptService.getPromptVersionMetrics(promptId);
        setVersionMetrics(metricsData.version_metrics || []);
        
        // Set latest version as current
        if (versionsData && versionsData.length > 0) {
          const latestVersion = versionsData.sort((a: PromptVersion, b: PromptVersion) => 
            new Date(b.created_at || b.created_at_deprecated || '').getTime() - 
            new Date(a.created_at || a.created_at_deprecated || '').getTime()
          )[0];
          
          setCurrentVersion(latestVersion);
          setContentFromVersion(latestVersion);
          
          // Set parameters if available from metadata_json or direct parameters
          const versionParams = latestVersion.metadata_json?.parameters || latestVersion.parameters;
          if (versionParams) {
            setParameters({
              ...parameters,
              ...versionParams
            });
          }
        }
      } catch (error: any) {
        console.error('Error fetching prompt data:', error);
        if (error.response && error.response.status === 401) {
          setError('This is a private prompt that requires authentication. Please log in to view it.');
        } else if (error.response && error.response.status === 403) {
          setError('You do not have permission to view this private prompt.');
        } else {
          setError('Failed to load prompt. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPromptData();
  }, [promptId]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Toggle edit mode
  const handleToggleEditMode = () => {
    if (editMode) {
      // Discard changes
      if (currentVersion) {
        setContentFromVersion(currentVersion);
      }
    } else {
      // Enter edit mode
      if (currentVersion) {
        setContentFromVersion(currentVersion);
      }
    }
    setEditMode(!editMode);
  };

  // Handle selecting a different version
  const handleVersionSelect = (version: PromptVersion) => {
    setCurrentVersion(version);
    setContentFromVersion(version);
    
    // Update parameters if available
    const versionParams = version.metadata_json?.parameters || version.parameters;
    if (versionParams) {
      setParameters({
        ...parameters,
        ...versionParams
      });
    }
    
    // Switch to overview tab
    setTabValue(0);
  };

  // Handle parameter changes
  const handleParameterChange = (param: keyof PromptParameters, value: number) => {
    setParameters(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // Helper function to find the base version that existed when merge request was created
  const getBaseVersionForMergeRequest = (mergeRequest: MergeRequest): { content: string; parameters: PromptParameters } => {
    if (versions.length === 0) {
      return {
        content: '',
        parameters: {
          temperature: 0.7,
          top_p: 1.0,
          frequency_penalty: 0.0,
          max_tokens: 500
        }
      };
    }

    // Find the latest version that was created before this merge request
    const mergeRequestDate = new Date(mergeRequest.created_at);
    const eligibleVersions = versions.filter(version => {
      const versionDate = new Date(version.created_at || version.created_at_deprecated || '');
      return versionDate <= mergeRequestDate;
    });

    // Sort by creation date descending and take the most recent one
    const baseVersion = eligibleVersions
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.created_at_deprecated || '').getTime();
        const dateB = new Date(b.created_at || b.created_at_deprecated || '').getTime();
        return dateB - dateA;
      })[0];

    if (!baseVersion) {
      // If no version existed before the merge request, use empty defaults
      return {
        content: '',
        parameters: {
          temperature: 0.7,
          top_p: 1.0,
          frequency_penalty: 0.0,
          max_tokens: 500
        }
      };
    }

    return {
      content: getContent(baseVersion),
      parameters: baseVersion.metadata_json?.parameters || baseVersion.parameters || {
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0.0,
        max_tokens: 500
      }
    };
  };

  // Filter merge requests based on selected filter
  const getFilteredMergeRequests = () => {
    if (mergeRequestFilter === 'open') {
      return mergeRequests.filter(mr => mr.status === 'OPEN');
    } else if (mergeRequestFilter === 'closed') {
      return mergeRequests.filter(mr => mr.status !== 'OPEN');
    }
    return mergeRequests;
  };

  // Chart configuration helper
  const createCostChart = (metrics: any, runId: string) => {
    const inputCost = metrics.cost_input || 0;
    const outputCost = metrics.cost_output || 0;
    const totalCost = inputCost + outputCost;

    if (totalCost === 0) return null;

    const chartData = {
      labels: ['Input Tokens', 'Output Tokens'],
      datasets: [{
        data: [inputCost, outputCost],
        backgroundColor: ['rgba(255, 193, 7, 0.8)', 'rgba(54, 162, 235, 0.8)'],
        borderWidth: 2,
        hoverBackgroundColor: ['rgba(255, 193, 7, 1)', 'rgba(54, 162, 235, 1)'],
        hoverBorderWidth: 3,
        cutout: '70%',
      }]
    };

    const chartOptions: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const tokens = label === 'Input Tokens' ? metrics.tokens_input : metrics.tokens_output;
              return `${label}: ${formatCost(value)} (${tokens} tokens)`;
            }
          }
        }
      },
      animation: { duration: 1000, easing: 'easeOutQuart' }
    };

    return { chartData, chartOptions, totalCost };
  };

  const MetricsDisplay: React.FC<{ run: PromptRun }> = ({ run }) => {
    const metrics = {
      processing_time_ms: run.metadata?.processing_time_ms || 0,
      tokens_input: run.metadata?.tokens_input || 0,
      tokens_output: run.metadata?.tokens_output || 0,
      total_tokens: run.metadata?.total_tokens || 0,
      cost_usd: run.metadata?.cost_usd || 0,
      cost_input: run.metadata?.cost_input || 0,
      cost_output: run.metadata?.cost_output || 0
    };

    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, height: '427px', overflowY: 'auto', bgcolor: 'grey.50' }}>
        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Model: <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 'normal' }}>{run.model}</Typography>
        </Typography>
        
        {metrics.processing_time_ms > 0 && (
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Processing Time: <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 'normal' }}>{metrics.processing_time_ms}ms</Typography>
          </Typography>
        )}
        
        {run.metadata?.model_parameters && Object.keys(run.metadata.model_parameters).length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>Parameters:</Typography>
            <ParameterDisplay parameters={run.metadata.model_parameters as PromptParameters} />
          </Box>
        )}
      </Box>
    );
  };

  if (loading && !prompt) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !prompt) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ pt: 4, pb: 2 }} maxWidth="lg" mx="auto">
          <Alert severity="error" sx={{ my: 4 }}>
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header area */}
      <Box sx={{ pt: 4}} maxWidth="lg" mx="auto">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {prompt?.title || 'Prompt'}
          </Typography>
          {tabValue === 0 && canEditPrompt() && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleToggleEditMode}
            >
              {editMode ? 'Cancel' : 'Edit'}
            </Button>
          )}
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {prompt?.repository?.description || prompt?.description || 'Prompt details and configuration'}
        </Typography>
      </Box>
      
      {/* Main content */}
      <Paper sx={{ p: 3, borderRadius: 2, maxWidth: "lg", mx: "auto" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ mb: 3 }}
        >
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label="Versions" {...a11yProps(1)} />
          <Tab label="Runs" {...a11yProps(2)} />
          <Tab label="Merge Requests" {...a11yProps(3)} />
          <Tab label="Prompt Evolution" {...a11yProps(4)} />
        </Tabs>
        
        {/* Overview tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Prompt content */}
            <Grid item xs={12} md={8}>
              {editMode ? (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <TextField
                    multiline
                    fullWidth
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    variant="outlined"
                    placeholder="Enter your prompt here..."
                    InputProps={{
                      sx: {
                        fontFamily: 'monospace',
                        '& textarea': {
                          resize: 'vertical',
                          minHeight: '100px',
                          maxHeight: '600px'
                        }
                      }
                    }}
                    sx={{ mb: 2 }}
                    minRows={3}
                  />
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    minHeight: '300px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto',
                    bgcolor: 'background.paper'
                  }}
                >
                  {currentVersion ? getContent(currentVersion) : "No prompt content available. Click the Edit button to add content."}
                </Box>
              )}
              
              {/* Action buttons - always visible */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                {canEditPrompt() && (
                  <Button
                    variant="contained"
                    startIcon={<AutoAwesome />}
                    sx={{
                      background: 'linear-gradient(45deg, #8a2387 0%, #e94057 50%, #f27121 100%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #7a1f77 0%, #d63847 50%, #e26111 100%)'
                      }
                    }}
                    onClick={handleEnhanceClick}
                  >
                    Enhance
                  </Button>
                )}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleTestClick}
                    disabled={testLoading}
                  >
                    {testLoading ? <CircularProgress size={20} /> : 'Test'}
                  </Button>
                  {editMode && canEditPrompt() && (
                    <Button
                      variant="contained"
                      startIcon={<CommitIcon />}
                      onClick={handleOpenMergeRequest}
                      disabled={!hasChanges()}
                    >
                      Commit
                    </Button>
                  )}
                </Box>
              </Box>
              
              {/* Parameter indicator */}
              {(() => {
                const content = editMode ? editedContent : (currentVersion ? getContent(currentVersion) : '');
                const params = detectParameters(content);
                return params.length > 0 ? (
                  <Alert severity="info" sx={{ mt: 2, p: 2, borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip 
                        label={`${params.length} parameter${params.length > 1 ? 's' : ''} detected`}
                        size="small"
                        color="info"
                        variant="filled"
                      />
                      <Typography variant="caption" color="info.dark" sx={{ fontWeight: 'medium' }}>
                        {params.map(param => `{{${param}}}`).join(', ')}
                      </Typography>
                    </Box>
                      When you click Test, you'll be prompted to provide values for these parameters.
                  </Alert>
                ) : null;
              })()}
            </Grid>
            
            {/* Parameters panel - always visible */}
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                backgroundColor: 'background.paper',
                p: 3,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="h6" fontWeight="bold">Parameters</Typography>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">Temperature</Typography>
                      <Tooltip title="Controls randomness: Lower values are more deterministic, higher values more creative.">
                        <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }}>
                          <QuestionMark sx={{ fontSize: 12, color: 'text.secondary' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>{parameters.temperature}</Typography>
                  </Box>
                  <Slider
                    value={parameters.temperature}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={(_, value) => handleParameterChange('temperature', value as number)}
                    valueLabelDisplay="auto"
                    sx={{ 
                      color: 'primary.main',
                      height: 4,
                      '& .MuiSlider-track': {
                        border: 'none',
                        borderRadius: 2,
                      },
                      '& .MuiSlider-thumb': {
                        height: 16,
                        width: 16,
                        backgroundColor: 'primary.main',
                        border: '2px solid currentColor',
                        '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                          boxShadow: 'inherit',
                        },
                        '&:before': {
                          display: 'none',
                        },
                      },
                      '& .MuiSlider-rail': {
                        color: 'grey.300',
                        opacity: 1,
                        borderRadius: 2,
                      },
                    }}
                    disabled={!editMode || !canEditPrompt()}
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">Top P</Typography>
                      <Tooltip title="Controls diversity via nucleus sampling.">
                        <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }}>
                          <QuestionMark sx={{ fontSize: 12, color: 'text.secondary' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>{parameters.top_p}</Typography>
                  </Box>
                  <Slider
                    value={parameters.top_p}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={(_, value) => handleParameterChange('top_p', value as number)}
                    valueLabelDisplay="auto"
                    sx={{ 
                      color: 'primary.main',
                      height: 4,
                      '& .MuiSlider-track': {
                        border: 'none',
                        borderRadius: 2,
                      },
                      '& .MuiSlider-thumb': {
                        height: 16,
                        width: 16,
                        backgroundColor: 'primary.main',
                        border: '2px solid currentColor',
                        '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                          boxShadow: 'inherit',
                        },
                        '&:before': {
                          display: 'none',
                        },
                      },
                      '& .MuiSlider-rail': {
                        color: 'grey.300',
                        opacity: 1,
                        borderRadius: 2,
                      },
                    }}
                    disabled={!editMode || !canEditPrompt()}
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">Frequency Penalty</Typography>
                      <Tooltip title="Reduces repetition of token sequences.">
                        <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }}>
                          <QuestionMark sx={{ fontSize: 12, color: 'text.secondary' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>{parameters.frequency_penalty}</Typography>
                  </Box>
                  <Slider
                    value={parameters.frequency_penalty}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={(_, value) => handleParameterChange('frequency_penalty', value as number)}
                    valueLabelDisplay="auto"
                    sx={{ 
                      color: 'primary.main',
                      height: 4,
                      '& .MuiSlider-track': {
                        border: 'none',
                        borderRadius: 2,
                      },
                      '& .MuiSlider-thumb': {
                        height: 16,
                        width: 16,
                        backgroundColor: 'primary.main',
                        border: '2px solid currentColor',
                        '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                          boxShadow: 'inherit',
                        },
                        '&:before': {
                          display: 'none',
                        },
                      },
                      '& .MuiSlider-rail': {
                        color: 'grey.300',
                        opacity: 1,
                        borderRadius: 2,
                      },
                    }}
                    disabled={!editMode || !canEditPrompt()}
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">Max Tokens</Typography>
                      <Tooltip title="Maximum length of generated text.">
                        <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }}>
                          <QuestionMark sx={{ fontSize: 12, color: 'text.secondary' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>{parameters.max_tokens}</Typography>
                  </Box>
                  <Slider
                    value={parameters.max_tokens}
                    min={50}
                    max={2000}
                    step={50}
                    onChange={(_, value) => handleParameterChange('max_tokens', value as number)}
                    valueLabelDisplay="auto"
                    sx={{ 
                      color: 'primary.main',
                      height: 4,
                      '& .MuiSlider-track': {
                        border: 'none',
                        borderRadius: 2,
                      },
                      '& .MuiSlider-thumb': {
                        height: 16,
                        width: 16,
                        backgroundColor: 'primary.main',
                        border: '2px solid currentColor',
                        '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                          boxShadow: 'inherit',
                        },
                        '&:before': {
                          display: 'none',
                        },
                      },
                      '& .MuiSlider-rail': {
                        color: 'grey.300',
                        opacity: 1,
                        borderRadius: 2,
                      },
                    }}
                    disabled={!editMode || !canEditPrompt()}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Versions tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Prompt Versions</Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Version</TableCell>
                  <TableCell>Commit ID</TableCell>
                  <TableCell>Commit Message</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versions.length > 0 ? (
                  versions
                    .sort((a, b) => b.version_number - a.version_number)
                    .map((version) => (
                      <VersionRow
                        key={version.id}
                        version={version}
                        isCurrentVersion={currentVersion?.id === version.id}
                        onVersionSelect={handleVersionSelect}
                        formatDate={formatDate}
                        defaultParameters={parameters}
                      />
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No versions available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Runs tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Prompt Runs</Typography>
            <TextField
              size="small"
              placeholder="Search by Run ID..."
              value={runSearchQuery}
              onChange={(e) => setRunSearchQuery(e.target.value)}
              sx={{ minWidth: 250 }}
            />
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Run ID</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Response Time</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredRuns().length > 0 ? (
                  getFilteredRuns().map((run) => (
                    <RunRow
                      key={run.id}
                      run={run}
                      onRowClick={handleRunRowClick}
                      expanded={expandedRuns.has(run.id)}
                      formatDate={formatDate}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {runSearchQuery ? 'No runs match your search' : 'No prompt runs available'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Merge Requests tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Merge Requests</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={mergeRequestFilter === 'all' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setMergeRequestFilter('all')}
              >
                All ({mergeRequests.length})
              </Button>
              <Button
                variant={mergeRequestFilter === 'open' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setMergeRequestFilter('open')}
              >
                Open ({mergeRequests.filter(mr => mr.status === 'OPEN').length})
              </Button>
              <Button
                variant={mergeRequestFilter === 'closed' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setMergeRequestFilter('closed')}
              >
                Closed ({mergeRequests.filter(mr => mr.status !== 'OPEN').length})
              </Button>
            </Box>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredMergeRequests().length > 0 ? (
                  getFilteredMergeRequests().map((mr) => (
                    <MergeRequestRow
                      key={mr.id}
                      mergeRequest={mr}
                      currentContent={getBaseVersionForMergeRequest(mr).content}
                      currentParameters={getBaseVersionForMergeRequest(mr).parameters}
                      onMerge={handleMergeMergeRequest}
                      onReject={handleRejectMergeRequest}
                      onRowClick={handleMergeRequestRowClick}
                      expanded={expandedMergeRequests.has(mr.id)}
                      loading={mergeRequestLoading === mr.id}
                      formatDate={formatDate}
                      canManage={canManageMergeRequests()}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No {mergeRequestFilter === 'all' ? '' : mergeRequestFilter} merge requests
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Prompt Evolution tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Prompt Evolution Analytics</Typography>
            {/* <Button 
              variant="outlined" 
              onClick={fetchVersionMetrics}
              disabled={metricsLoading}
            >
              {metricsLoading ? <CircularProgress size={20} /> : 'Refresh'}
            </Button> */}
          </Box>
          
          {metricsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : versionMetrics.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No version metrics available yet. Metrics are collected when merge requests are merged.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* First Row: Response Times and Token Usage */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Response Time Evolution
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line
                      data={{
                        labels: versionMetrics.map(v => `v${v.version_number}`),
                        datasets: [
                          {
                            label: 'Response Time (ms)',
                            data: versionMetrics.map(v => v.metrics.avg_processing_time || 0),
                            borderColor: 'rgb(255, 193, 7)',
                            backgroundColor: 'rgba(255, 193, 7, 0.2)',
                            tension: 0.1,
                            fill: true
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          title: {
                            display: true,
                            text: 'Response Time per Version'
                          },
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Response Time (ms)'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Version'
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Token Usage Evolution Chart */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Token Usage Evolution
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line
                      data={{
                        labels: versionMetrics.map(v => `v${v.version_number}`),
                        datasets: [
                          {
                            label: 'Tokens',
                            data: versionMetrics.map(v => v.metrics.avg_tokens),
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.1,
                            fill: true
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          title: {
                            display: true,
                            text: 'Total Token Usage per Version'
                          },
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Tokens'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Version'
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Second Row: Cost Evolution Chart (Full Width) */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Cost Evolution
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line
                      data={{
                        labels: versionMetrics.map(v => `v${v.version_number}`),
                        datasets: [
                          {
                            label: 'Average Cost (USD)',
                            data: versionMetrics.map(v => v.metrics.avg_cost),
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.1,
                            fill: true
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          title: {
                            display: true,
                            text: 'Average Cost per Version'
                          },
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Cost (USD)'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Version'
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Version Summary Table */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Version Summary
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Version</TableCell>
                          <TableCell>Commit Name</TableCell>
                          <TableCell align="right">Input Cost</TableCell>
                          <TableCell align="right">Output Cost</TableCell>
                          <TableCell align="right">Input Tokens</TableCell>
                          <TableCell align="right">Output Tokens</TableCell>
                          <TableCell align="right">Response Time</TableCell>
                          <TableCell align="right">Total Cost</TableCell>
                          <TableCell align="right">Total Tokens</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {versionMetrics.map((version) => (
                          <TableRow key={version.version_id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                v{version.version_number}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" sx={{ 
                                maxWidth: 200, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {version.commit_message || 'No commit message'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {formatCost(version.metrics.avg_input_cost || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {formatCost(version.metrics.avg_output_cost || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {Math.round(version.metrics.avg_input_tokens || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {Math.round(version.metrics.avg_output_tokens || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {Math.round(version.metrics.avg_processing_time || 0)}ms
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {formatCost(version.metrics.avg_cost || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                {Math.round(version.metrics.avg_tokens || 0)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Paper>
      
      {/* Merge Request Modal */}
      <Dialog 
        open={mergeRequestModalOpen} 
        onClose={() => setMergeRequestModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Create Merge Request
          <IconButton onClick={() => setMergeRequestModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={mergeRequestForm.description}
              onChange={(e) => setMergeRequestForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of what changes you made and why"
              required
            />
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Changes Summary:</Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1, 
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                {currentVersion && (
                  <>
                    {editedContent !== getContent(currentVersion) && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <CheckIcon sx={{ fontSize: 14, color: 'success.main' }} /> Content modified
                      </Typography>
                    )}
                    {!deepEqualParameters(parameters, currentVersion.metadata_json?.parameters || currentVersion.parameters || {
                      temperature: 0.7,
                      top_p: 1.0,
                      frequency_penalty: 0.0,
                      max_tokens: 500
                    }) && (
                      <Typography variant="body2">
                        <CheckIcon sx={{ fontSize: 14, color: 'success.main' }} /> Parameters updated
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setMergeRequestModalOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleMergeRequestSubmit}
            disabled={!mergeRequestForm.description.trim() || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Merge Request'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Prompt Optimizer Modal */}
      <Dialog 
        open={promptOptimizerModalOpen} 
        onClose={handleCloseOptimizerModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {optimizationResult ? 'AI Response Comparison Results' : 'AI-Powered Prompt Optimizer'}
          <IconButton onClick={handleCloseOptimizerModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {!optimizationResult ? (
            // Optimization Form
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <Alert severity="info" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>How it works:</strong> This optimizer generates multiple candidate prompts based on your instructions, 
                  then tests each one by generating actual AI responses. It compares the original vs. optimized responses 
                  to select the best-performing prompt.
                </Typography>
              </Alert>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Optimization Instructions"
                value={optimizerForm.instructions}
                onChange={(e) => setOptimizerForm(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Describe how you want to improve this prompt (e.g., make it more specific, add examples, improve clarity, generate longer responses)"
                required
                disabled={optimizationLoading}
              />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Current Prompt Preview:</Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1, 
                  border: '1px solid',
                  borderColor: 'grey.200',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  maxHeight: '150px',
                  overflow: 'auto'
                }}>
                  {editedContent || getContent(currentVersion || {} as PromptVersion) || 'No content available'}
                </Box>
              </Box>
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              
              {/* Loading Progress */}
              {optimizationLoading && (
                <Box sx={{ 
                  p: 3, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1, 
                  border: '1px solid',
                  borderColor: 'grey.200',
                  textAlign: 'center'
                }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Optimizing the prompt...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Generating original response<br/>
                    • Creating candidate prompts<br/>
                    • Testing candidate responses<br/>
                    • Comparing response quality<br/>
                    • Selecting winner prompt
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
                    This may take a bit as multiple prompts are being tested.
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            // Optimization Results
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              {/* Success Message */}
              <Box sx={{ 
                p: 3, 
                bgcolor: '#c8e6c9',
                borderRadius: 2,
                border: '1px solid',
                borderColor: '#2e7d32',
                mb: 1, 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    Optimization Complete
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                  The AI has tested multiple candidate prompts and selected the one that produces the best response quality. 
                  Compare the responses below to see the improvement.
                </Typography>
              </Box>

              {/* Optimization Request Context */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.100',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300',
                mb: 3
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'black' }}>
                  Optimization Request:
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontStyle: 'italic', 
                  color: 'black',
                  bgcolor: 'white',
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  "{optimizerForm.instructions}"
                </Typography>
              </Box>

              {/* Before/After Comparison */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'black' }}>
                      Original Prompt & Response
                    </Typography>
                    {/* Badge for original (not winner) */}
                    <Chip 
                      label="ORIGINAL" 
                      size="small" 
                      sx={{ 
                        position: 'absolute', 
                        top: -8, 
                        right: 0, 
                        bgcolor: 'grey.100',
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }} 
                    />
                  </Box>
                  
                  {/* Original Prompt */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1, display: 'block' }}>
                      PROMPT:
                    </Typography>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: '#ffebee', 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'error.light',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      height: `${Math.max(
                        Math.max(120, Math.ceil((optimizationResult.original_prompt?.length || 0) / 80) * 20 + 60),
                        Math.max(120, Math.ceil((optimizationResult.optimized_prompt?.length || 0) / 80) * 20 + 60)
                      )}px`,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {optimizationResult.original_prompt || 'No original prompt'}
                    </Box>
                  </Box>
                  
                  {/* Original Response */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1, display: 'block' }}>
                      AI RESPONSE:
                    </Typography>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: '#fce4ec', 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'error.light',
                      fontSize: '0.875rem',
                      height: `${Math.max(
                        Math.max(200, Math.ceil((optimizationResult.original_response?.length || 0) / 60) * 20 + 80),
                        Math.max(200, Math.ceil((optimizationResult.optimized_response?.length || 0) / 60) * 20 + 80)
                      )}px`,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.4
                    }}>
                      {optimizationResult.original_response || 'No original response available'}
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      Optimized Prompt & Response
                    </Typography>
                    {/* Winner badge */}
                    <Chip 
                      label="WINNER" 
                      size="small" 
                      sx={{ 
                        position: 'absolute', 
                        top: -8, 
                        right: 0, 
                        bgcolor: '#2e7d32',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        animation: 'pulse 2s infinite'
                      }} 
                    />
                  </Box>
                  
                  {/* Optimized Prompt */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1, display: 'block' }}>
                      PROMPT:
                    </Typography>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: '#e8f5e8', 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'success.light',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      height: `${Math.max(
                        Math.max(120, Math.ceil((optimizationResult.original_prompt?.length || 0) / 80) * 20 + 60),
                        Math.max(120, Math.ceil((optimizationResult.optimized_prompt?.length || 0) / 80) * 20 + 60)
                      )}px`,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {optimizationResult.optimized_prompt || 'No optimized prompt'}
                    </Box>
                  </Box>
                  
                  {/* Optimized Response */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1, display: 'block' }}>
                      AI RESPONSE:
                    </Typography>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: '#f1f8e9', 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'success.light',
                      fontSize: '0.875rem',
                      height: `${Math.max(
                        Math.max(200, Math.ceil((optimizationResult.original_response?.length || 0) / 60) * 20 + 80),
                        Math.max(200, Math.ceil((optimizationResult.optimized_response?.length || 0) / 60) * 20 + 80)
                      )}px`,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.4
                    }}>
                      {optimizationResult.optimized_response || 'No optimized response available'}
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Optimization Process Metrics */}
              <Box sx={{ 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 2, 
                p: 3,
                bgcolor: 'grey.50'
              }}>
                  <Typography variant="h6" gutterBottom sx={{mb: 3, fontWeight: 'bold'}}>
                  Optimization Process Metrics
                  </Typography>
                  {/* Processing Time */}
                  {optimizationResult.metrics?.processing_time_ms && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Processing Time: <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 'normal' }}>{Math.round(optimizationResult.metrics.processing_time_ms)}ms</Typography>
                      </Typography>
                    </Box>
                  )}

                  {/* Configuration Details */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Configuration:
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            Optimization ID:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.75rem' }}>
                            {optimizationResult.optimization_id || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            Temperature:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {optimizationResult.configuration?.temperature || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            Max Tokens:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {optimizationResult.configuration?.max_tokens || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            Iterations:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {optimizationResult.metrics?.iterations || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            Candidates/Round:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {optimizationResult.metrics?.candidates_per_iteration || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            Total Tested:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {optimizationResult.metrics?.total_candidates_generated || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            Model:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            {optimizationResult.model || 'gemini-1.5-flash'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          {!optimizationResult ? (
            // Form Actions
            <>
              <Button onClick={handleCloseOptimizerModal}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleOptimizerSubmit}
                disabled={optimizationLoading || !optimizerForm.instructions.trim()}
              >
                {optimizationLoading ? <CircularProgress size={20} /> : 'Test & Optimize Prompt'}
              </Button>
            </>
          ) : (
            // Results Actions
            <>
              <Button onClick={handleCloseOptimizerModal}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleAcceptOptimization}
                sx={{
                  background: 'linear-gradient(45deg, #4568dc, #b06ab3)',
                  boxShadow: '0 4px 12px rgba(176, 106, 179, 0.2)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #3457cb, #9f59a2)',
                    boxShadow: '0 6px 16px rgba(176, 106, 179, 0.3)',
                  }
                }}
              >
                Accept Winning Prompt
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Test Modal */}
      <Dialog 
        open={testModalOpen} 
        onClose={() => {
          setTestModalOpen(false);
          setTestResult(null);
          setTestRunId(null);
          setTestMetrics(null);
          setError(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Test Prompt
          <IconButton onClick={() => {
            setTestModalOpen(false);
            setTestResult(null);
            setTestRunId(null);
            setTestMetrics(null);
            setError(null);
          }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {/* Model Selection */}
            <FormControl fullWidth>
              <InputLabel id="model-select-label">Select Model</InputLabel>
              <Select
                labelId="model-select-label"
                value={selectedModel}
                label="Select Model"
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={testLoading}
              >
                {availableModels.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Parameters Section */}
            {detectedParameters.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  Parameters ({detectedParameters.length} detected)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This prompt contains parameters that need values. Please provide inputs for each parameter:
                </Typography>
                
                {detectedParameters.map((param) => (
                  <TextField
                    key={param}
                    fullWidth
                    label={param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    value={parameterValues[param] || ''}
                    onChange={(e) => handleParameterValueChange(param, e.target.value)}
                    placeholder={`Enter value for {{${param}}}`}
                    required
                    variant="outlined"
                    helperText={`This value will replace {{${param}}} in your prompt`}
                    disabled={testLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                ))}
              </>
            )}
            
            {/* Prompt Preview */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }} gutterBottom>
                Prompt Preview
              </Typography>
              <Box sx={{ 
                p: 3, 
                bgcolor: 'grey.50', 
                borderRadius: 1, 
                border: '1px solid',
                borderColor: 'grey.200',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxHeight: '300px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5
              }}>
                {renderPromptWithParameters(
                  editMode ? editedContent : (currentVersion ? getContent(currentVersion) : ''),
                  parameterValues
                )}
              </Box>
            </Box>

            {/* Test Results Section */}
            {testResult && (
              <Box sx={{ mt: 3 }}>
                {/* Run Info */}
                {testRunId && (
                 <Alert severity="info" sx={{ mb: 2, p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 1 }}>
                      Run Information (for detailed metrics and logs, check the <strong>Runs</strong> tab above)
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      Run ID: {testRunId}
                    </Typography>
                  </Alert>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    AI Response
                  </Typography>
                  {testMetrics?.processing_time_ms && (
                    <Chip 
                      label={`${testMetrics.processing_time_ms}ms`} 
                      size="small" 
                      color="info"
                      sx={{ fontFamily: 'monospace' }}
                    />
                  )}
                </Box>
                <Box sx={{ 
                  p: 3, 
                  bgcolor: 'background.paper', 
                  borderRadius: 1, 
                  border: '1px solid',
                  borderColor: 'divider',
                  minHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.95rem',
                  lineHeight: 1.6
                }}>
                  {testResult}
                </Box>
              </Box>
            )}

            {/* Error Display */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => {
            setTestModalOpen(false);
            setTestResult(null);
            setTestRunId(null);
            setTestMetrics(null);
            setError(null);
          }}>
            {testResult ? 'Close' : 'Cancel'}
          </Button>
          {testResult && (
            <Button 
              variant="outlined"
              onClick={() => {
                setTabValue(2); // Switch to Runs tab
                setTestModalOpen(false);
                setTestResult(null);
                setTestRunId(null);
                setTestMetrics(null);
                setError(null);
              }}
            >
              View in Runs
            </Button>
          )}
          <Button 
            variant="contained" 
            onClick={handleTestModalSubmit}
            disabled={testLoading || (detectedParameters.length > 0 && detectedParameters.some(param => !parameterValues[param]?.trim())) || !selectedModel}
          >
            {testLoading ? <CircularProgress size={20} /> : 'Run Test'}
          </Button>
        </DialogActions>
      </Dialog>


    </Container>
  );
};

export default Prompt;
