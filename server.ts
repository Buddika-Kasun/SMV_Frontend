import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { initDatabase, db } from './server/db';
import authRoutes from './server/routes/authRoutes';
import userRoutes from './server/routes/userRoutes';
import loanRoutes from './server/routes/loanRoutes';
import reportRoutes from './server/routes/reportRoutes';
import smsRoutes from './server/routes/smsRoutes';

dotenv.config();

const app = express();
const PORT = 3000;

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SMV Holdings Microfinance Backend',
    database: db.isUsingPostgres() ? 'PostgreSQL (Railway / Cloud)' : 'Memory Store (Embedded)',
    version: '2.0.0',
  });
});

// REST API Routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sms', smsRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Uncaught Error]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

/**
 * Start Server with Vite Middleware for dev & static serving for production
 */
async function startServer() {
  // Initialize Database Schema and migrations
  try {
    await initDatabase();
  } catch (dbErr) {
    console.error('[Database Init Error]:', dbErr);
  }

  // Vite Middleware (Development) vs Static Dist (Production)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(` SMV Holdings Production Server running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Mode: ${db.isUsingPostgres() ? 'PostgreSQL Connected' : 'In-Memory State'}`);
    console.log(`====================================================`);
  });
}

startServer();
