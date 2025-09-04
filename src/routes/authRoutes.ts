import { Router } from "express";
import { login, refresh, logout } from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

// Login route
router.post("/login", login);

// Refresh token route
router.post("/refresh", refresh);

// Logout route
router.post("/logout", logout);

export default router;