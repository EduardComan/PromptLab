import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Slider,
  SelectChangeEvent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  PlayArrow as RunIcon,
  History as HistoryIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { PromptVersion } from '../../interfaces';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useAuth } from '../../contexts/AuthContext';

interface PromptVariable {
  name: string;
  value: string;
}

interface PromptRun {
  id: string;
  model: string;
  input_variables: Record<string, string>;
  rendered_prompt: string;
  output: string;
  success: boolean;
  error_message?: string;
  metrics: {
    processing_time_ms: number;
    tokens_input: number;
    tokens_output: number;
    model_parameters: Record<string, any>;
  };
  created_at: string;
}

interface PromptPlaygroundProps {
  prompt: {
    id: string;
    title: string;
    content: string;
    metadata_json?: any;
  };
  version?: {
    id: string;
    version_number: number;
    content_snapshot: string;
  };
}

const PromptPlayground: React.FC<PromptPlaygroundProps> = ({ prompt, version }) => {
  const { user } = useAuth();
  const [variables, setVariables] = useState<PromptVariable[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1000);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [promptRuns, setPromptRuns] = useState<PromptRun[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<any>(null);
  
  // Extract variables from the prompt content on component mount
  useEffect(() => {
    const content = version ? version.content_snapshot : prompt.content;
    const extractVariables = (text: string) => {
      const regex = /{{(.*?)}}/g;
      const variableNames: string[] = [];
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const variableName = match[1].trim();
        if (!variableNames.includes(variableName)) {
          variableNames.push(variableName);
        }
      }
      
      return variableNames.map(name => ({ name, value: '' }));
    };
    
    setVariables(extractVariables(content));
  }, [prompt, version]);
  
  // Fetch available models when component mounts
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get('/api/execution/models');
        setModels(response.data.models);
        
        // Set default model if available
        if (response.data.models.length > 0) {
          if (prompt.metadata_json?.recommended_model && 
              response.data.models.includes(prompt.metadata_json.recommended_model)) {
            setSelectedModel(prompt.metadata_json.recommended_model);
          } else {
            setSelectedModel(response.data.models[0]);
          }
        }
        
        // Set default parameters from prompt metadata if available
        if (prompt.metadata_json?.parameters) {
          if (prompt.metadata_json.parameters.temperature !== undefined) {
            setTemperature(prompt.metadata_json.parameters.temperature);
          }
          if (prompt.metadata_json.parameters.max_tokens !== undefined) {
            setMaxTokens(prompt.metadata_json.parameters.max_tokens);
          }
        }
      } catch (err: any) {
        console.error('Error fetching models:', err);
        setError('Failed to load available models');
      }
    };
    
    fetchModels();
  }, [prompt]);
  
  // Fetch recent runs for this prompt
  useEffect(() => {
    const fetchPromptRuns = async () => {
      if (!user) return;
      
      try {
        const response = await axios.get(`/prompts/${prompt.id}/runs?limit=5`);
        setPromptRuns(response.data.runs);
      } catch (err) {
        console.error('Error fetching prompt runs:', err);
      }
    };
    
    fetchPromptRuns();
  }, [prompt.id, user]);
  
  const handleVariableChange = (index: number, value: string) => {
    const updatedVariables = [...variables];
    updatedVariables[index].value = value;
    setVariables(updatedVariables);
  };
  
  const handleModelChange = (event: SelectChangeEvent<string>) => {
    setSelectedModel(event.target.value);
  };
  
  const handleTemperatureChange = (_event: Event, newValue: number | number[]) => {
    setTemperature(newValue as number);
  };
  
  const handleMaxTokensChange = (_event: Event, newValue: number | number[]) => {
    setMaxTokens(newValue as number);
  };
  
  const handleRunPrompt = async () => {
    if (!selectedModel) {
      setError('Please select a model');
      return;
    }
    
    try {
      setLoading(true);
      setResult(null);
      setError(null);
      setMetrics(null);
      
      // Convert variables array to object
      const inputVariables: Record<string, string> = {};
      variables.forEach(variable => {
        inputVariables[variable.name] = variable.value;
      });
      
      // Prepare parameters
      const parameters = {
        temperature,
        max_tokens: maxTokens
      };
      
      // Make API call
      const response = await axios.post('/api/execution/run', {
        versionId: version?.id,
        model: selectedModel,
        input: inputVariables,
        parameters
      });
      
      if (response.data.status === 'success') {
        setResult(response.data.output);
        setMetrics(response.data.metrics);
        
        // Refresh runs list
        const runsResponse = await axios.get(`/prompts/${prompt.id}/runs?limit=5`);
        setPromptRuns(runsResponse.data.runs);
      } else {
        setError(response.data.message || 'Error executing prompt');
      }
    } catch (err: any) {
      console.error('Error executing prompt:', err);
      setError(err.response?.data?.message || 'Failed to execute prompt');
    } finally {
      setLoading(false);
    }
  };
  
  const handleReuseRun = (run: PromptRun) => {
    // Set all the values from the previous run
    const runVariables: PromptVariable[] = [];
    
    for (const [name, value] of Object.entries(run.input_variables)) {
      runVariables.push({ name, value });
    }
    
    // Add any variables from the current prompt that weren't in the run
    variables.forEach(variable => {
      if (!runVariables.some(v => v.name === variable.name)) {
        runVariables.push(variable);
      }
    });
    
    setVariables(runVariables);
    setSelectedModel(run.model);
    
    if (run.metrics?.model_parameters) {
      if (run.metrics.model_parameters.temperature !== undefined) {
        setTemperature(run.metrics.model_parameters.temperature);
      }
      if (run.metrics.model_parameters.max_tokens !== undefined) {
        setMaxTokens(run.metrics.model_parameters.max_tokens);
      }
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Playground
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Input Variables
            </Typography>
            
            {variables.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No variables found in this prompt.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                {variables.map((variable, index) => (
                  <TextField
                    key={variable.name}
                    label={variable.name}
                    value={variable.value}
                    onChange={(e) => handleVariableChange(index, e.target.value)}
                    fullWidth
                    multiline={variable.name.toLowerCase().includes('text')}
                    rows={variable.name.toLowerCase().includes('text') ? 3 : 1}
                  />
                ))}
              </Box>
            )}
            
            <Divider sx={{ my: 3 }} />
            
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="model-settings-content"
                id="model-settings-header"
              >
                <SettingsIcon sx={{ mr: 1 }} />
                <Typography>Model Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="model-select-label">Model</InputLabel>
                  <Select
                    labelId="model-select-label"
                    value={selectedModel}
                    label="Model"
                    onChange={handleModelChange}
                  >
                    {models.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>
                    Temperature: {temperature}
                    <Tooltip title="Controls randomness: Higher values produce more creative outputs">
                      <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle', color: 'text.secondary' }} />
                    </Tooltip>
                  </Typography>
                  <Slider
                    value={temperature}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={handleTemperatureChange}
                    valueLabelDisplay="auto"
                  />
                </Box>
                
                <Box>
                  <Typography gutterBottom>
                    Max Tokens: {maxTokens}
                    <Tooltip title="Maximum length of generated output">
                      <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle', color: 'text.secondary' }} />
                    </Tooltip>
                  </Typography>
                  <Slider
                    value={maxTokens}
                    min={100}
                    max={4000}
                    step={100}
                    onChange={handleMaxTokensChange}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide History' : 'Show History'}
              </Button>
              
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RunIcon />}
                onClick={handleRunPrompt}
                disabled={loading || !selectedModel}
              >
                Run Prompt
              </Button>
            </Box>
            
            {showHistory && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recent Runs
                </Typography>
                
                {promptRuns.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No recent runs found.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {promptRuns.map((run) => (
                      <Paper key={run.id} variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2">
                            Model: <Chip label={run.model} size="small" />
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(run.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Input variables: 
                            {Object.entries(run.input_variables).map(([key, value]) => (
                              <Chip 
                                key={key} 
                                label={`${key}: ${value.substring(0, 15)}${value.length > 15 ? '...' : ''}`} 
                                size="small" 
                                sx={{ ml: 1, my: 0.5 }} 
                              />
                            ))}
                          </Typography>
                        </Box>
                        
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleReuseRun(run)}
                        >
                          Use These Settings
                        </Button>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Result
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : result ? (
              <Box>
                <SyntaxHighlighter
                  language="markdown"
                  style={vs2015}
                  customStyle={{ maxHeight: '500px', overflow: 'auto' }}
                >
                  {result}
                </SyntaxHighlighter>
                
                {metrics && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Metrics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Processing Time
                        </Typography>
                        <Typography variant="body1">
                          {(metrics.processing_time_ms / 1000).toFixed(2)}s
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Input Tokens
                        </Typography>
                        <Typography variant="body1">
                          {metrics.tokens_input}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Output Tokens
                        </Typography>
                        <Typography variant="body1">
                          {metrics.tokens_output}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Run the prompt to see results here.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PromptPlayground; 