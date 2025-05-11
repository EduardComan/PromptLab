import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  Collapse,
  SelectChangeEvent
} from '@mui/material';
import {
  Autorenew as OptimizeIcon,
  ArrowUpward as ApplyIcon,
  InfoOutlined as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import PromptOptimizationService from '../../services/PromptOptimizationService';

interface Model {
  id: string;
  name: string;
  size_category: string;
}

interface PromptOptimizerProps {
  currentPrompt: string;
  onApplyOptimization: (optimizedPrompt: string) => void;
}

const PromptOptimizer: React.FC<PromptOptimizerProps> = ({ currentPrompt, onApplyOptimization }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [target, setTarget] = useState<string>('');
  const [optimizationResult, setOptimizationResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Fetch available models on first render
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const availableModels = await PromptOptimizationService.getOptimizationModels();
        setModels(availableModels);
        
        // Select default model if available
        if (availableModels.length > 0) {
          setSelectedModel(availableModels[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setError('Failed to load optimization models');
      }
    };
    
    fetchModels();
  }, []);
  
  const handleOptimize = async () => {
    if (!selectedModel) {
      setError('Please select a model first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await PromptOptimizationService.optimizePrompt({
        prompt: currentPrompt,
        target: target || undefined,
        model: selectedModel
      });
      
      setOptimizationResult(result.optimization);
      setLoading(false);
    } catch (err: any) {
      console.error('Error optimizing prompt:', err);
      setError(err.message || 'Failed to optimize prompt');
      setLoading(false);
    }
  };
  
  const handleModelChange = (event: SelectChangeEvent) => {
    setSelectedModel(event.target.value);
  };

  const handleApplyOptimization = () => {
    if (optimizationResult) {
      // Try to extract just the optimized prompt if it follows the expected format
      const improvedPromptMatch = optimizationResult.match(/IMPROVED PROMPT:(.*?)$/s);
      const improvedPrompt = improvedPromptMatch 
        ? improvedPromptMatch[1].trim() 
        : optimizationResult;
      
      onApplyOptimization(improvedPrompt);
    }
  };
  
  return (
    <Box sx={{ mt: 2, mb: 3 }}>
      <Button
        startIcon={<OptimizeIcon />}
        variant="outlined"
        color="secondary"
        onClick={() => setIsOpen(!isOpen)}
        size="small"
      >
        {isOpen ? 'Hide Prompt Optimizer' : 'Optimize Prompt with AI'}
      </Button>
      
      <Collapse in={isOpen}>
        <Paper sx={{ mt: 2, p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Prompt Optimizer
              <Tooltip title="Uses small LLMs to analyze and improve your prompt">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <IconButton size="small" onClick={() => setIsOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="model-selector-label">Model</InputLabel>
                <Select
                  labelId="model-selector-label"
                  value={selectedModel}
                  label="Model"
                  onChange={handleModelChange}
                  disabled={loading}
                >
                  {models.map(model => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Optimization Target (optional)"
                placeholder="e.g., 'Make it more creative' or 'Improve conciseness'"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                size="small"
                fullWidth
                disabled={loading}
              />
              
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOptimize}
                disabled={loading || !selectedModel}
                startIcon={loading ? <CircularProgress size={20} /> : <OptimizeIcon />}
              >
                {loading ? 'Optimizing...' : 'Optimize'}
              </Button>
            </Box>
            
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            {optimizationResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Optimization Result:
                </Typography>
                <Paper 
                  sx={{ 
                    p: 2, 
                    maxHeight: '300px', 
                    overflow: 'auto',
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography 
                    component="pre" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem'
                    }}
                  >
                    {optimizationResult}
                  </Typography>
                </Paper>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    startIcon={<ApplyIcon />}
                    variant="contained"
                    onClick={handleApplyOptimization}
                  >
                    Apply Optimization
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default PromptOptimizer; 