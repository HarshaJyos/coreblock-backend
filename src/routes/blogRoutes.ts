import { Router } from "express";
import {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getBlog,
  searchBlogs,
  searchByTags,
  searchByCategories,
} from "../controllers/blogController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

// Admin-only routes (protected by authentication)
router.post("/", protect, createBlog);
router.patch("/:id", protect, updateBlog);
router.delete("/:id", protect, deleteBlog);

// Public routes
router.get("/", getAllBlogs);
router.get("/search", searchBlogs);
router.get("/tags", searchByTags);
router.get("/categories", searchByCategories);
router.get("/:idOrSlug", getBlog);


export default router;