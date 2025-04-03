import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Divider, 
  Button, 
  Chip,
  Grid,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  Stack,
  Tooltip,
} from '@mui/material';
import { 
  Star as StarIcon, 
  StarBorder as StarBorderIcon,
  Code as CodeIcon,
  History as HistoryIcon,
  Comment as CommentIcon,
  Info as InfoIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import PromptContent from '../components/Prompt/PromptContent';
import VersionHistory from '../components/Prompt/VersionHistory';
import PromptComments from '../components/Prompt/PromptComments';
import PromptPlayground from '../components/Prompt/PromptPlayground';
import { useAuth } from '../contexts/AuthContext';
import LoadingIndicator from '../components/Common/LoadingIndicator';
import ErrorMessage from '../components/Common/ErrorMessage';

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
      id={`repo-tabpanel-${index}`}
      aria-labelledby={`repo-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Repository = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [repository, setRepository] = useState<any>(null);
  const [prompt, setPrompt] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isCollaborator, setIsCollaborator] = useState(false);

  useEffect(() => {
    const fetchRepositoryData = async () => {
      try {
        setLoading(true);
        // Fetch repository details
        const repoResponse = await api.get(`/repositories/${repoId}`);
        setRepository(repoResponse.data.repository);
        
        // Fetch prompt details
        const promptResponse = await api.get(`/repositories/${repoId}/prompt`);
        setPrompt(promptResponse.data.prompt);
        
        // Fetch versions
        const versionsResponse = await api.get(`/repositories/${repoId}/prompt/versions`);
        setVersions(versionsResponse.data.versions);
        
        // Set current version to the latest
        if (versionsResponse.data.versions?.length > 0) {
          setCurrentVersion(versionsResponse.data.versions[0]);
        }
        
        // Fetch stars
        const starsResponse = await api.get(`/repositories/${repoId}/stars`);
        setStarCount(starsResponse.data.count);
        
        // Check if user has starred
        if (user) {
          const userStarResponse = await api.get(`/repositories/${repoId}/starred`);
          setIsStarred(userStarResponse.data.isStarred);
        }
        
        // Check if user is collaborator
        if (user) {
          const collaboratorsResponse = await api.get(`/repositories/${repoId}/collaborators`);
          const isUserCollaborator = collaboratorsResponse.data.collaborators.some(
            (c: any) => c.user_id === user.id || repoResponse.data.repository.owner_user_id === user.id
          );
          setIsCollaborator(isUserCollaborator);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching repository data:', err);
        setError('Failed to load repository data. Please try again later.');
        setLoading(false);
      }
    };
    
    if (repoId) {
      fetchRepositoryData();
    }
  }, [repoId, user]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStarToggle = async () => {
    try {
      if (isStarred) {
        await api.delete(`/repositories/${repoId}/star`);
        setIsStarred(false);
        setStarCount(prev => prev - 1);
      } else {
        await api.post(`/repositories/${repoId}/star`);
        setIsStarred(true);
        setStarCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  const handleVersionSelect = (version: any) => {
    setCurrentVersion(version);
  };

  if (loading) return <LoadingIndicator />;
  if (error) return <ErrorMessage message={error} />;
  if (!repository || !prompt) return <ErrorMessage message="Repository not found" />;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={9}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {repository.owner_user?.username || repository.owner_org?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>/</Typography>
              <Typography variant="h5" component="h1" fontWeight="bold">
                {repository.name}
              </Typography>
              <Chip 
                label={repository.is_public ? "Public" : "Private"} 
                size="small" 
                color={repository.is_public ? "success" : "default"}
                sx={{ ml: 2 }}
              />
            </Box>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              {repository.description}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button 
                variant={isStarred ? "contained" : "outlined"} 
                size="small" 
                startIcon={isStarred ? <StarIcon /> : <StarBorderIcon />}
                onClick={handleStarToggle}
                disabled={!user}
              >
                {isStarred ? 'Starred' : 'Star'} · {starCount}
              </Button>
              
              {isCollaborator && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/repositories/${repoId}/edit`)}
                >
                  Edit
                </Button>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography variant="body2" color="text.secondary">
                Created {formatDistanceToNow(new Date(repository.created_at), { addSuffix: true })}
              </Typography>
              
              {prompt && (
                <Typography variant="body2" color="text.secondary">
                  Last updated {formatDistanceToNow(new Date(prompt.updated_at), { addSuffix: true })}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="repository tabs">
          <Tab icon={<CodeIcon />} iconPosition="start" label="Prompt" id="repo-tab-0" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="History" id="repo-tab-1" />
          <Tab icon={<CommentIcon />} iconPosition="start" label="Comments" id="repo-tab-2" />
          <Tab icon={<InfoIcon />} iconPosition="start" label="Playground" id="repo-tab-3" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            {prompt.title}
          </Typography>
          
          {prompt.description && (
            <Typography variant="body1" sx={{ mb: 3 }}>
              {prompt.description}
            </Typography>
          )}
          
          <Divider sx={{ mb: 3 }} />
          
          {currentVersion && (
            <PromptContent 
              content={currentVersion.content_snapshot} 
              metadata={prompt.metadata_json} 
            />
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Version History
          </Typography>
          <VersionHistory 
            versions={versions} 
            currentVersion={currentVersion}
            onVersionSelect={handleVersionSelect}
          />
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <PromptComments promptId={prompt.id} />
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3 }}>
          <PromptPlayground 
            prompt={{
              id: prompt.id,
              title: prompt.title,
              content: prompt.content,
              metadata_json: prompt.metadata_json
            }}
            version={currentVersion ? {
              id: currentVersion.id,
              version_number: currentVersion.version_number,
              content_snapshot: currentVersion.content_snapshot
            } : undefined}
          />
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default Repository; 