import { ElectricBolt } from '@mui/icons-material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Card,
  IconButton,
  InputAdornment,
  Link,
  styled,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useLoginForm } from '../hooks/useLoginForm';

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
  width: '55%',
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
  width: '45%',
  padding: theme.spacing(8, 6),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    padding: theme.spacing(4)
  }
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(6),
  width: '100%'
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
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
    }
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, -9px) scale(0.75)',
    color: '#666',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#333',
  },
  '& input::-ms-reveal, & input::-ms-clear': {
    display: 'none'
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
  padding: theme.spacing(6)
}));

const IllustrationContainer = styled(Box)(({ theme }) => ({
  width: '75%',
  height: '60%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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

const carouselItems = [
  {
    image: '/illustrations/yoga.png',
    title: 'Make your work easier and organized',
    feature: 'Smart Design'
  },
  {
    image: '/illustrations/versioning3.png',
    title: 'Version control for your AI prompts',
    feature: 'Progress Tracking'
  },
  {
    image: '/illustrations/tst4.png',
    title: 'Collaborate with your team effectively',
    feature: 'Team Workflow'
  }
];

const Login: React.FC = () => {
  const {
    credentials,
    showPassword,
    error,
    loading,
    handleInputChange,
    handleClickShowPassword,
    handleSubmit,
  } = useLoginForm();
  const location = useLocation();
  
  const [activeStep, setActiveStep] = useState(0);

  // Check for redirected messages in location state
  useEffect(() => {
    if (location.state && location.state.message) {
      // Could handle registration success or other messages
    }
  }, [location]);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prevStep) => (prevStep + 1) % carouselItems.length);
    }, 7000);
    
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
          <Box sx={{ 
            mt: 3, 
            textAlign: 'center', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
          </Box>
        </CarouselContainer>
      </CarouselSection>
      
      {/* Right side: Login Form */}
      <FormSection>
        <LogoContainer>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ElectricBolt sx={{ color: '#000', fontSize: 28, mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
              PromptLab
            </Typography>
          </Box>
        </LogoContainer>
        
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#000', textAlign: 'center' }}>
          Sign in to your account
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 5, color: '#666', textAlign: 'center' }}>
          Simplify your workflow and boost your productivity
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, width: '100%', maxWidth: 400 }}>
            {error}
          </Alert>
        )}
        
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ width: '100%', maxWidth: 560, mx: 'auto', display: 'flex', flexDirection: 'column', animation: 'fadeIn 1s ease-in-out' }}
        >
          <StyledTextField
            required
            fullWidth
            name="username"
            label="Username"
            autoComplete="username"
            value={credentials.username}
            onChange={handleInputChange}
            disabled={loading}
          />
          <StyledTextField
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={credentials.password}
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
          <LoadingButton
            type="submit"
            fullWidth
            loading={loading}
            loadingIndicator="Signing in..."
            disabled={loading}
            sx={{ py: 1.5, mt: 1, mb: 1.5, fontWeight: 600, textTransform: 'none', borderRadius: 12, boxShadow: 'none', backgroundColor: '#333', color: '#fff', transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#000', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' } }}
          >
            Sign In
          </LoadingButton>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" sx={{ color: '#333', textDecoration: 'none', fontWeight: 600, '&:hover': { color: '#000' } }}>
                Register
              </Link>
            </Typography>
          </Box>
        </Box>
      </FormSection>
    </PageContainer>
  );
};

export default Login; 