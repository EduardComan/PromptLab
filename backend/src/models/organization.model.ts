import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Interface for Organization attributes
interface OrganizationAttributes {
  id: string;
  name: string;
  description?: string;
  logo_image_id?: string;
  owner_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Interface for Organization creation attributes
interface OrganizationCreationAttributes extends Optional<OrganizationAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Organization model
class Organization extends Model<OrganizationAttributes, OrganizationCreationAttributes> implements OrganizationAttributes {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public logo_image_id!: string | null;
  public owner_id!: string | null;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Organization.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    logo_image_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'images',
        key: 'id',
      },
    },
    owner_id: {
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
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Organization',
    tableName: 'organizations',
    timestamps: true,
    underscored: true,
  }
);

export default Organization; 