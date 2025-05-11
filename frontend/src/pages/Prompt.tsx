import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button, 
  TextField, 
  Slider,
  Container,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  CloudUpload as PublishIcon,
  Commit as CommitIcon
} from '@mui/icons-material';
import { PromptService } from '../services';
import { Prompt as PromptType, PromptVersion, PromptParameters } from '../interfaces';
import PromptContent from '../components/Prompt/PromptContent';
import VersionHistory from '../components/Prompt/VersionHistory';
import PromptOptimizer from '../components/Prompt/PromptOptimizer';

// Interface for tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Version interface that matches VersionHistory component's expected type
interface Version {
  id: string;
  version_number: number;
  content_snapshot: string;
  diff_snapshot?: string;
  commit_message?: string;
  author?: {
    id: string;
    username: string;
    profile_image?: {
      id: string;
    };
  };
  created_at: string;
}

// Tab Panel component
function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

// Function for tab accessibility props
const a11yProps = (index: number) => {
  return {
    id: `prompt-tab-${index}`,
    'aria-controls': `prompt-tabpanel-${index}`,
  };
};

const Prompt: React.FC = () => {
  const { promptId } = useParams<{ promptId: string }>();
  const navigate = useNavigate();
  
  // State hooks
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState<PromptType | null>(null);
  const [currentVersion, setCurrentVersion] = useState<PromptVersion | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [parameters, setParameters] = useState<PromptParameters>({
    temperature: 0.7,
    top_p: 1.0,
    frequency_penalty: 0.0,
    max_tokens: 500,
    presence_penalty: 0.0
  });
  const [error, setError] = useState<string | null>(null);

  // Convert PromptVersion to Version for VersionHistory component
  const convertToVersionFormat = (promptVersion: PromptVersion): Version => {
    const content = 
      typeof promptVersion.content === 'string' ? promptVersion.content : 
      typeof promptVersion.content_snapshot === 'string' ? promptVersion.content_snapshot :
      JSON.stringify(promptVersion.content || promptVersion.content_snapshot || '');
    
    return {
      id: promptVersion.id,
      version_number: promptVersion.version_number,
      content_snapshot: content,
      commit_message: promptVersion.commit_message || promptVersion.description,
      author: promptVersion.author || promptVersion.created_by ? {
        id: (promptVersion.author || promptVersion.created_by)!.id,
        username: (promptVersion.author || promptVersion.created_by)!.username,
        profile_image: (promptVersion.author || promptVersion.created_by)!.profile_image ? {
          id: (promptVersion.author || promptVersion.created_by)!.profile_image!.id
        } : undefined
      } : undefined,
      created_at: promptVersion.created_at || promptVersion.created_at_deprecated || ''
    };
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

  // Fetch prompt and its versions
  useEffect(() => {
    const fetchPrompt = async () => {
      if (!promptId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch prompt data
        const promptData = await PromptService.getPrompt(promptId);
        setPrompt(promptData);
        
        // Fetch versions
        const versionsData = await PromptService.getPromptVersions(promptId);
        setVersions(versionsData || []);
        
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
      } catch (error) {
        console.error('Error fetching prompt:', error);
        setError('Failed to load prompt. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
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

  // Save changes
  const handleSaveChanges = async () => {
    if (!promptId || !currentVersion) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use the API to update the prompt
      const updatedVersion = await PromptService.updatePromptVersion(
        promptId, 
        currentVersion.id, 
        {
          content: editedContent,
          commitMessage,
          parameters
        }
      );
      
      // After successful update, refresh data
      const versionsData = await PromptService.getPromptVersions(promptId);
      setVersions(versionsData);
      
      // Find the newest version (should be the one we just created)
      const newVersion = versionsData.sort((a: PromptVersion, b: PromptVersion) => 
        new Date(b.created_at || b.created_at_deprecated || '').getTime() - 
        new Date(a.created_at || a.created_at_deprecated || '').getTime()
      )[0];
      
      setCurrentVersion(newVersion);
      
      // Exit edit mode
      setEditMode(false);
      setCommitMessage('');
    } catch (error) {
      console.error('Error updating prompt:', error);
      setError('Failed to update prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting a different version from VersionHistory
  const handleVersionSelect = (version: Version) => {
    // Find the corresponding PromptVersion
    const selectedVersion = versions.find(v => v.id === version.id);
    if (selectedVersion) {
      setCurrentVersion(selectedVersion);
      setContentFromVersion(selectedVersion);
      
      // Update parameters if available
      const versionParams = selectedVersion.metadata_json?.parameters || selectedVersion.parameters;
      if (versionParams) {
        setParameters({
          ...parameters,
          ...versionParams
        });
      }
      
      // Switch to overview tab
      setTabValue(0);
    }
  };

  // Handle parameter changes
  const handleParameterChange = (param: keyof PromptParameters, value: number) => {
    setParameters(prev => ({
      ...prev,
      [param]: value
    }));
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

  // Convert PromptVersions to Versions for VersionHistory component
  const versionsForHistory: Version[] = versions.map(convertToVersionFormat);
  const currentVersionForHistory = currentVersion ? convertToVersionFormat(currentVersion) : undefined;

  return (
    <Container maxWidth="xl">
      {/* Header area */}
      <Box sx={{ pt: 4, pb: 2 }} maxWidth="lg" mx="auto">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {prompt?.title || 'Prompt'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleToggleEditMode}
          >
            {editMode ? 'Cancel' : 'Edit'}
          </Button>
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
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Prompt content */}
            <Grid item xs={12} md={9}>
              {editMode ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <TextField
                    multiline
                    fullWidth
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    variant="outlined"
                    placeholder="Enter your prompt here..."
                    sx={{ 
                      mb: 2,
                      minHeight: '300px',
                      '& .MuiInputBase-root': {
                        fontFamily: 'monospace',
                      },
                      '& .MuiInputBase-inputMultiline': {
                        height: '100%',
                      }
                    }}
                    rows={12}
                  />
                  <PromptOptimizer 
                    currentPrompt={editedContent} 
                    onApplyOptimization={(optimizedPrompt) => setEditedContent(optimizedPrompt)} 
                  />
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TextField
                      fullWidth
                      placeholder="Commit message (describe your changes)"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      size="small"
                    />
                    <Button
                      variant="contained"
                      startIcon={<CommitIcon />}
                      onClick={handleSaveChanges}
                      disabled={editedContent === (currentVersion?.content as string)}
                    >
                      Commit
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      color="secondary"
                    >
                      Test
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PublishIcon />}
                      color="primary"
                    >
                      Publish
                    </Button>
                  </Box>
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
            </Grid>
            
            {/* Settings panel - always visible */}
            <Grid item xs={12} md={3}>
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
                <Typography variant="h6" fontWeight="bold">Settings</Typography>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" gutterBottom>Temperature</Typography>
                    <Typography variant="subtitle2" color="primary">{parameters.temperature}</Typography>
                  </Box>
                  <Slider
                    value={parameters.temperature}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={(_, value) => handleParameterChange('temperature', value as number)}
                    valueLabelDisplay="auto"
                    sx={{ color: 'primary.main' }}
                    disabled={!editMode}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Controls randomness: Lower values are more deterministic, higher values more creative.
                  </Typography>
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" gutterBottom>Top P</Typography>
                    <Typography variant="subtitle2" color="primary">{parameters.top_p}</Typography>
                  </Box>
                  <Slider
                    value={parameters.top_p}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={(_, value) => handleParameterChange('top_p', value as number)}
                    valueLabelDisplay="auto"
                    sx={{ color: 'primary.main' }}
                    disabled={!editMode}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Controls diversity via nucleus sampling.
                  </Typography>
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" gutterBottom>Frequency Penalty</Typography>
                    <Typography variant="subtitle2" color="primary">{parameters.frequency_penalty}</Typography>
                  </Box>
                  <Slider
                    value={parameters.frequency_penalty}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={(_, value) => handleParameterChange('frequency_penalty', value as number)}
                    valueLabelDisplay="auto"
                    sx={{ color: 'primary.main' }}
                    disabled={!editMode}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Reduces repetition of token sequences.
                  </Typography>
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" gutterBottom>Max Tokens</Typography>
                    <Typography variant="subtitle2" color="primary">{parameters.max_tokens}</Typography>
                  </Box>
                  <Slider
                    value={parameters.max_tokens}
                    min={50}
                    max={2000}
                    step={50}
                    onChange={(_, value) => handleParameterChange('max_tokens', value as number)}
                    valueLabelDisplay="auto"
                    sx={{ color: 'primary.main' }}
                    disabled={!editMode}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Maximum length of generated text.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <VersionHistory
            versions={versionsForHistory}
            currentVersion={currentVersionForHistory}
            onVersionSelect={handleVersionSelect}
          />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Prompt;
