require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const personaRoutes = require('./routes/personaRoutes');
const templateRoutes = require('./routes/templateRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

// --- Database ---
connectDB();

// --- Core middleware ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://nexus-ai-full-stack-ai-saas-platfo.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      console.log('Request Origin:', origin);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('Blocked Origin:', origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Security headers. contentSecurityPolicy and crossOriginEmbedderPolicy are
// disabled because this server only ever returns JSON/SSE (never HTML), and
// a default CSP/COEP has no benefit here while risking friction for the
// separately-hosted Vite frontend, EventSource/fetch streaming, and the
// Razorpay checkout popup loaded on the frontend origin.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// --- Razorpay webhook: MUST be mounted before express.json() and receive
// the raw request body, since the webhook signature is computed over the
// exact raw bytes Razorpay sent. All other routes keep using express.json().
app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));
app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'AI SaaS API is running', timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/conversations', conversationRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
