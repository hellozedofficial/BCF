import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import { initializeDatabase } from './db/init.js';

import playersRouter from './routes/players.js';
import tournamentsRouter from './routes/tournaments.js';
import matchesRouter from './routes/matches.js';
import newsRouter from './routes/news.js';
import clubsRouter from './routes/clubs.js';
import committeeRouter from './routes/committee.js';
import registrationsRouter from './routes/registrations.js';
import statsRouter from './routes/stats.js';
import geocodeRouter from './routes/geocode.js';
import playerRegisterRouter from './routes/playerRegister.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import bannersRouter from './routes/banners.js';
import aboutRouter from './routes/about.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '50mb' }));

// Serve uploaded images statically
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/players', playersRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/news', newsRouter);
app.use('/api/clubs', clubsRouter);
app.use('/api/committee', committeeRouter);
app.use('/api/about', aboutRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/player-register', playerRegisterRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/banners', bannersRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Bangladesh Carrom Federation (BCF) API Powered by HelloZed IT',
    timestamp: new Date().toISOString()
  });
});

// Dynamic configuration endpoint (e.g. Admin Theme PRIMARY_COLOR from root .env)
app.get('/api/config', (req, res) => {
  let primaryColor = process.env.PRIMARY_COLOR || '#059669';
  try {
    const rootEnvPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(rootEnvPath)) {
      const envContent = fs.readFileSync(rootEnvPath, 'utf8');
      for (const line of envContent.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith('PRIMARY_COLOR=')) {
          let val = trimmed.slice('PRIMARY_COLOR='.length).trim();
          val = val.replace(/^['"]|['"]$/g, '');
          if (val) primaryColor = val;
          break;
        }
      }
    }
  } catch (e) {
    console.error('Error reading dynamic .env for /api/config:', e);
  }

  res.json({
    success: true,
    primaryColor,
    appName: 'Bangladesh Carrom Federation',
    timestamp: Date.now()
  });
});

// Serve static production builds if available
const possibleAdminPaths = [
  path.resolve(__dirname, '../../admin/dist'),
  path.resolve(__dirname, '../public/admin'),
  path.resolve(__dirname, './public/admin')
];
const adminDistPath = possibleAdminPaths.find((p) => fs.existsSync(p));

if (adminDistPath) {
  console.log(`[BCF API] Serving Admin Panel from: ${adminDistPath}`);
  app.use('/admin', express.static(adminDistPath));
  app.get(['/admin', '/admin/*'], (req, res) => {
    res.sendFile(path.join(adminDistPath, 'index.html'));
  });
}

const possibleClientPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, './public')
];
const clientDistPath = possibleClientPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  console.log(`[BCF API] Serving Client Portal from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
async function startServer() {
  try {
    console.log('[BCF API] Starting server...');
    // Ensure database exists and schema is populated
    await initializeDatabase();
    await testConnection();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` 🎯 Bangladesh Carrom Federation (BCF) API Server`);
      console.log(` 🚀 Running on: http://localhost:${PORT}`);
      console.log(` 📊 Database: MySQL [${process.env.DB_NAME || 'bcf'}] on ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('[BCF API] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
