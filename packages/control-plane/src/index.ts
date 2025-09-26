import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { kubernetesService } from '@/services/kubernetes';
import { redisService } from '@/services/redis';
import { apiRoutes } from '@/routes';
import { websocketHandler } from '@/websocket';

// Load environment variables
config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Configuration
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: NODE_ENV,
  });
});

// API routes
app.use('/loopstacks/v1', apiRoutes);

// WebSocket handling
wss.on('connection', websocketHandler);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  server.close(() => {
    logger.info('HTTP server closed');

    // Close WebSocket server
    wss.close(() => {
      logger.info('WebSocket server closed');

      // Close database connections, etc.
      Promise.all([
        redisService.disconnect(),
        kubernetesService.disconnect(),
      ]).then(() => {
        logger.info('All connections closed');
        process.exit(0);
      }).catch((error) => {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      });
    });
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start server
const startServer = async () => {
  try {
    // Initialize services
    await redisService.connect();
    await kubernetesService.connect();

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`LoopStacks Control Plane started on port ${PORT}`, {
        port: PORT,
        environment: NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();