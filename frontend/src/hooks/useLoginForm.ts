import { useState } from 'react';
import { LoginCredentials } from '../interfaces';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UseLoginForm {
  credentials: LoginCredentials;
  showPassword: boolean;
  error: string | null;
  loading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClickShowPassword: () => void;
  validateForm: () => boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useLoginForm = (): UseLoginForm => {
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleClickShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  const validateForm = (): boolean => {
    if (!credentials.username || !credentials.password) {
      setError('All fields are required');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Use the login function from AuthContext
      await login(credentials.username, credentials.password);
      // Navigate to dashboard after successful login
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (err: any) {
      // Error is already handled by AuthContext and available via authError
      setError(authError || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    credentials,
    showPassword,
    error,
    loading,
    handleInputChange,
    handleClickShowPassword,
    validateForm,
    handleSubmit,
  };
}; 