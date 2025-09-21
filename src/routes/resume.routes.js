import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadResumeToCloudinary } from "../controllers/resume.controller.js";
import upload from "../middlewares/upload.middleware.js";

const resumeRouter = express.Router();

resumeRouter.use(authMiddleware);
resumeRouter.use(upload.single("resume"));

resumeRouter.post("/uploadResumeToCloudinary", uploadResumeToCloudinary)


export default resumeRouter;