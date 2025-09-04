import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import slugify from "slugify";
import { Tag } from "../models";
import CustomError from "../utils/customError";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

// Zod schema for validation
const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
});

const updateTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").optional(),
});

// Create tag (Admin only)
export const createTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = tagSchema.parse(req.body);

    // Generate slug
    const slug = slugify(name, { lower: true, strict: true });

    // Check if tag with the same slug exists
    const existingTag = await Tag.findOne({ slug });
    if (existingTag) {
      throw new CustomError("Tag with this name already exists", { statusCode: 400 });
    }

    const tag = await Tag.create({
      name,
      slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    logger.info(`Tag created: ${name}`);
    res.status(201).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

// Update tag (Admin only)
export const updateTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name } = updateTagSchema.parse(req.body);

    // Verify tag exists
    const tag = await Tag.findById(id);
    if (!tag) {
      throw new CustomError("Tag not found", { statusCode: 404 });
    }

    // Update fields
    if (name) {
      tag.name = name;
      tag.slug = slugify(name, { lower: true, strict: true });
    }
    tag.updatedAt = new Date().toISOString();

    // Check for duplicate slug
    if (name) {
      const existingTag = await Tag.findOne({ slug: tag.slug, _id: { $ne: id } });
      if (existingTag) {
        throw new CustomError("Tag with this name already exists", { statusCode: 400 });
      }
    }

    await tag.save();

    logger.info(`Tag updated: ${tag.name}`);
    res.status(200).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

// Delete tag (Admin only)
export const deleteTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify tag exists
    const tag = await Tag.findById(id);
    if (!tag) {
      throw new CustomError("Tag not found", { statusCode: 404 });
    }

    // Check if tag is used in any blog posts
    const blogCount = await mongoose.model("BlogPost").countDocuments({ tags: id });
    if (blogCount > 0) {
      throw new CustomError("Cannot delete tag used in blog posts", { statusCode: 400 });
    }

    await tag.deleteOne();

    logger.info(`Tag deleted: ${tag.name}`);
    res.status(200).json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get all tags (Public)
export const getTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await Tag.find();
    res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
};

// Get single tag by ID or slug (Public)
export const getTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idOrSlug } = req.params;
    const tag = await Tag.findOne({
      $or: [{ _id: mongoose.isValidObjectId(idOrSlug) ? idOrSlug : null }, { slug: idOrSlug }],
    });

    if (!tag) {
      throw new CustomError("Tag not found", { statusCode: 404 });
    }

    res.status(200).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};