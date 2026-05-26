require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : (process.env.CLIENT_URL || 'http://localhost:5173'),
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/students',   require('./routes/students'));
app.use('/api/signatures', require('./routes/signatures'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/users',      require('./routes/users'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'שגיאת שרת פנימית' });
});

module.exports = app;
