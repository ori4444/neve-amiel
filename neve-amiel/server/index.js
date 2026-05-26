const app = require('./app');
const { initializeDatabase } = require('./db');

const PORT = process.env.PORT || 3001;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log('  Default admin: username=admin  password=admin123');
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
