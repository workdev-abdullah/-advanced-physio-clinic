import express from "express";
import ClinicConfig from "../models/ClinicConfig.js";

const router = express.Router();

router.get("/clinic-config", async (req, res) => {
  const config = await ClinicConfig.findOne();
  res.json(config);
});

export default router;
