import express from "express";
import { firebaseLogin } from "../controllers/authController.js";

const router = express.Router();

router.post("/firebase-login", firebaseLogin);

export default router;
