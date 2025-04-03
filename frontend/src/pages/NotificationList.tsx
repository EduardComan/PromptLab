import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  CircularProgress,
  Chip,
  Alert,
  Pagination
} from '@mui/material';
import {
  Comment as CommentIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Merge as MergeIcon,
  PriorityHigh as PriorityHighIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  notifications: Notification[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const NotificationList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchNotifications();
  }, [user, page, filterType, unreadOnly]);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      let url = `/notifications?page=${page}&per_page=20`;
      if (filterType) url += `&type=${filterType}`;
      if (unreadOnly) url += '&unread=true';
      
      const response = await api.get<PaginatedResponse>(url);
      
      setNotifications(response.data.notifications);
      setTotalPages(response.data.total_pages);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      setLoading(false);
    }
  };
  
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  const handleFilterChange = (type: string | null) => {
    setFilterType(type);
    setPage(1);
  };
  
  const handleUnreadToggle = () => {
    setUnreadOnly(!unreadOnly);
    setPage(1);
  };
  
  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };
  
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        
        // Update local state
        const updatedNotifications = notifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        );
        setNotifications(updatedNotifications);
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
    
    // Navigate based on notification type
    navigateToReference(notification);
  };
  
  const navigateToReference = (notification: Notification) => {
    if (!notification.reference_id) return;
    
    switch (notification.type) {
      case 'COMMENT_POSTED':
        navigate(`/prompts/${notification.reference_id}`);
        break;
      case 'REPO_STARRED':
        navigate(`/repositories/${notification.reference_id}`);
        break;
      case 'USER_FOLLOWED':
        navigate(`/profile`);
        break;
      case 'MERGE_REQUEST_CREATED':
      case 'MERGE_REQUEST_APPROVED':
      case 'MERGE_REQUEST_REJECTED':
      case 'MERGE_REQUEST_MERGED':
        navigate(`/merge-requests/${notification.reference_id}`);
        break;
      case 'ADDED_TO_ORG':
        navigate(`/organizations/${notification.reference_id}`);
        break;
      case 'BADGE_EARNED':
        navigate(`/profile#badges`);
        break;
      default:
        // For unknown types, do nothing
        break;
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'COMMENT_POSTED':
        return <CommentIcon />;
      case 'REPO_STARRED':
        return <StarIcon />;
      case 'USER_FOLLOWED':
        return <PersonIcon />;
      case 'MERGE_REQUEST_CREATED':
      case 'MERGE_REQUEST_APPROVED':
      case 'MERGE_REQUEST_REJECTED':
      case 'MERGE_REQUEST_MERGED':
        return <MergeIcon />;
      case 'ADDED_TO_ORG':
        return <BusinessIcon />;
      case 'BADGE_EARNED':
        return <EmojiEventsIcon />;
      default:
        return <PriorityHighIcon />;
    }
  };
  
  const notificationTypes = [
    { type: 'COMMENT_POSTED', label: 'Comments', icon: <CommentIcon fontSize="small" /> },
    { type: 'REPO_STARRED', label: 'Stars', icon: <StarIcon fontSize="small" /> },
    { type: 'USER_FOLLOWED', label: 'Follows', icon: <PersonIcon fontSize="small" /> },
    { type: 'MERGE_REQUEST', label: 'Merge Requests', icon: <MergeIcon fontSize="small" /> },
    { type: 'BADGE_EARNED', label: 'Badges', icon: <EmojiEventsIcon fontSize="small" /> },
    { type: 'ADDED_TO_ORG', label: 'Organizations', icon: <BusinessIcon fontSize="small" /> }
  ];
  
  const getUnreadCount = () => {
    return notifications.filter(n => !n.is_read).length;
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Notifications
          </Typography>
          
          <Box>
            <Button 
              variant={unreadOnly ? "contained" : "outlined"} 
              size="small" 
              startIcon={<CheckCircleIcon />}
              onClick={handleUnreadToggle}
              sx={{ mr: 1 }}
            >
              {unreadOnly ? "Showing Unread" : "Show Unread Only"}
            </Button>
            
            <Button 
              variant="outlined" 
              size="small"
              onClick={handleMarkAllRead}
              disabled={getUnreadCount() === 0}
            >
              Mark All as Read
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          <Chip 
            label="All" 
            onClick={() => handleFilterChange(null)}
            color={filterType === null ? "primary" : "default"}
            variant={filterType === null ? "filled" : "outlined"}
          />
          
          {notificationTypes.map(type => (
            <Chip 
              key={type.type}
              label={type.label}
              icon={type.icon}
              onClick={() => handleFilterChange(type.type)}
              color={filterType === type.type ? "primary" : "default"}
              variant={filterType === type.type ? "filled" : "outlined"}
            />
          ))}
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : notifications.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No notifications found
          </Alert>
        ) : (
          <List>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  button 
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 2,
                    backgroundColor: notification.is_read ? 'inherit' : 'action.hover',
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body1" 
                        fontWeight={notification.is_read ? 'normal' : 'medium'}
                      >
                        {notification.message}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </Typography>
                    }
                  />
                  
                  {!notification.is_read && (
                    <Chip 
                      label="New" 
                      color="primary" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
        
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationList; 