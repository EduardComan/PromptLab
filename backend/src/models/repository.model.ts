import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Interface for Repository attributes
interface RepositoryAttributes {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  owner_user_id?: string;
  owner_org_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Interface for Repository creation attributes
interface RepositoryCreationAttributes extends Optional<RepositoryAttributes, 'id' | 'is_public' | 'created_at' | 'updated_at'> {}

// Repository model
class Repository extends Model<RepositoryAttributes, RepositoryCreationAttributes> implements RepositoryAttributes {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public is_public!: boolean;
  public owner_user_id!: string | null;
  public owner_org_id!: string | null;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Repository.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    owner_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id',
      },
    },
    owner_org_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id',
      },
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
    modelName: 'Repository',
    tableName: 'repositories',
    timestamps: true,
    underscored: true,
  }
);

export default Repository; 