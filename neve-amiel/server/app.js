require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const app = express();

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : (process.env.CLIENT_URL || 'http://localhost:5173'),
}));
app.use(express.json());

app.use('/api/students',   require('./routes/students'));
app.use('/api/signatures', require('./routes/signatures'));
app.use('/api/summaries',  require('./routes/summaries'));
app.use('/api/reports',    require('./routes/reports'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'שגיאת שרת פנימית' });
});

module.exports = app;
