import { useState } from 'react';
import { RegisterData } from '../interfaces';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UseRegisterForm {
  formData: RegisterData;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  termsAccepted: boolean;
  error: string | null;
  loading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClickShowPassword: () => void;
  handleClickShowConfirmPassword: () => void;
  handleTermsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validateForm: () => boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useRegisterForm = (): UseRegisterForm => {
  const { register, error: authError } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    bio: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(prev => !prev);
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermsAccepted(e.target.checked);
  };

  const validateForm = (): boolean => {
    // Check required fields
    if (!formData.username || !formData.email || !formData.password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }
    
    // Username validation: 3-30 characters
    if (formData.username.length < 3 || formData.username.length > 30) {
      setError('Username must be between 3 and 30 characters');
      return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Password validation: at least 6 characters
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    // Password confirmation
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Terms acceptance
    if (!termsAccepted) {
      setError('You must accept the terms and conditions');
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
      // Use the register function from AuthContext
      await register(formData);
      // Navigate to dashboard after successful registration
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (err: any) {
      // Error is already handled by AuthContext and available via authError
      setError(authError || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    termsAccepted,
    error,
    loading,
    handleInputChange,
    handleClickShowPassword,
    handleClickShowConfirmPassword,
    handleTermsChange,
    validateForm,
    handleSubmit,
  };
}; 