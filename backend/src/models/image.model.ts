import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Interface for Image attributes
interface ImageAttributes {
  id: string;
  data: Buffer;
  mime_type?: string;
  alt_text?: string;
  source_url?: string;
  created_at: Date;
}

// Interface for Image creation attributes
interface ImageCreationAttributes extends Optional<ImageAttributes, 'id' | 'created_at'> {}

// Image model
class Image extends Model<ImageAttributes, ImageCreationAttributes> implements ImageAttributes {
  public id!: string;
  public data!: Buffer;
  public mime_type!: string | null;
  public alt_text!: string | null;
  public source_url!: string | null;
  public created_at!: Date;

  // Timestamp
  public readonly createdAt!: Date;
}

Image.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    data: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    alt_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    source_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Image',
    tableName: 'images',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

export default Image; 