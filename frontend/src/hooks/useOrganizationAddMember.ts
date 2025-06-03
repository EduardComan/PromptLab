import { useState } from 'react';
import api from '../services/api';
import { useOrganizationDetails } from './useOrganizationDetails';

interface UseOrganizationAddMember {
  addUsername: string;
  addRole: 'ADMIN' | 'MEMBER';
  addLoading: boolean;
  addError: string | null;
  openAddDialog: boolean;
  setAddUsername: (username: string) => void;
  setAddRole: (role: 'ADMIN' | 'MEMBER') => void;
  setOpenAddDialog: (open: boolean) => void;
  handleAddUser: (username?: string, onSuccess?: () => void) => Promise<void>;
}

export const useOrganizationAddMember = (): UseOrganizationAddMember => {
  const { organization, fetchOrganizationDetails } = useOrganizationDetails();
  const [addUsername, setAddUsername] = useState('');
  const [addRole, setAddRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);

  const handleAddUser = async (username?: string, onSuccess?: () => void) => {
    const usernameToAdd = username || addUsername;
    if (!organization?.id || !usernameToAdd.trim()) return;
    
    setAddLoading(true);
    setAddError(null);
    try {
      await api.post(`/organizations/${organization.id}/invite`, {
        username: usernameToAdd.trim(),
        role: addRole
      });
      await fetchOrganizationDetails(); // Wait for refresh to complete
      setOpenAddDialog(false);
      setAddUsername(''); // Clear the input
      if (onSuccess) {
        onSuccess(); // Call success callback to show success message
      }
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Failed to add user');
      console.error('Error adding user:', err);
    } finally {
      setAddLoading(false);
    }
  };

  return {
    addUsername,
    addRole,
    addLoading,
    addError,
    openAddDialog,
    setAddUsername,
    setAddRole,
    setOpenAddDialog,
    handleAddUser
  };
}; 