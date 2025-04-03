import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Interface for PromptRun attributes
interface PromptRunAttributes {
  id: string;
  prompt_id: string;
  version_id?: string;
  user_id?: string;
  model: string;
  input_variables: any; // JSONB
  rendered_prompt?: string;
  output?: string;
  success: boolean;
  error_message?: string;
  metadata?: any; // JSONB
  created_at: Date;
}

// Interface for PromptRun creation attributes
interface PromptRunCreationAttributes extends Optional<PromptRunAttributes, 'id' | 'success' | 'created_at'> {}

// PromptRun model
class PromptRun extends Model<PromptRunAttributes, PromptRunCreationAttributes> implements PromptRunAttributes {
  public id!: string;
  public prompt_id!: string;
  public version_id!: string | null;
  public user_id!: string | null;
  public model!: string;
  public input_variables!: any; // JSONB
  public rendered_prompt!: string | null;
  public output!: string | null;
  public success!: boolean;
  public error_message!: string | null;
  public metadata!: any | null; // JSONB
  public created_at!: Date;

  // Timestamp
  public readonly createdAt!: Date;
}

PromptRun.init(
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
    version_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'prompt_versions',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id',
      },
    },
    model: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    input_variables: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    rendered_prompt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    output: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    success: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'PromptRun',
    tableName: 'prompt_runs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

export default PromptRun; 