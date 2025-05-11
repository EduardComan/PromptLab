import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Divider,
  Chip,
  Avatar,
  Grid,
  TextField,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Merge as MergeIcon,
  InsertComment as CommentIcon,
  ArrowBack as BackIcon,
  CompareArrows as CompareIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useTheme } from '@mui/material/styles';

interface MergeRequestData {
  id: string;
  prompt_id: string;
  source_version_id: string;
  target_version_id: string;
  author_id: string;
  status: 'open' | 'merged' | 'rejected';
  created_at: string;
  merged_at: string | null;
  auto_merged: boolean;
  author: {
    id: string;
    username: string;
    profile_image?: {
      id: string;
    };
  };
  source_version: {
    id: string;
    version_number: number;
    content_snapshot: string;
    commit_message: string;
    created_at: string;
  };
  target_version: {
    id: string;
    version_number: number;
    content_snapshot: string;
    created_at: string;
  };
  reviews: Array<{
    id: string;
    reviewer_id: string;
    approved: boolean | null;
    comment: string;
    reviewed_at: string;
    reviewer: {
      id: string;
      username: string;
      profile_image?: {
        id: string;
      };
    };
  }>;
  comments: Array<{
    id: string;
    author_id: string;
    body: string;
    created_at: string;
    author: {
      id: string;
      username: string;
      profile_image?: {
        id: string;
      };
    };
  }>;
  repository: {
    id: string;
    name: string;
    owner_user?: {
      id: string;
      username: string;
    };
    owner_org?: {
      id: string;
      name: string;
    };
    prompt?: {
      id: string;
      title: string;
    };
  };
  prompt: {
    id: string;
    title: string;
  };
}

const MergeRequest: React.FC = () => {
  const { mrId } = useParams<{ mrId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  
  const [mergeRequest, setMergeRequest] = useState<MergeRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [confirming, setConfirming] = useState<'approve' | 'reject' | 'merge' | null>(null);
  
  useEffect(() => {
    const fetchMergeRequest = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/merge-requests/${mrId}`);
        setMergeRequest(response.data.mergeRequest);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching merge request:', err);
        setError('Failed to load merge request details');
        setLoading(false);
      }
    };
    
    fetchMergeRequest();
  }, [mrId]);
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !mergeRequest) return;
    
    try {
      setSubmittingComment(true);
      const response = await api.post(`/merge-requests/${mergeRequest.id}/comments`, {
        body: newComment
      });
      
      // Update merge request with new comment
      setMergeRequest({
        ...mergeRequest,
        comments: [...mergeRequest.comments, response.data.comment]
      });
      
      setNewComment('');
      setSubmittingComment(false);
    } catch (err) {
      console.error('Error submitting comment:', err);
      setSubmittingComment(false);
    }
  };
  
  const handleReviewSubmit = async (approved: boolean) => {
    if (!mergeRequest) return;
    
    try {
      setSubmittingReview(true);
      const response = await api.post(`/merge-requests/${mergeRequest.id}/reviews`, {
        approved,
        comment: reviewComment
      });
      
      // Update merge request with new review
      const updatedMergeRequest = { ...mergeRequest };
      
      // Check if user already submitted a review
      const existingReviewIndex = updatedMergeRequest.reviews.findIndex(
        review => review.reviewer_id === user?.id
      );
      
      if (existingReviewIndex >= 0) {
        // Update existing review
        updatedMergeRequest.reviews[existingReviewIndex] = response.data.review;
      } else {
        // Add new review
        updatedMergeRequest.reviews.push(response.data.review);
      }
      
      setMergeRequest(updatedMergeRequest);
      setReviewComment('');
      setSubmittingReview(false);
      setConfirming(null);
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmittingReview(false);
      setConfirming(null);
    }
  };
  
  const handleMerge = async () => {
    if (!mergeRequest) return;
    
    try {
      setSubmittingReview(true);
      const response = await api.post(`/merge-requests/${mergeRequest.id}/merge`);
      
      // Update merge request status
      setMergeRequest({
        ...mergeRequest,
        status: 'merged',
        merged_at: new Date().toISOString()
      });
      
      setSubmittingReview(false);
      setConfirming(null);
    } catch (err) {
      console.error('Error merging request:', err);
      setSubmittingReview(false);
      setConfirming(null);
    }
  };
  
  const userHasReviewed = () => {
    if (!user || !mergeRequest) return false;
    
    return mergeRequest.reviews.some(review => review.reviewer_id === user.id);
  };
  
  const userIsAuthor = () => {
    if (!user || !mergeRequest) return false;
    
    return mergeRequest.author_id === user.id;
  };
  
  const canMerge = () => {
    if (!mergeRequest || mergeRequest.status !== 'open') return false;
    
    const approvals = mergeRequest.reviews.filter(review => review.approved === true).length;
    return approvals > 0;
  };
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error || !mergeRequest) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Merge request not found'}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(mergeRequest.repository.prompt?.id 
            ? `/prompts/${mergeRequest.repository.prompt.id}` 
            : `/repositories/${mergeRequest.repository.id}`)}
          sx={{ mb: 2 }}
        >
          Back to {mergeRequest.repository.prompt?.id ? 'Prompt' : 'Repository'}
        </Button>
        
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              {mergeRequest.prompt.title} - Merge Request #{mergeRequest.id.substring(0, 8)}
            </Typography>
            
            <Chip 
              label={mergeRequest.status === 'open' ? 'Open' : mergeRequest.status === 'merged' ? 'Merged' : 'Rejected'}
              color={mergeRequest.status === 'open' ? 'primary' : mergeRequest.status === 'merged' ? 'success' : 'error'}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              src={mergeRequest.author.profile_image ? `/api/images/${mergeRequest.author.profile_image.id}` : undefined}
              alt={mergeRequest.author.username}
              sx={{ mr: 1 }}
            >
              {mergeRequest.author.username.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box>
              <Typography variant="body1">
                {mergeRequest.author.username} wants to merge changes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created {formatDistanceToNow(new Date(mergeRequest.created_at), { addSuffix: true })}
                {mergeRequest.status === 'merged' && mergeRequest.merged_at && (
                  <>, merged {formatDistanceToNow(new Date(mergeRequest.merged_at), { addSuffix: true })}</>
                )}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Changes
          </Typography>
          
          <Typography variant="body2" gutterBottom>
            <strong>Commit message:</strong> {mergeRequest.source_version.commit_message || 'No message provided'}
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Comparing changes from version {mergeRequest.target_version.version_number} to version {mergeRequest.source_version.version_number}
            </Typography>
            
            <Card variant="outlined" sx={{ mt: 1 }}>
              <CardContent sx={{ p: 0 }}>
                <ReactDiffViewer
                  oldValue={mergeRequest.target_version.content_snapshot}
                  newValue={mergeRequest.source_version.content_snapshot}
                  splitView={true}
                  compareMethod={DiffMethod.WORDS}
                  useDarkTheme={theme.palette.mode === 'dark'}
                />
              </CardContent>
            </Card>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Reviews section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Reviews
            </Typography>
            
            {mergeRequest.reviews.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No reviews yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mergeRequest.reviews.map(review => (
                  <Paper key={review.id} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar 
                        src={review.reviewer.profile_image ? `/api/images/${review.reviewer.profile_image.id}` : undefined}
                        alt={review.reviewer.username}
                        sx={{ width: 32, height: 32, mr: 1 }}
                      >
                        {review.reviewer.username.charAt(0).toUpperCase()}
                      </Avatar>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {review.reviewer.username}
                        </Typography>
                        
                        {review.approved === true ? (
                          <Chip 
                            label="Approved" 
                            color="success" 
                            size="small" 
                            icon={<ApproveIcon />} 
                          />
                        ) : review.approved === false ? (
                          <Chip 
                            label="Rejected" 
                            color="error" 
                            size="small" 
                            icon={<RejectIcon />} 
                          />
                        ) : (
                          <Chip 
                            label="Commented" 
                            color="primary" 
                            size="small" 
                            icon={<CommentIcon />} 
                          />
                        )}
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {formatDistanceToNow(new Date(review.reviewed_at), { addSuffix: true })}
                      </Typography>
                    </Box>
                    
                    {review.comment && (
                      <Typography variant="body2" sx={{ mt: 1, pl: 5 }}>
                        {review.comment}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
            
            {user && mergeRequest.status === 'open' && !userIsAuthor() && (
              <Box sx={{ mt: 3 }}>
                {!userHasReviewed() ? (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Add your review
                    </Typography>
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Add a review comment..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => setConfirming('reject')}
                      >
                        Reject Changes
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => setConfirming('approve')}
                      >
                        Approve
                      </Button>
                    </Box>
                  </Paper>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      You've already reviewed this merge request.
                    </Typography>
                    {canMerge() && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<MergeIcon />}
                        sx={{ mt: 1 }}
                        onClick={() => setConfirming('merge')}
                      >
                        Merge Changes
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Comments section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Comments
            </Typography>
            
            {user && (
              <Paper sx={{ p: 2, mb: 3 }}>
                <form onSubmit={handleCommentSubmit}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={submittingComment}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!newComment.trim() || submittingComment}
                    >
                      {submittingComment ? <CircularProgress size={24} /> : 'Comment'}
                    </Button>
                  </Box>
                </form>
              </Paper>
            )}
            
            {mergeRequest.comments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No comments yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mergeRequest.comments.map(comment => (
                  <Paper key={comment.id} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar 
                        src={comment.author.profile_image ? `/api/images/${comment.author.profile_image.id}` : undefined}
                        alt={comment.author.username}
                        sx={{ width: 32, height: 32, mr: 1 }}
                      >
                        {comment.author.username.charAt(0).toUpperCase()}
                      </Avatar>
                      
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {comment.author.username}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ mt: 1, pl: 5 }}>
                      {comment.body}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
      
      {/* Confirmation dialogs */}
      <Dialog
        open={confirming === 'approve'}
        onClose={() => setConfirming(null)}
      >
        <DialogTitle>Approve changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve these changes?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(null)}>Cancel</Button>
          <Button 
            onClick={() => handleReviewSubmit(true)} 
            color="success" 
            variant="contained"
            disabled={submittingReview}
          >
            {submittingReview ? <CircularProgress size={24} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog
        open={confirming === 'reject'}
        onClose={() => setConfirming(null)}
      >
        <DialogTitle>Reject changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reject these changes?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(null)}>Cancel</Button>
          <Button 
            onClick={() => handleReviewSubmit(false)} 
            color="error"
            variant="contained"
            disabled={submittingReview}
          >
            {submittingReview ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog
        open={confirming === 'merge'}
        onClose={() => setConfirming(null)}
      >
        <DialogTitle>Merge changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to merge these changes? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(null)}>Cancel</Button>
          <Button 
            onClick={handleMerge} 
            color="primary"
            variant="contained"
            disabled={submittingReview}
          >
            {submittingReview ? <CircularProgress size={24} /> : 'Merge'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MergeRequest; 