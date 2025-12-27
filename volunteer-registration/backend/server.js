require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // <-- fixed path

const app = express();
app.use(cors());
app.use(express.json());

// Connect to DB
connectDB();

// Routes
app.use('/auth', require('./routes/auth')); // <-- fixed path
app.use('/volunteers', require('./routes/volunteers')); // <-- fixed path
app.use('/events', require('./routes/events')); // <-- fixed path
app.use('/registrations', require('./routes/registrations')); // <-- fixed path

// Error handling middleware
app.use((err, req, res, next) => {
  // Handle JSON parse errors and other bad requests
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON:', err.message);
    return res.status(400).json({ message: 'Invalid JSON request body format.' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});