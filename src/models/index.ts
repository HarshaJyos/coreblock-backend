import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Lexical Node Interfaces
interface RootNode {
  type: "root";
  children: ElementNode[];
  version: number;
  [key: string]: any;
}

interface ElementNode {
  type: string;
  children: (ElementNode | LeafNode)[];
  [key: string]: any;
}

interface LeafNode {
  type: string;
  [key: string]: any;
}

type LexicalNode = RootNode | ElementNode | LeafNode;

// Author Interface
interface IAuthor {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  social?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Category Interface
interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  createdAt: string;
  updatedAt: string;
}

// Tag Interface
interface ITag extends Document {
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// Metadata Interface
interface IMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  coverImage?: string;
  ogImage?: string;
  canonicalUrl?: string;
  readingTimeMinutes?: number;
  wordCount?: number;
  language?: string;
}

// Blog Post Interface
interface IBlogPost extends Document {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: RootNode;
  author: IAuthor;
  categories: mongoose.Types.ObjectId[];
  tags: mongoose.Types.ObjectId[];
  metadata: IMetadata;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Author Schema
const authorSchema = new Schema<IAuthor>({
  id: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String },
  avatarUrl: { type: String },
  bio: { type: String },
  social: {
    twitter: { type: String },
    github: { type: String },
    linkedin: { type: String },
    website: { type: String },
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

// Category Schema
const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  parentId: { type: Schema.Types.ObjectId, ref: "Category" },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

// Tag Schema
const tagSchema = new Schema<ITag>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

// Metadata Schema
const metadataSchema = new Schema<IMetadata>({
  title: { type: String },
  description: { type: String },
  keywords: { type: [String] },
  coverImage: { type: String },
  ogImage: { type: String },
  canonicalUrl: { type: String },
  readingTimeMinutes: { type: Number },
  wordCount: { type: Number },
  language: { type: String },
});

// Blog Post Schema
const blogPostSchema = new Schema<IBlogPost>({
  id: { type: String, default: uuidv4, unique: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: Schema.Types.Mixed, required: true },
  author: { type: authorSchema, required: true },
  categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
  metadata: { type: metadataSchema },
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft",
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  publishedAt: { type: String },
});

// Indexes for performance
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ categories: 1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ title: "text", excerpt: "text" }); // Text index for search

categorySchema.index({ slug: 1 });
categorySchema.index({ name: 1 });
categorySchema.index({ parentId: 1 });

tagSchema.index({ slug: 1 });
tagSchema.index({ name: 1 });

// Models
const BlogPost = mongoose.model<IBlogPost>("BlogPost", blogPostSchema);
const Category = mongoose.model<ICategory>("Category", categorySchema);
const Tag = mongoose.model<ITag>("Tag", tagSchema);

export { BlogPost, Category, Tag, IBlogPost, IAuthor, ICategory, ITag, IMetadata, RootNode };