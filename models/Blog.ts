import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  imageUrl: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    titleBn: { type: String, required: true },
    description: { type: String, required: true },
    descriptionBn: { type: String, required: true },
    imageUrl: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true, index: true },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Blog = mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);
export default Blog;
