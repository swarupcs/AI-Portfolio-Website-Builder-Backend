import express from "express";
import authRouter from "./auth.routes.js";
import profileRouter from "./profile.routes.js";
import resumeRouter from "./resume.routes.js";
import portfolioRouter from "./portfolio.routes.js";

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/resume", resumeRouter);
apiRouter.use("/portfolio", portfolioRouter);

export default apiRouter;