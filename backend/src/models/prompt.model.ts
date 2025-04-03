import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Interface for Prompt attributes
interface PromptAttributes {
  id: string;
  repo_id: string;
  title: string;
  description?: string;
  content: string;
  metadata_json?: any;
  created_at: Date;
  updated_at: Date;
}

// Interface for Prompt creation attributes
interface PromptCreationAttributes extends Optional<PromptAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Prompt model
class Prompt extends Model<PromptAttributes, PromptCreationAttributes> implements PromptAttributes {
  public id!: string;
  public repo_id!: string;
  public title!: string;
  public description!: string | null;
  public content!: string;
  public metadata_json!: any;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Prompt.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    repo_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'repositories',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Prompt',
    tableName: 'prompts',
    timestamps: true,
    underscored: true,
  }
);

export default Prompt; 