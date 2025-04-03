import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import Image from './image.model';

// Interface for Account attributes
interface AccountAttributes {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  bio?: string;
  profile_image_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Interface for Account creation attributes
interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at'> {}

// Account model
class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  public id!: string;
  public username!: string;
  public email!: string;
  public password_hash!: string;
  public bio!: string | null;
  public profile_image_id!: string | null;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Account.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profile_image_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'images',
        key: 'id',
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    modelName: 'Account',
    tableName: 'accounts',
    timestamps: true,
    underscored: true,
  }
);

// Association with profile image
Account.belongsTo(Image, {
  foreignKey: 'profile_image_id',
  as: 'profile_image',
});

export default Account; 