import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
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
  Tabs,
  Tab,
  Tooltip,
  Alert,
  styled
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import axios from 'axios';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useAuth } from '../../contexts/AuthContext';

// Styled components
const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: '48px',
  textTransform: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`playground-tabpanel-${index}`}
      aria-labelledby={`playground-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeSettingsTab, setActiveSettingsTab] = useState<number>(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [renderedPrompt, setRenderedPrompt] = useState<string>('');
  
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
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleSettingsTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveSettingsTab(newValue);
  };
  
  const handleRenderPrompt = () => {
    // Replace variables in the prompt template
    let content = version ? version.content_snapshot : prompt.content;
    
    variables.forEach(variable => {
      const regex = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
      content = content.replace(regex, variable.value || `[${variable.name}]`);
    });
    
    setRenderedPrompt(content);
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
      
      // First get the rendered prompt
      handleRenderPrompt();
      
      // Make API call
      const response = await axios.post('/api/execution/run', {
        prompt_id: prompt.id,
        version_id: version?.id,
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
    
    // Set the result and rendered prompt
    setResult(run.output);
    setRenderedPrompt(run.rendered_prompt);
    
    // Switch to the appropriate tabs
    setActiveTab(0);
  };
  
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  return (
    <Box>
      <Paper elevation={0} variant="outlined" sx={{ mb: 3, borderRadius: '8px', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="playground tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <StyledTab icon={<CodeIcon fontSize="small" />} iconPosition="start" label="Playground" />
            <StyledTab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="History" />
            <StyledTab icon={<DescriptionIcon fontSize="small" />} iconPosition="start" label="Raw Prompt" />
          </Tabs>
        </Box>
        
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                  Variables
                </Typography>
                
                {variables.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No variables found in this prompt.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {variables.map((variable, index) => (
                      <TextField
                        key={variable.name}
                        label={variable.name}
                        value={variable.value}
                        onChange={(e) => handleVariableChange(index, e.target.value)}
                        fullWidth
                        multiline={variable.name.toLowerCase().includes('text')}
                        rows={variable.name.toLowerCase().includes('text') ? 3 : 1}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                  Model Settings
                </Typography>
                
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs 
                    value={activeSettingsTab} 
                    onChange={handleSettingsTabChange}
                    aria-label="model settings tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ minHeight: '36px' }}
                  >
                    <Tab label="Basic" sx={{ minHeight: '36px', py: 0 }} />
                    <Tab label="Advanced" sx={{ minHeight: '36px', py: 0 }} />
                  </Tabs>
                </Box>
                
                {activeSettingsTab === 0 && (
                  <Box>
                    <FormControl fullWidth sx={{ mb: 2 }} size="small">
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2">
                          Temperature
                          <Tooltip title="Controls randomness: Higher values produce more creative outputs">
                            <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle', color: 'text.secondary', fontSize: '1rem' }} />
                          </Tooltip>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {temperature}
                        </Typography>
                      </Box>
                      <Slider
                        value={temperature}
                        min={0}
                        max={1}
                        step={0.1}
                        onChange={handleTemperatureChange}
                        size="small"
                      />
                    </Box>
                  </Box>
                )}
                
                {activeSettingsTab === 1 && (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2">
                          Max Tokens
                          <Tooltip title="Maximum length of generated output">
                            <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle', color: 'text.secondary', fontSize: '1rem' }} />
                          </Tooltip>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {maxTokens}
                        </Typography>
                      </Box>
                      <Slider
                        value={maxTokens}
                        min={100}
                        max={4000}
                        step={100}
                        onChange={handleMaxTokensChange}
                        size="small"
                      />
                    </Box>
                    
                    {/* Additional advanced settings could go here */}
                  </Box>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<DescriptionIcon />}
                  onClick={handleRenderPrompt}
                  sx={{ mr: 1 }}
                >
                  Preview
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
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                  Output
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                ) : result ? (
                  <Box>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        maxHeight: '400px', 
                        overflow: 'auto',
                        backgroundColor: 'background.paper',
                        borderRadius: '4px',
                        mb: 2
                      }}
                    >
                      <SyntaxHighlighter
                        language="markdown"
                        style={vs2015}
                        customStyle={{ 
                          backgroundColor: 'transparent',
                          margin: 0,
                          padding: 0
                        }}
                      >
                        {result}
                      </SyntaxHighlighter>
                    </Paper>
                    
                    {metrics && (
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: '4px' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Run Metrics
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Time
                            </Typography>
                            <Typography variant="body1">
                              {formatTime(metrics.processing_time_ms)}
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
                      </Paper>
                    )}
                  </Box>
                ) : renderedPrompt ? (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      maxHeight: '400px', 
                      overflow: 'auto',
                      backgroundColor: 'background.paper',
                      borderRadius: '4px'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Rendered Prompt:
                    </Typography>
                    <SyntaxHighlighter
                      language="markdown"
                      style={vs2015}
                      customStyle={{ 
                        backgroundColor: 'transparent',
                        margin: 0,
                        padding: 0
                      }}
                    >
                      {renderedPrompt}
                    </SyntaxHighlighter>
                  </Paper>
                ) : (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      height: '300px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'background.default',
                      borderRadius: '4px'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" align="center">
                      Set your variables and click "Run Prompt" to generate output
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <Typography variant="subtitle1" gutterBottom fontWeight={500}>
            Recent Runs
          </Typography>
          
          {promptRuns.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No execution history found for this prompt.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {promptRuns.map((run) => (
                <Grid item xs={12} key={run.id}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2,
                      borderRadius: '8px',
                      '&:hover': {
                        boxShadow: 1
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2">
                          Run with {run.model}
                          {!run.success && (
                            <Chip 
                              label="Failed" 
                              color="error" 
                              size="small" 
                              sx={{ ml: 1, height: '20px' }} 
                            />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(run.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Tooltip title="Use these settings">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleReuseRun(run)}
                          >
                            Reuse
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Input Variables
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {Object.entries(run.input_variables).map(([key, value]) => (
                            <Chip 
                              key={key} 
                              label={`${key}: ${value.length > 20 ? value.substring(0, 20) + '...' : value}`} 
                              size="small" 
                              variant="outlined"
                              sx={{ mb: 0.5 }} 
                            />
                          ))}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Output Preview
                        </Typography>
                        <Typography variant="body2" noWrap>
                          {run.output.substring(0, 50)}{run.output.length > 50 ? '...' : ''}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Metrics
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Time</Typography>
                            <Typography variant="body2">
                              {formatTime(run.metrics.processing_time_ms)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Tokens</Typography>
                            <Typography variant="body2">
                              {run.metrics.tokens_input + run.metrics.tokens_output}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Temp</Typography>
                            <Typography variant="body2">
                              {run.metrics.model_parameters?.temperature || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <Typography variant="subtitle1" gutterBottom fontWeight={500}>
            Raw Prompt Template
          </Typography>
          
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              maxHeight: '500px', 
              overflow: 'auto',
              backgroundColor: 'background.paper',
              borderRadius: '4px'
            }}
          >
            <SyntaxHighlighter
              language="markdown"
              style={vs2015}
              customStyle={{ 
                backgroundColor: 'transparent',
                margin: 0,
                padding: 0
              }}
            >
              {version ? version.content_snapshot : prompt.content}
            </SyntaxHighlighter>
          </Paper>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Variables
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {variables.map((variable) => (
                <Chip 
                  key={variable.name} 
                  label={variable.name} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
              ))}
              {variables.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No variables defined in this prompt.
                </Typography>
              )}
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default PromptPlayground; 