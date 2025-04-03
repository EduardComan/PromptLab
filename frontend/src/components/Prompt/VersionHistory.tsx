import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Typography, 
  Chip, 
  Box, 
  Divider,
  Button
} from '@mui/material';
import { 
  History as HistoryIcon, 
  CompareArrows as CompareIcon,
  RestoreFromTrash as RestoreIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

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

interface VersionHistoryProps {
  versions: Version[];
  currentVersion?: Version;
  onVersionSelect: (version: Version) => void;
  onVersionCompare?: (v1: Version, v2: Version) => void;
  onVersionRestore?: (version: Version) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  currentVersion,
  onVersionSelect,
  onVersionCompare,
  onVersionRestore
}) => {
  const [compareMode, setCompareMode] = React.useState(false);
  const [firstVersionToCompare, setFirstVersionToCompare] = React.useState<Version | null>(null);

  const handleVersionClick = (version: Version) => {
    if (compareMode) {
      if (!firstVersionToCompare) {
        setFirstVersionToCompare(version);
      } else {
        if (onVersionCompare) {
          onVersionCompare(firstVersionToCompare, version);
        }
        setCompareMode(false);
        setFirstVersionToCompare(null);
      }
    } else {
      onVersionSelect(version);
    }
  };

  const handleCompareToggle = () => {
    setCompareMode(!compareMode);
    setFirstVersionToCompare(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant={compareMode ? "contained" : "outlined"}
          startIcon={<CompareIcon />}
          onClick={handleCompareToggle}
          size="small"
        >
          {compareMode ? 'Cancel Compare' : 'Compare Versions'}
        </Button>
      </Box>

      {compareMode && firstVersionToCompare && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Comparing with version {firstVersionToCompare.version_number}
          </Typography>
          <Button 
            size="small" 
            onClick={() => setFirstVersionToCompare(null)}
          >
            Clear
          </Button>
        </Box>
      )}

      {versions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No version history found.
        </Typography>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {versions.map((version, index) => (
            <React.Fragment key={version.id}>
              <ListItemButton 
                selected={
                  (currentVersion && currentVersion.id === version.id) || 
                  (compareMode && firstVersionToCompare?.id === version.id)
                }
                onClick={() => handleVersionClick(version)}
                sx={{ py: 2 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <HistoryIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight="medium">
                        Version {version.version_number}
                      </Typography>
                      {version.commit_message && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ ml: 1, fontStyle: 'italic' }}
                        >
                          - {version.commit_message}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Created {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                        {version.author && ` by ${version.author.username}`}
                      </Typography>
                      {onVersionRestore && version.version_number !== 1 && (
                        <Button 
                          size="small" 
                          startIcon={<RestoreIcon />}
                          sx={{ mt: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onVersionRestore(version);
                          }}
                        >
                          Restore this version
                        </Button>
                      )}
                    </Box>
                  }
                />
                <Box>
                  {index === 0 && (
                    <Chip
                      label="Latest"
                      color="primary"
                      size="small"
                    />
                  )}
                </Box>
              </ListItemButton>
              {index < versions.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default VersionHistory; 