require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sendMessageRoute = require('./routes/sendMessage');
const scheduleMessageRoute = require('./routes/scheduleMessage');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/send-message', sendMessageRoute);
app.use('/schedule-message', scheduleMessageRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend WhatsApp rodando na porta ${PORT}`));
