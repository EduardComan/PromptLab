import React from 'react';
import RepositoryCard from './RepositoryCard';
import RepositoryWideCard from './RepositoryWideCard';
import { CardStyle } from '../../hooks/useCardStyle';

interface ResponsiveRepositoryCardProps {
  repository: any;
  onStar?: (id: string, isStarred: boolean) => void;
  profileImage?: string;
  cardStyle: CardStyle;
}

/**
 * A component that renders either a wide or narrow repository card based on the cardStyle prop
 */
const ResponsiveRepositoryCard: React.FC<ResponsiveRepositoryCardProps> = ({
  repository,
  onStar,
  profileImage,
  cardStyle
}) => {
  return cardStyle === 'wide' ? (
    <RepositoryWideCard
      repository={repository}
      onStar={onStar}
      profileImage={profileImage}
    />
  ) : (
    <RepositoryCard
      repository={repository}
      onStar={onStar}
    />
  );
};

export default ResponsiveRepositoryCard; 