const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // <-- fixed path

dotenv.config();

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});