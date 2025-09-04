import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import slugify from "slugify";
import { Category } from "../models";
import CustomError from "../utils/customError";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

// Zod schemas for validation
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  parentId: z
    .string()
    .refine((val) => !val || mongoose.isValidObjectId(val), { message: "Invalid parentId" })
    .optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").optional(),
  description: z.string().optional(),
  parentId: z
    .string()
    .refine((val) => !val || mongoose.isValidObjectId(val), { message: "Invalid parentId" })
    .optional(),
});

// Create category (Admin only)
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, parentId } = categorySchema.parse(req.body);

    // Generate slug
    const slug = slugify(name, { lower: true, strict: true });

    // Check if category with the same slug exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      throw new CustomError("Category with this name already exists", { statusCode: 400 });
    }

    // Verify parentId exists if provided
    if (parentId) {
      const parent = await Category.findById(parentId);
      if (!parent) {
        throw new CustomError("Parent category not found", { statusCode: 400 });
      }
    }

    const category = await Category.create({
      name,
      slug,
      description,
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    logger.info(`Category created: ${name}`);
    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Update category (Admin only)
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, parentId } = updateCategorySchema.parse(req.body);

    // Verify category exists
    const category = await Category.findById(id);
    if (!category) {
      throw new CustomError("Category not found", { statusCode: 404 });
    }

    // Update fields
    if (name) {
      category.name = name;
      category.slug = slugify(name, { lower: true, strict: true });
    }
    if (description !== undefined) category.description = description;
    if (parentId !== undefined) {
      if (parentId) {
        const parent = await Category.findById(parentId);
        if (!parent) {
          throw new CustomError("Parent category not found", { statusCode: 400 });
        }
      }
      category.parentId = new mongoose.Types.ObjectId(parentId);
    }
    category.updatedAt = new Date().toISOString();

    // Check for duplicate slug
    if (name) {
      const existingCategory = await Category.findOne({ slug: category.slug, _id: { $ne: id } });
      if (existingCategory) {
        throw new CustomError("Category with this name already exists", { statusCode: 400 });
      }
    }

    await category.save();

    logger.info(`Category updated: ${category.name}`);
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Delete category (Admin only)
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify category exists
    const category = await Category.findById(id);
    if (!category) {
      throw new CustomError("Category not found", { statusCode: 404 });
    }

    // Check if category is used in any blog posts
    const blogCount = await mongoose.model("BlogPost").countDocuments({ categories: id });
    if (blogCount > 0) {
      throw new CustomError("Cannot delete category used in blog posts", { statusCode: 400 });
    }

    // Check if category is a parent to other categories
    const childCount = await Category.countDocuments({ parentId: id });
    if (childCount > 0) {
      throw new CustomError("Cannot delete category with subcategories", { statusCode: 400 });
    }

    await category.deleteOne();

    logger.info(`Category deleted: ${category.name}`);
    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get all categories (Public)
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find().populate("parentId", "name slug");
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// Get single category by ID or slug (Public)
export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idOrSlug } = req.params;
    const category = await Category.findOne({
      $or: [{ _id: mongoose.isValidObjectId(idOrSlug) ? idOrSlug : null }, { slug: idOrSlug }],
    }).populate("parentId", "name slug");

    if (!category) {
      throw new CustomError("Category not found", { statusCode: 404 });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};