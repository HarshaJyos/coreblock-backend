import { Router } from "express";
import { createTag, updateTag, deleteTag, getTags, getTag } from "../controllers/tagController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

// Admin-only routes (protected by authentication)
router.post("/", protect, createTag);
router.patch("/:id", protect, updateTag);
router.delete("/:id", protect, deleteTag);

// Public routes
router.get("/", getTags);
router.get("/:idOrSlug", getTag);

export default router;