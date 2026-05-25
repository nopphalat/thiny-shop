const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const db = require('./db');
const { initializeDatabase } = require('./init-db');

const app = express();

// Middleware — flexible CORS that accepts all known frontends
const envOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
const corsCheck = (origin, callback) => {
  // No origin (curl/server-to-server) → allow
  if (!origin) return callback(null, true);
  // Explicit allowlist from env
  if (envOrigins.includes(origin)) return callback(null, true);
  // Any GitHub Pages site
  if (origin.endsWith('.github.io')) return callback(null, true);
  // Any Render-hosted site
  if (origin.endsWith('.onrender.com')) return callback(null, true);
  // Any Cloudflare Pages site
  if (origin.endsWith('.pages.dev')) return callback(null, true);
  // Local dev
  if (origin.startsWith('http://localhost:')) return callback(null, true);
  // Otherwise — block
  callback(new Error('Not allowed by CORS: ' + origin));
};
app.use(cors({ origin: corsCheck, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const productsRouter = require('./routes/products');
const locationsRouter = require('./routes/locations');
const stockRouter = require('./routes/stock');
const ordersRouter = require('./routes/orders');
const customersRouter = require('./routes/customers');
const movementsRouter = require('./routes/movements');
const chatOrdersRouter = require('./routes/chat-orders');
const expensesRouter = require('./routes/expenses');
const notificationsRouter = require('./routes/notifications');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const auditLogRouter = require('./routes/audit-log');

app.use('/api/products', productsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/stock', stockRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/movements', movementsRouter);
app.use('/api/chat-orders', chatOrdersRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/audit-log', auditLogRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 8080;

initializeDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
