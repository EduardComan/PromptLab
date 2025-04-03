import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Paper,
  CircularProgress
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Comment {
  id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    username: string;
    profile_image_id?: string;
  };
}

interface PromptCommentsProps {
  promptId: string;
}

const PromptComments: React.FC<PromptCommentsProps> = ({ promptId }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/prompts/${promptId}/comments`);
        setComments(response.data.comments);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments');
        setLoading(false);
      }
    };

    fetchComments();
  }, [promptId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      const response = await api.post(`/prompts/${promptId}/comments`, {
        body: newComment
      });
      
      setComments([response.data.comment, ...comments]);
      setNewComment('');
      setSubmitting(false);
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to post comment');
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>
      
      {isAuthenticated ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <form onSubmit={handleCommentSubmit}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                endIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
                disabled={!newComment.trim() || submitting}
              >
                Post Comment
              </Button>
            </Box>
          </form>
        </Paper>
      ) : (
        <Paper sx={{ p: 2, mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            You need to be logged in to post comments.
          </Typography>
        </Paper>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ py: 2 }}>
          {error}
        </Typography>
      ) : comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No comments yet. Be the first to share your thoughts!
        </Typography>
      ) : (
        <List>
          {comments.map((comment, index) => (
            <React.Fragment key={comment.id}>
              <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                <ListItemAvatar>
                  <Avatar
                    alt={comment.author.username}
                    src={comment.author.profile_image_id ? `/api/images/${comment.author.profile_image_id}` : undefined}
                  >
                    {comment.author.username.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" component="span">
                        {comment.author.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                    >
                      {comment.body}
                    </Typography>
                  }
                />
              </ListItem>
              {index < comments.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default PromptComments; 