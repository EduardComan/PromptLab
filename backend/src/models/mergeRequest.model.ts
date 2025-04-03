import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Interface for MergeRequest attributes
interface MergeRequestAttributes {
  id: string;
  prompt_id: string;
  source_version_id: string;
  target_version_id?: string;
  author_id: string;
  status: 'open' | 'merged' | 'rejected';
  created_at: Date;
  merged_at?: Date;
  auto_merged: boolean;
}

// Interface for MergeRequest creation attributes
interface MergeRequestCreationAttributes extends Optional<MergeRequestAttributes, 'id' | 'auto_merged' | 'created_at' | 'merged_at'> {}

// MergeRequest model
class MergeRequest extends Model<MergeRequestAttributes, MergeRequestCreationAttributes> implements MergeRequestAttributes {
  public id!: string;
  public prompt_id!: string;
  public source_version_id!: string;
  public target_version_id!: string | null;
  public author_id!: string;
  public status!: 'open' | 'merged' | 'rejected';
  public created_at!: Date;
  public merged_at!: Date | null;
  public auto_merged!: boolean;

  // Timestamp
  public readonly createdAt!: Date;
}

MergeRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prompt_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'prompts',
        key: 'id',
      },
    },
    source_version_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'prompt_versions',
        key: 'id',
      },
    },
    target_version_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'prompt_versions',
        key: 'id',
      },
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        isIn: [['open', 'merged', 'rejected']],
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    merged_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    auto_merged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'MergeRequest',
    tableName: 'merge_requests',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

export default MergeRequest; 