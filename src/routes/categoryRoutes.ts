import { Router } from "express";
import { createCategory, updateCategory, deleteCategory, getCategories, getCategory } from "../controllers/categoryController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

// Admin-only routes (protected by authentication)
router.post("/", protect, createCategory);
router.patch("/:id", protect, updateCategory);
router.delete("/:id", protect, deleteCategory);

// Public routes
router.get("/", getCategories);
router.get("/:idOrSlug", getCategory);

export default router;