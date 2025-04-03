import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CircularProgress,
  Pagination,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Code as CodeIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

interface Prompt {
  id: string;
  name: string;
  description: string | null;
  latest_version: {
    id: string;
    version: number;
    created_at: string;
  };
  created_at: string;
  updated_at: string;
}

interface PromptListProps {
  repoId: string;
  isOwner: boolean;
}

const PromptList: React.FC<PromptListProps> = ({ repoId, isOwner }) => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const ITEMS_PER_PAGE = 10;
  
  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params = {
          page,
          limit: ITEMS_PER_PAGE,
          search: search || undefined
        };
        
        const response = await axios.get(`/repositories/${repoId}/prompts`, { params });
        
        setPrompts(response.data.prompts);
        setTotalCount(response.data.pagination.total);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch prompts');
        console.error('Error fetching prompts:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPrompts();
  }, [repoId, page, search]);
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1); // Reset to first page when search changes
  };
  
  const handleAddPrompt = () => {
    navigate(`/repositories/${repoId}/prompts/new`);
  };
  
  const handleDeletePrompt = async (promptId: string) => {
    try {
      await axios.delete(`/repositories/${repoId}/prompts/${promptId}`);
      
      // Update the prompts list after deletion
      setPrompts(prompts.filter(prompt => prompt.id !== promptId));
      if (prompts.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err: any) {
      console.error('Error deleting prompt:', err);
      // Handle error (could display a notification)
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Search prompts..."
          variant="outlined"
          size="small"
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: '300px' }}
        />
        
        {isOwner && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddPrompt}
          >
            Add Prompt
          </Button>
        )}
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : prompts.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                No prompts found
              </Typography>
              {isOwner && (
                <Typography variant="body2" color="text.secondary">
                  Get started by creating your first prompt
                </Typography>
              )}
              {isOwner && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddPrompt}
                  sx={{ mt: 2 }}
                >
                  Add Prompt
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          <List sx={{ bgcolor: 'background.paper' }}>
            {prompts.map((prompt, index) => (
              <React.Fragment key={prompt.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem 
                  alignItems="flex-start"
                  component={Link}
                  to={`/repositories/${repoId}/prompts/${prompt.id}`}
                  sx={{ 
                    textDecoration: 'none', 
                    color: 'inherit',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="h6" component="div">
                        {prompt.name}
                      </Typography>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 1 }}>
                          {prompt.description || 'No description'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Chip 
                            icon={<CodeIcon fontSize="small" />} 
                            label={`v${prompt.latest_version.version}`} 
                            size="small" 
                            variant="outlined"
                          />
                          <Typography variant="body2" color="text.secondary">
                            Updated {format(new Date(prompt.updated_at), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </React.Fragment>
                    }
                  />
                  
                  {isOwner && (
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        component={Link}
                        to={`/repositories/${repoId}/prompts/${prompt.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeletePrompt(prompt.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              </React.Fragment>
            ))}
          </List>
          
          {totalCount > ITEMS_PER_PAGE && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination 
                count={Math.ceil(totalCount / ITEMS_PER_PAGE)} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default PromptList; 