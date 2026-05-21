const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const db = require('./db');
const { initializeDatabase } = require('./init-db');

const app = express();

// Middleware
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : true; // allow all in dev
app.use(cors({ origin: corsOrigins, credentials: true }));
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

const PORT = process.env.PORT || process.env.SERVER_PORT || 5000;

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Database: thiny_shop.db');
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
