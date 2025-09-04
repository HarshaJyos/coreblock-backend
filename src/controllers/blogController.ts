import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import slugify from "slugify";
import mongoose from "mongoose";
import { BlogPost, Category, Tag } from "../models";
import CustomError from "../utils/customError";
import { logger } from "../utils/logger";

// Zod schemas for validation
const authorSchema = z.object({
  id: z.string().min(1, "Author ID is required"),
  name: z.string().min(1, "Author name is required"),
  username: z.string().min(1, "Author username is required"),
  email: z.string().email().optional(),
  avatarUrl: z.string().optional(),
  bio: z.string().optional(),
  social: z
    .object({
      twitter: z.string().optional(),
      github: z.string().optional(),
      linkedin: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
});

const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  content: z.any().refine((val) => val && val.type === "root", { message: "Invalid content format" }),
  author: authorSchema,
  categories: z
    .array(z.string().refine((val) => mongoose.isValidObjectId(val), { message: "Invalid category ID" }))
    .optional(),
  tags: z.array(z.string().refine((val) => mongoose.isValidObjectId(val), { message: "Invalid tag ID" })).optional(),
  metadata: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      coverImage: z.string().optional(),
      ogImage: z.string().optional(),
      canonicalUrl: z.string().optional(),
      readingTimeMinutes: z.number().optional(),
      wordCount: z.number().optional(),
      language: z.string().optional(),
    })
    .optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  publishedAt: z.string().optional(),
});

const updateBlogSchema = blogSchema.partial().omit({ content: true, author: true }); // Content and author not updatable

const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

const searchByTagsSchema = z.object({
  tagIds: z
    .string()
    .transform((val) => val.split(",").map((id) => id.trim()))
    .refine((val) => val.every((id) => mongoose.isValidObjectId(id)), { message: "Invalid tag ID" }),
});

const searchByCategoriesSchema = z.object({
  categoryIds: z
    .string()
    .transform((val) => val.split(",").map((id) => id.trim()))
    .refine((val) => val.every((id) => mongoose.isValidObjectId(id)), { message: "Invalid category ID" }),
});

// Create blog (Admin only)
export const createBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, excerpt, content, author, categories, tags, metadata, status, publishedAt } = blogSchema.parse(
      req.body
    );

    // Verify author matches authenticated user
    //if (author.id !== req.user!.id || author.username !== req.user!.username) {
    //  throw new CustomError("Author details must match authenticated user", { statusCode: 403 });
    //}

    // Generate slug
    const slug = slugify(title, { lower: true, strict: true });

    // Check if blog with the same slug exists
    const existingBlog = await BlogPost.findOne({ slug });
    if (existingBlog) {
      throw new CustomError("Blog with this title already exists", { statusCode: 400 });
    }

    // Verify categories exist
    if (categories && categories.length > 0) {
      const categoryCount = await Category.countDocuments({ _id: { $in: categories } });
      if (categoryCount !== categories.length) {
        throw new CustomError("One or more categories not found", { statusCode: 400 });
      }
    }

    // Verify tags exist
    if (tags && tags.length > 0) {
      const tagCount = await Tag.countDocuments({ _id: { $in: tags } });
      if (tagCount !== tags.length) {
        throw new CustomError("One or more tags not found", { statusCode: 400 });
      }
    }

    // Set author with timestamps
    const blogAuthor = {
      ...author,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const blog = await BlogPost.create({
      id: require("uuid").v4(),
      title,
      slug,
      excerpt,
      content,
      author: blogAuthor,
      categories: categories || [],
      tags: tags || [],
      metadata,
      status,
      publishedAt: status === "published" ? publishedAt || new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    logger.info(`Blog created: ${title}`);
    res.status(201).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// Update blog (Admin only)
export const updateBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, excerpt, categories, tags, metadata, status, publishedAt } = updateBlogSchema.parse(req.body);

    // Find blog
    const blog = await BlogPost.findById(id);
    if (!blog) {
      throw new CustomError("Blog not found", { statusCode: 404 });
    }

    // Update fields
    if (title) {
      blog.title = title;
      blog.slug = slugify(title, { lower: true, strict: true });
    }
    if (excerpt) blog.excerpt = excerpt;
    if (categories) {
      const categoryCount = await Category.countDocuments({ _id: { $in: categories } });
      if (categoryCount !== categories.length) {
        throw new CustomError("One or more categories not found", { statusCode: 400 });
      }
      blog.categories = categories.map((id: string) => new mongoose.Types.ObjectId(id));
    }
    if (tags) {
      const tagCount = await Tag.countDocuments({ _id: { $in: tags } });
      if (tagCount !== tags.length) {
        throw new CustomError("One or more tags not found", { statusCode: 400 });
      }
      blog.tags = tags.map((id: string) => new mongoose.Types.ObjectId(id));
    }
    if (metadata) {
      blog.metadata = {};
      if (metadata.title !== undefined) blog.metadata.title = metadata.title;
      if (metadata.description !== undefined) blog.metadata.description = metadata.description;
      if (metadata.keywords !== undefined) blog.metadata.keywords = metadata.keywords;
      if (metadata.coverImage !== undefined) blog.metadata.coverImage = metadata.coverImage;
      if (metadata.ogImage !== undefined) blog.metadata.ogImage = metadata.ogImage;
      if (metadata.canonicalUrl !== undefined) blog.metadata.canonicalUrl = metadata.canonicalUrl;
      if (metadata.readingTimeMinutes !== undefined) blog.metadata.readingTimeMinutes = metadata.readingTimeMinutes;
      if (metadata.wordCount !== undefined) blog.metadata.wordCount = metadata.wordCount;
      if (metadata.language !== undefined) blog.metadata.language = metadata.language;
    }
    if (status) {
      blog.status = status;
      if (status === "published" && !blog.publishedAt) {
        blog.publishedAt = publishedAt || new Date().toISOString();
      }
    }
    blog.updatedAt = new Date().toISOString();

    // Check for duplicate slug
    if (title) {
      const existingBlog = await BlogPost.findOne({ slug: blog.slug, _id: { $ne: id } });
      if (existingBlog) {
        throw new CustomError("Blog with this title already exists", { statusCode: 400 });
      }
    }

    await blog.save();

    logger.info(`Blog updated: ${blog.title}`);
    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// Delete blog (Admin only)
export const deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Find and delete blog
    const blog = await BlogPost.findByIdAndDelete(id);
    if (!blog) {
      throw new CustomError("Blog not found", { statusCode: 404 });
    }

    logger.info(`Blog deleted: ${blog.title}`);
    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get all blogs (Public, exclude content)
export const getAllBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogs = await BlogPost.find({ status: "published" })
      .select("-content") // Exclude content
      .populate("categories", "name slug")
      .populate("tags", "name slug")
      .sort({ publishedAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

// Get single blog by ID or slug (Public)
export const getBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idOrSlug } = req.params;
    const blog = await BlogPost.findOne({
      $or: [{ _id: mongoose.isValidObjectId(idOrSlug) ? idOrSlug : null }, { slug: idOrSlug }],
      status: "published",
    })
      .populate("categories", "name slug")
      .populate("tags", "name slug");

    if (!blog) {
      throw new CustomError("Blog not found", { statusCode: 404 });
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};


// Search blogs by query (Public, top 5, exclude content)
export const searchBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = searchSchema.parse(req.query);
    logger.info(`Searching blogs with query: ${query}`);

    // Normalize query to handle spaces and quotes
    const normalizedQuery = `"${query.replace(/\s+/g, " ").trim()}"`;

    const blogs = await BlogPost.find({
      $text: { $search: normalizedQuery, $caseSensitive: false, $diacriticSensitive: false },
      status: "published",
    })
      .select("-content") // Exclude content
      .populate("categories", "name slug")
      .populate("tags", "name slug")
      .sort({ score: { $meta: "textScore" }, publishedAt: -1 }) // Sort by relevance and date
      .limit(5); // Top 5 results

    logger.info(`Found ${blogs.length} blogs for query: ${normalizedQuery}`);
    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    logger.error(`Error searching blogs: ${error}`);
    next(error);
  }
};

// Search blogs by tags (Public, exclude content)
export const searchByTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tagIds } = searchByTagsSchema.parse(req.query);
    logger.info(`Searching blogs with tagIds: ${tagIds}`);

    // Verify tags exist
    const tagCount = await Tag.countDocuments({ _id: { $in: tagIds } });
    if (tagCount !== tagIds.length) {
      throw new CustomError("One or more tags not found", { statusCode: 400 });
    }

    const blogs = await BlogPost.find({
      tags: { $in: tagIds.map((id) => new mongoose.Types.ObjectId(id)) },
      status: "published",
    })
      .select("-content") // Exclude content
      .populate("categories", "name slug")
      .populate("tags", "name slug")
      .sort({ publishedAt: -1 }); // Sort by newest first

    logger.info(`Found ${blogs.length} blogs for tagIds: ${tagIds}`);
    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    logger.error(`Error searching blogs by tags: ${error}`);
    next(error);
  }
};

// Search blogs by categories (Public, exclude content)
export const searchByCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryIds } = searchByCategoriesSchema.parse(req.query);
    logger.info(`Searching blogs with categoryIds: ${categoryIds}`);

    // Verify categories exist
    const categoryCount = await Category.countDocuments({ _id: { $in: categoryIds } });
    if (categoryCount !== categoryIds.length) {
      throw new CustomError("One or more categories not found", { statusCode: 400 });
    }

    const blogs = await BlogPost.find({
      categories: { $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)) },
      status: "published",
    })
      .select("-content") // Exclude content
      .populate("categories", "name slug")
      .populate("tags", "name slug")
      .sort({ publishedAt: -1 }); // Sort by newest first

    logger.info(`Found ${blogs.length} blogs for categoryIds: ${categoryIds}`);
    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    logger.error(`Error searching blogs by categories: ${error}`);
    next(error);
  }
};