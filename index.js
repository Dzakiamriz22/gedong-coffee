const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

app.use('/api/guest', require('./routes/guest'));
app.use('/api/admin', require('./routes/admin'));

module.exports = app; // ⬅️ cukup export app
