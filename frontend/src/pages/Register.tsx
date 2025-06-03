import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography, 
  TextField, 
  Button,
  Link,
  Alert,
  CircularProgress,
  useTheme,
  styled,
  IconButton,
  InputAdornment,
  Divider,
  Card,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData } from '../interfaces';
import { RocketLaunch as RocketIcon, ElectricBolt } from '@mui/icons-material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';
import FacebookIcon from '@mui/icons-material/Facebook';
import { PersonOutline as PersonOutlineIcon } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useRegisterForm } from '../hooks/useRegisterForm';

// Styled components
const PageContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  position: 'relative',
  overflow: 'hidden',
  background: '#FFFFFF'
}));

const CarouselSection = styled(Box)(({ theme }) => ({
  backgroundColor: '#FAFAFA',
  width: '45%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}));

const CarouselContainer = styled(Box)(({ theme }) => ({
  width: '85%',
  height: '85%',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center'
}));

const FormSection = styled(Box)(({ theme }) => ({
  width: '55%',
  padding: theme.spacing(4, 6),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    padding: theme.spacing(3)
  }
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
  width: '100%'
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    height: '50px',
    backgroundColor: '#f7f9fc',
    '& fieldset': {
      borderColor: '#E0E0E0',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: '#333',
    },
    '& input': {
      color: '#000',
      fontWeight: 500,
    },
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, -9px) scale(0.75)',
    color: '#666',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#333',
  }
}));

const StyledTextFieldMultiline = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#f7f9fc',
    '& fieldset': {
      borderColor: '#E0E0E0',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: '#333',
    },
    '& textarea': {
      color: '#000',
      fontWeight: 500,
    },
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, -9px) scale(0.75)',
    color: '#666',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#333',
  }
}));

const SocialButton = styled(IconButton)(({ theme }) => ({
  border: '1px solid #E0E0E0',
  borderRadius: '50%',
  padding: theme.spacing(1.2),
  color: '#666',
  backgroundColor: 'white',
  '&:hover': {
    backgroundColor: '#F8F8F8'
  }
}));

const ModernCard = styled(Card)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 24,
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.06)',
  background: 'white',
  overflow: 'hidden',
  position: 'relative'
}));

const CarouselContent = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  position: 'relative',
}));

const CarouselSlide = styled(Box)<{ active: string }>(({ theme, active }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: active === "true" ? 1 : 0,
  transform: active === "true" ? 'translateY(0)' : 'translateY(20px)',
  transition: 'opacity 0.6s ease, transform 0.6s ease',
  padding: theme.spacing(6),
  paddingTop: theme.spacing(10)
}));

const IllustrationContainer = styled(Box)(({ theme }) => ({
  width: '75%',
  height: '55%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: theme.spacing(6),
  marginBottom: theme.spacing(4)
}));

const Feature = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: '#F9F9F9',
  borderRadius: 20,
  padding: theme.spacing(0.5, 2),
  margin: theme.spacing(0.5),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  }
}));

const ScrollableFormContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxHeight: '70vh',
  overflowY: 'auto',
  paddingRight: '16px',
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
    borderRadius: '10px'
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#c1c1c1',
    borderRadius: '10px'
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#a8a8a8'
  }
}));

// const GlobalStyles = () => {
//   return (
//     <style>
//       {`
//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(10px); }
//           to { opacity: 1; transform: translateY(0); }
//         }

//         @keyframes slideUp {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }

//         @keyframes fadeScale {
//           from { opacity: 0; transform: scale(0.9); }
//           to { opacity: 1; transform: scale(1); }
//         }
//       `}
//     </style>
//   );
// };

const carouselItems = [
  {
    image: '/illustrations/yoga.png',
    title: 'Make your work easier and organized',
    description: 'Simplify your workflow and boost your productivity with PromptLab.',
    tagline: 'Effortless Productivity',
    feature: 'Smart Design'
  },
  {
    image: '/illustrations/versioning3.png',
    title: 'Version control for your AI prompts',
    description: 'Track changes and manage different versions of your prompts easily.',
    tagline: 'Intelligent Versioning',
    feature: 'Progress Tracking'
  },
  {
    image: '/illustrations/tst4.png',
    title: 'Collaborate with your team effectively',
    description: 'Share and manage prompts with your team members seamlessly.',
    tagline: 'Seamless Collaboration',
    feature: 'Team Workflow'
  }
];

const Register: React.FC = () => {
  const {
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
    handleSubmit,
  } = useRegisterForm();

  const [activeStep, setActiveStep] = useState(0);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prevStep) => (prevStep + 1) % carouselItems.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, []);

  const handleDotClick = (index: number) => {
    setActiveStep(index);
  };
  
  return (
    <PageContainer>
      {/* <GlobalStyles /> */}
      {/* Left side: Image Carousel */}
      <CarouselSection>
        <CarouselContainer>
          <ModernCard>
            <CarouselContent>
              {carouselItems.map((item, index) => (
                <CarouselSlide 
                  key={index}
                  active={index === activeStep ? "true" : "false"}
                >
                  <IllustrationContainer sx={{ animation: 'fadeScale 1s ease-in-out' }}>
                    <Box 
                      component="img"
                      src={item.image} 
                      alt={item.title}
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/logo192.png';
                      }}
                      sx={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </IllustrationContainer>
                  
                  <Typography 
                    variant="h4" 
                    component="h2" 
                    align="center" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 1,
                      color: '#000',
                      width: '85%',
                      lineHeight: 1.3,
                      animation: 'slideUp 1s ease-in-out',
                      animationDelay: '0.2s',
                      animationFillMode: 'both',
                      fontSize: '1.75rem'
                    }}
                  >
                    {item.title}
                  </Typography>
                  
                  <Feature sx={{ 
                    animation: 'slideUp 1s ease-in-out',
                    animationDelay: '0.4s',
                    animationFillMode: 'both'
                  }}>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: '#333',
                        fontWeight: 500,
                      }}
                    >
                      {item.feature}
                    </Typography>
                  </Feature>
                </CarouselSlide>
              ))}
            </CarouselContent>
          </ModernCard>
        
          {/* Dots indicator */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mt: 3
          }}>
            {carouselItems.map((_, index) => (
              <Box
                key={index}
                onClick={() => handleDotClick(index)}
                sx={{
                  width: index === activeStep ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  mx: 0.5,
                  backgroundColor: index === activeStep ? '#000' : 'rgba(0,0,0,0.15)',
                  transition: 'all 0.4s ease',
                  cursor: 'pointer'
                }}
              />
            ))}
          </Box>
          
          {/* Bottom branding */}
          {/* <Box sx={{ 
            mt: 3, 
            textAlign: 'center', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#666', 
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              Powered by 
              <Typography 
                component="span" 
                variant="body1" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ElectricBolt sx={{ fontSize: 14, mr: 0.5 }} />
                PromptLab
              </Typography>
            </Typography> */}
          {/* </Box> */}
        </CarouselContainer>
      </CarouselSection>
      
      {/* Right side: Registration Form */}
      <FormSection>
        <LogoContainer>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ElectricBolt sx={{ color: '#000', fontSize: 32, mr: 1.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
              PromptLab
            </Typography>
          </Box>
        </LogoContainer>
        
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#000', textAlign: 'center' }}>
          Create your account
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 6, color: '#666', textAlign: 'center' }}>
        Join a growing community of users collaborating on AI prompts
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2, width: '100%', maxWidth: 560 }}>
            {error}
          </Alert>
        )}
        
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ 
            width: '100%', 
            maxWidth: 560,
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 1s ease-in-out',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, width: '100%' }}>
            <StyledTextField
              required
              fullWidth
              name="username"
              label="Username"
              autoComplete="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={loading}
            />
            
            <StyledTextField
              required
              fullWidth
              name="email"
              label="Email Address"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
          </Box>
          
          <StyledTextField
            fullWidth
            name="full_name"
            label="Full Name"
            autoComplete="name"
            value={formData.full_name}
            onChange={handleInputChange}
            disabled={loading}
          />
          
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, width: '100%' }}>
            <StyledTextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      size="small"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />
            
            <StyledTextField
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={handleInputChange}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                      size="small"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />
          </Box>
          
          <StyledTextFieldMultiline
            fullWidth
            name="bio"
            label="Bio"
            multiline
            rows={2}
            value={formData.bio}
            onChange={handleInputChange}
            InputLabelProps={{
              shrink: true,
            }}
            disabled={loading}
          />
          
          <FormControlLabel
            control={
              <Checkbox 
                checked={termsAccepted} 
                onChange={handleTermsChange} 
                sx={{
                  color: '#333',
                  '&.Mui-checked': {
                    color: '#333',
                  },
                }}
                disabled={loading}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: '#666' }}>
                I agree to the {' '}
                <Link component={RouterLink} to="/terms" sx={{ color: '#333', textDecoration: 'none', fontWeight: 600, '&:hover': { color: '#000' } }}>
                  Terms & Conditions
                </Link>
              </Typography>
            }
          />
          {error && (
            <Typography color="error" variant="caption" sx={{ display: 'block', ml: 2, mb: 1 }}>
              {error}
            </Typography>
          )}
          
          <LoadingButton
            type="submit"
            fullWidth
            loading={loading}
            loadingIndicator="Creating account..."
            disabled={loading}
            sx={{ 
              py: 1.5,
              mt: 1,
              mb: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 12,
              boxShadow: 'none',
              backgroundColor: '#333',
              color: '#fff',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#000',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            Create Account
          </LoadingButton>
          
          {/* <Box sx={{ display: 'flex', alignItems: 'center', my: 1.5 }}>
            <Divider sx={{ flex: 1 }} />
            <Typography variant="body2" sx={{ mx: 2, color: '#888' }}>
              or continue with
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 2 }}>
            <SocialButton aria-label="Google">
              <GoogleIcon />
            </SocialButton>
            <SocialButton aria-label="Apple">
              <AppleIcon />
            </SocialButton>
            <SocialButton aria-label="Facebook">
              <FacebookIcon />
            </SocialButton>
          </Box> */}
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" sx={{ color: '#333', textDecoration: 'none', fontWeight: 600, '&:hover': { color: '#000' } }}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </Box>
      </FormSection>
    </PageContainer>
  );
};

export default Register;