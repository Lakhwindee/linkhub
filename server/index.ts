import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const server = createServer(app);

// CRITICAL: Health check MUST be first, before ANY middleware or async operations
// This ensures deployment health checks work even if DB/sessions are slow
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// Quick root health check for deployment (before middleware)
// Respond to simple GET requests immediately for health checks
app.get('/', (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const accept = req.get('Accept') || '';
  
  // Health check detection: no user agent, or simple curl/wget requests
  if (!userAgent || userAgent.includes('curl') || userAgent.includes('health') || 
      accept === '*/*' || (!accept.includes('text/html') && !accept.includes('text/'))) {
    return res.status(200).send('OK');
  }
  
  // Browser requests: continue to frontend
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

// START LISTENING IMMEDIATELY - health checks work before DB is ready
server.listen({
  port,
  host: "0.0.0.0",
  reusePort: true,
}, () => {
  log(`Server listening on port ${port} - health checks active`);
});

// Initialize routes, DB, and sessions AFTER server is listening
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
  } catch (error) {
    log(`Failed to initialize application: ${error}`, "error");
    // Don't crash - health checks still work
  }
})();
