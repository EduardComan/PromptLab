import React, { useState, useEffect } from 'react';
import {
  Popover,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Comment as CommentIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Merge as MergeIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
}

const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    // Set up polling for new notifications
    const intervalId = setInterval(fetchNotifications, 60000); // Poll every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
      
      // Count unread notifications
      const unread = response.data.notifications.filter(
        (notification: Notification) => !notification.is_read
      ).length;
      setUnreadCount(unread);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      setLoading(false);
    }
  };
  
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        
        // Update local state
        const updatedNotifications = notifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        );
        setNotifications(updatedNotifications);
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
    
    // Navigate based on notification type
    handleClose();
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
        return <CommentIcon color="primary" />;
      case 'REPO_STARRED':
        return <StarIcon color="primary" />;
      case 'USER_FOLLOWED':
        return <PersonIcon color="primary" />;
      case 'MERGE_REQUEST_CREATED':
      case 'MERGE_REQUEST_APPROVED':
      case 'MERGE_REQUEST_REJECTED':
      case 'MERGE_REQUEST_MERGED':
        return <MergeIcon color="primary" />;
      default:
        return <PriorityHighIcon color="primary" />;
    }
  };
  
  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      
      // Update local state
      const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };
  
  const open = Boolean(anchorEl);
  
  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="large"
        color="inherit"
        aria-label="show notifications"
        aria-controls="notifications-popover"
        aria-haspopup="true"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Popover
        id="notifications-popover"
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { 
            width: 360, 
            maxHeight: 500,
            overflowY: 'auto'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {loading && notifications.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              No notifications yet.
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%', p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 1.5,
                    backgroundColor: notification.is_read ? 'inherit' : 'action.hover',
                  }}
                >
                  <Box sx={{ mr: 2 }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <ListItemText
                    primary={notification.message}
                    secondary={formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: notification.is_read ? 'text.primary' : 'text.primary',
                      fontWeight: notification.is_read ? 'normal' : 'medium',
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                    }}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
        
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button 
            size="small" 
            onClick={() => {
              navigate('/notifications');
              handleClose();
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default NotificationCenter; 