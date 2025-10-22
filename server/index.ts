import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const server = createServer(app);

// CRITICAL: Ultra-simple health checks - ZERO logic, instant response
// Must be FIRST before any middleware to ensure fastest possible response

// Primary health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// Kubernetes-style health check
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// Root endpoint - handles BOTH health checks AND frontend serving
// Health checks (no User-Agent) get instant OK response
// Browsers (with User-Agent) get passed to static middleware
app.get('/', (req, res, next) => {
  // Simple, fast check: Health checks typically have no User-Agent
  const userAgent = req.get('User-Agent');
  
  if (!userAgent) {
    // No User-Agent = health check tool
    return res.status(200).send('OK');
  }
  
  // Has User-Agent = browser, continue to static middleware
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Only log response body in development to avoid security risks
      if (capturedJsonResponse && app.get("env") === "development") {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// ALWAYS serve the app on the port specified in the environment variable PORT
// Other ports are firewalled. Default to 5000 if not specified.
const port = parseInt(process.env.PORT || '5000', 10);

// Initialize routes, DB, and sessions BEFORE server starts listening
// This ensures all routes are ready when health checks arrive
(async () => {
  try {
    log('Initializing routes and database...');
    await registerRoutes(app, server);
    log('Routes and database initialized successfully');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      
      // Log the error but don't crash the process
      log(`Error: ${message} (${status})`, "error");
      if (app.get("env") === "development") {
        console.error(err.stack);
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log('Vite dev server ready');
    } else {
      serveStatic(app);
      log('Static files ready');
    }

    log('Application fully initialized and ready');

    // NOW start listening - all routes are ready for health checks
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server listening on port ${port} - ready for requests`);
    });

  } catch (error) {
    log(`Failed to initialize application: ${error}`, "error");
    process.exit(1); // Exit on initialization failure
  }
})();
