import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Interface for PromptVersion attributes
interface PromptVersionAttributes {
  id: string;
  prompt_id: string;
  content_snapshot: string;
  diff_snapshot?: string;
  commit_message?: string;
  author_id?: string;
  created_at: Date;
  version_number: number;
}

// Interface for PromptVersion creation attributes
interface PromptVersionCreationAttributes extends Optional<PromptVersionAttributes, 'id' | 'created_at'> {}

// PromptVersion model
class PromptVersion extends Model<PromptVersionAttributes, PromptVersionCreationAttributes> implements PromptVersionAttributes {
  public id!: string;
  public prompt_id!: string;
  public content_snapshot!: string;
  public diff_snapshot!: string | null;
  public commit_message!: string | null;
  public author_id!: string | null;
  public created_at!: Date;
  public version_number!: number;

  // Timestamp
  public readonly createdAt!: Date;
}

PromptVersion.init(
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
    content_snapshot: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    diff_snapshot: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    commit_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    version_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'PromptVersion',
    tableName: 'prompt_versions',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

export default PromptVersion; 