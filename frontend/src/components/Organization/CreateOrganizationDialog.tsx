import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import OrganizationCreateForm from './OrganizationCreateForm';
import { Organization } from '../../interfaces';

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (organization: Organization) => void;
}

const CreateOrganizationDialog: React.FC<CreateOrganizationDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div">
            Create Organization
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <OrganizationCreateForm
          onSuccess={onSuccess}
          onCancel={onClose}
          isDialog={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrganizationDialog; 