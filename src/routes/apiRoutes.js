import express from "express";
import authRouter from "./auth.routes.js";
import profileRouter from "./profile.routes.js";

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/profile", profileRouter);

export default apiRouter;