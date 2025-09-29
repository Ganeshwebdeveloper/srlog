import express, { type Request, Response, NextFunction } from "express";
import { registerApiRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logging for serverless environment
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Initialize API routes (serverless-compatible, no WebSocket)
(async () => {
  try {
    await registerApiRoutes(app);
    console.log("API routes registered successfully for serverless deployment");
  } catch (error) {
    console.error("Failed to register API routes:", error);
  }
})();

// Error handling middleware (must come after routes)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  console.error("API Error:", err);
  res.status(status).json({ message });
});

// For Vercel serverless deployment
export default app;