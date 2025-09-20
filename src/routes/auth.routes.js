import express from "express";
import { signin, signup } from "../controllers/auth.controller.js";



const authRouter = express.Router();



authRouter.get("/test", (req, res) => {
  res.send("Test Route");
});


authRouter.post('/signup', signup);
authRouter.post('/signin', signin);

export default authRouter;