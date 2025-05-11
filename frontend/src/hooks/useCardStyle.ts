import { useState, useEffect } from 'react';

export type CardStyle = 'narrow' | 'wide';

/**
 * Hook to manage card style preference between narrow and wide layouts
 * @param defaultStyle The default card style to use
 * @returns Object containing current card style and a function to toggle it
 */
export const useCardStyle = (defaultStyle: CardStyle = 'narrow') => {
  const [cardStyle, setCardStyle] = useState<CardStyle>(defaultStyle);

  // Function to toggle between narrow and wide card styles
  const toggleCardStyle = () => {
    setCardStyle(prev => prev === 'narrow' ? 'wide' : 'narrow');
  };

  // Function to explicitly set the card style
  const setStyle = (style: CardStyle) => {
    setCardStyle(style);
  };

  return {
    cardStyle,
    toggleCardStyle,
    setStyle,
    isWide: cardStyle === 'wide',
    isNarrow: cardStyle === 'narrow'
  };
}; 