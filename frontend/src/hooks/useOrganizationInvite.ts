import { useState } from 'react';
import api from '../services/api';
import { useOrganizationDetails } from './useOrganizationDetails';

interface UseOrganizationInvite {
  inviteEmail: string;
  inviteRole: 'ADMIN' | 'MEMBER';
  inviteLoading: boolean;
  inviteError: string | null;
  openInviteDialog: boolean;
  setInviteEmail: (email: string) => void;
  setInviteRole: (role: 'ADMIN' | 'MEMBER') => void;
  setOpenInviteDialog: (open: boolean) => void;
  handleInviteUser: () => Promise<void>;
}

export const useOrganizationInvite = (): UseOrganizationInvite => {
  const { organization, fetchOrganizationDetails } = useOrganizationDetails();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);

  const handleInviteUser = async () => {
    if (!organization?.name || !inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError(null);
    try {
      await api.post(`/organizations/${organization.name}/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole
      });
      fetchOrganizationDetails();
      setOpenInviteDialog(false);
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to invite user');
      console.error('Error inviting user:', err);
    } finally {
      setInviteLoading(false);
    }
  };

  return {
    inviteEmail,
    inviteRole,
    inviteLoading,
    inviteError,
    openInviteDialog,
    setInviteEmail,
    setInviteRole,
    setOpenInviteDialog,
    handleInviteUser
  };
}; 