import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sendMessageRoute from './routes/sendMessage';
import scheduleMessageRoute from './routes/scheduleMessage';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rotas
app.use('/send-message', sendMessageRoute);
app.use('/schedule-message', scheduleMessageRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor WhatsApp rodando na porta ${PORT}`));
