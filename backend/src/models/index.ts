import sequelize from '../config/database';

// Import models
import Account from './account.model';
import Image from './image.model';
import Organization from './organization.model';
import OrgMembership from './orgMembership.model';
import Repository from './repository.model';
import RepoCollaborator from './repoCollaborator.model';
import Prompt from './prompt.model';
import PromptVersion from './promptVersion.model';
import Fork from './fork.model';
import Star from './star.model';
import Follow from './follow.model';
import Tag from './tag.model';
import PromptTag from './promptTag.model';
import PromptComment from './promptComment.model';
import Notification from './notification.model';
import Badge from './badge.model';
import UserBadge from './userBadge.model';
import PromptRun from './promptRun.model';
import MergeRequest from './mergeRequest.model';
import MergeRequestReview from './mergeRequestReview.model';
import MergeRequestComment from './mergeRequestComment.model';

// Define relationships between models
// These will be automatically set up when importing this file

// Account <-> Image (Profile)
Account.belongsTo(Image, {
  foreignKey: 'profile_image_id',
  as: 'profile_image',
});

// Organization <-> Image (Logo)
Organization.belongsTo(Image, {
  foreignKey: 'logo_image_id',
  as: 'logo_image',
});

// Organization <-> Account (Owner)
Organization.belongsTo(Account, {
  foreignKey: 'owner_id',
  as: 'owner',
});

// OrgMembership relationships
OrgMembership.belongsTo(Organization, {
  foreignKey: 'org_id',
  onDelete: 'CASCADE',
});
OrgMembership.belongsTo(Account, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});
Organization.hasMany(OrgMembership, {
  foreignKey: 'org_id',
  as: 'memberships',
});
Account.hasMany(OrgMembership, {
  foreignKey: 'user_id',
  as: 'org_memberships',
});

// Repository relationships
Repository.belongsTo(Account, {
  foreignKey: 'owner_user_id',
  as: 'owner_user',
});
Repository.belongsTo(Organization, {
  foreignKey: 'owner_org_id',
  as: 'owner_org',
});
Account.hasMany(Repository, {
  foreignKey: 'owner_user_id',
  as: 'repositories',
});
Organization.hasMany(Repository, {
  foreignKey: 'owner_org_id',
  as: 'repositories',
});

// RepoCollaborator relationships
RepoCollaborator.belongsTo(Repository, {
  foreignKey: 'repo_id',
  onDelete: 'CASCADE',
});
RepoCollaborator.belongsTo(Account, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});
Repository.hasMany(RepoCollaborator, {
  foreignKey: 'repo_id',
  as: 'collaborators',
});
Account.hasMany(RepoCollaborator, {
  foreignKey: 'user_id',
  as: 'repository_collaborations',
});

// Prompt relationships
Prompt.belongsTo(Repository, {
  foreignKey: 'repo_id',
  onDelete: 'CASCADE',
});
Repository.hasOne(Prompt, {
  foreignKey: 'repo_id',
  as: 'prompt',
});

// PromptVersion relationships
PromptVersion.belongsTo(Prompt, {
  foreignKey: 'prompt_id',
  onDelete: 'CASCADE',
});
PromptVersion.belongsTo(Account, {
  foreignKey: 'author_id',
  as: 'author',
});
Prompt.hasMany(PromptVersion, {
  foreignKey: 'prompt_id',
  as: 'versions',
});

// Fork relationships
Fork.belongsTo(Repository, {
  foreignKey: 'source_repo_id',
  onDelete: 'CASCADE',
  as: 'source_repo',
});
Fork.belongsTo(Repository, {
  foreignKey: 'forked_repo_id',
  onDelete: 'CASCADE',
  as: 'forked_repo',
});
Repository.hasMany(Fork, {
  foreignKey: 'source_repo_id',
  as: 'forks',
});
Repository.hasOne(Fork, {
  foreignKey: 'forked_repo_id',
  as: 'fork_source',
});

// Star relationships
Star.belongsTo(Account, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});
Star.belongsTo(Repository, {
  foreignKey: 'repo_id',
  onDelete: 'CASCADE',
});
Account.hasMany(Star, {
  foreignKey: 'user_id',
  as: 'stars',
});
Repository.hasMany(Star, {
  foreignKey: 'repo_id',
  as: 'stars',
});

// Follow relationships
Follow.belongsTo(Account, {
  foreignKey: 'follower_id',
  onDelete: 'CASCADE',
  as: 'follower',
});
Follow.belongsTo(Account, {
  foreignKey: 'followee_id',
  onDelete: 'CASCADE',
  as: 'followee',
});
Account.hasMany(Follow, {
  foreignKey: 'follower_id',
  as: 'following',
});
Account.hasMany(Follow, {
  foreignKey: 'followee_id',
  as: 'followers',
});

// PromptTag relationships
PromptTag.belongsTo(Prompt, {
  foreignKey: 'prompt_id',
  onDelete: 'CASCADE',
});
PromptTag.belongsTo(Tag, {
  foreignKey: 'tag_id',
});
Prompt.hasMany(PromptTag, {
  foreignKey: 'prompt_id',
  as: 'prompt_tags',
});
Tag.hasMany(PromptTag, {
  foreignKey: 'tag_id',
  as: 'prompt_tags',
});

// PromptComment relationships
PromptComment.belongsTo(Prompt, {
  foreignKey: 'prompt_id',
  onDelete: 'CASCADE',
});
PromptComment.belongsTo(Account, {
  foreignKey: 'author_id',
  as: 'author',
});
Prompt.hasMany(PromptComment, {
  foreignKey: 'prompt_id',
  as: 'comments',
});
Account.hasMany(PromptComment, {
  foreignKey: 'author_id',
  as: 'prompt_comments',
});

// Notification relationships
Notification.belongsTo(Account, {
  foreignKey: 'recipient_id',
});
Account.hasMany(Notification, {
  foreignKey: 'recipient_id',
  as: 'notifications',
});

// Badge relationships
Badge.belongsTo(Image, {
  foreignKey: 'icon_image_id',
  as: 'icon_image',
});

// UserBadge relationships
UserBadge.belongsTo(Account, {
  foreignKey: 'user_id',
});
UserBadge.belongsTo(Badge, {
  foreignKey: 'badge_id',
});
Account.hasMany(UserBadge, {
  foreignKey: 'user_id',
  as: 'badges',
});
Badge.hasMany(UserBadge, {
  foreignKey: 'badge_id',
  as: 'users',
});

// PromptRun relationships
PromptRun.belongsTo(Prompt, {
  foreignKey: 'prompt_id',
  onDelete: 'CASCADE',
});
PromptRun.belongsTo(PromptVersion, {
  foreignKey: 'version_id',
  onDelete: 'SET NULL',
});
PromptRun.belongsTo(Account, {
  foreignKey: 'user_id',
  onDelete: 'SET NULL',
});
Prompt.hasMany(PromptRun, {
  foreignKey: 'prompt_id',
  as: 'runs',
});
PromptVersion.hasMany(PromptRun, {
  foreignKey: 'version_id',
  as: 'runs',
});
Account.hasMany(PromptRun, {
  foreignKey: 'user_id',
  as: 'prompt_runs',
});

// MergeRequest relationships
MergeRequest.belongsTo(Prompt, {
  foreignKey: 'prompt_id',
  onDelete: 'CASCADE',
});
MergeRequest.belongsTo(PromptVersion, {
  foreignKey: 'source_version_id',
  as: 'source_version',
});
MergeRequest.belongsTo(PromptVersion, {
  foreignKey: 'target_version_id',
  as: 'target_version',
});
MergeRequest.belongsTo(Account, {
  foreignKey: 'author_id',
  as: 'author',
});
Prompt.hasMany(MergeRequest, {
  foreignKey: 'prompt_id',
  as: 'merge_requests',
});
Account.hasMany(MergeRequest, {
  foreignKey: 'author_id',
  as: 'authored_merge_requests',
});

// MergeRequestReview relationships
MergeRequestReview.belongsTo(MergeRequest, {
  foreignKey: 'merge_request_id',
  onDelete: 'CASCADE',
});
MergeRequestReview.belongsTo(Account, {
  foreignKey: 'reviewer_id',
  as: 'reviewer',
});
MergeRequest.hasMany(MergeRequestReview, {
  foreignKey: 'merge_request_id',
  as: 'reviews',
});
Account.hasMany(MergeRequestReview, {
  foreignKey: 'reviewer_id',
  as: 'merge_request_reviews',
});

// MergeRequestComment relationships
MergeRequestComment.belongsTo(MergeRequest, {
  foreignKey: 'merge_request_id',
  onDelete: 'CASCADE',
});
MergeRequestComment.belongsTo(Account, {
  foreignKey: 'author_id',
  as: 'author',
});
MergeRequest.hasMany(MergeRequestComment, {
  foreignKey: 'merge_request_id',
  as: 'comments',
});
Account.hasMany(MergeRequestComment, {
  foreignKey: 'author_id',
  as: 'merge_request_comments',
});

// Export models
export {
  sequelize,
  Account,
  Image,
  Organization,
  OrgMembership,
  Repository,
  RepoCollaborator,
  Prompt,
  PromptVersion,
  Fork,
  Star,
  Follow,
  Tag,
  PromptTag,
  PromptComment,
  Notification,
  Badge,
  UserBadge,
  PromptRun,
  MergeRequest,
  MergeRequestReview,
  MergeRequestComment,
}; 