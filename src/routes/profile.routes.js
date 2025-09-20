import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { getProfile } from '../controllers/profile.controller.js';


const profileRouter = express.Router();

profileRouter.use(authMiddleware);

profileRouter.get("/getProfile", getProfile);

export default profileRouter;