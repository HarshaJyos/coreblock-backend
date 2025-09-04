import { Request } from "express";

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

interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ITag {
  id: string;
  name: string;
  slug: string;
}

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

interface IBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: RootNode;
  author: IAuthor;
  categories: ICategory[];
  tags: ITag[];
  metadata: IMetadata;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export {
  RootNode,
  ElementNode,
  LeafNode,
  LexicalNode,
  IAuthor,
  ICategory,
  ITag,
  IMetadata,
  IBlogPost,
  CustomError,
  AuthRequest,
};