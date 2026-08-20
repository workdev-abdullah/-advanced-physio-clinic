import express from "express";
import {
  getAvailableSlots,
  lockSlot,
} from "../controllers/slotController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

// Fetch available slots
router.get("/", getAvailableSlots);

// Lock a slot (movie-ticket logic)
router.post("/:slotId/lock", authMiddleware, lockSlot);

export default router;

