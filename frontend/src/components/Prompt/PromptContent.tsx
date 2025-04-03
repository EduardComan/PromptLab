import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 as darkTheme } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface PromptContentProps {
  content: string;
  metadata?: any;
}

// Styled component for highlighting placeholders
const HighlightedPrompt = styled('div')(({ theme }) => ({
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  '& .placeholder': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: '2px 4px',
    borderRadius: '4px',
    margin: '0 2px',
    display: 'inline-block',
  },
}));

const PromptContent: React.FC<PromptContentProps> = ({ content, metadata }) => {
  // Extract variable placeholders using regex
  const extractPlaceholders = (text: string): string[] => {
    const regex = /{{(.*?)}}/g;
    const placeholders: string[] = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const placeholder = match[1].trim();
      if (!placeholders.includes(placeholder)) {
        placeholders.push(placeholder);
      }
    }
    
    return placeholders;
  };
  
  // Convert text with placeholders to highlighted format
  const highlightPlaceholders = (text: string): React.ReactNode => {
    const parts = text.split(/({{.*?}})/g);
    
    return parts.map((part, index) => {
      if (part.match(/{{.*?}}/)) {
        const variableName = part.replace(/{{|}}/g, '').trim();
        return <span key={index} className="placeholder">{`{{${variableName}}}`}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };
  
  const placeholders = extractPlaceholders(content);
  
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Prompt Content
        </Typography>
        
        <HighlightedPrompt>
          {highlightPlaceholders(content)}
        </HighlightedPrompt>
      </Box>
      
      {placeholders.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Variables
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {placeholders.map((placeholder) => (
              <Chip
                key={placeholder}
                label={placeholder}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}
      
      {metadata && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Configuration
          </Typography>
          
          <SyntaxHighlighter language="json" style={darkTheme}>
            {JSON.stringify(metadata, null, 2)}
          </SyntaxHighlighter>
        </Box>
      )}
    </Box>
  );
};

export default PromptContent; 