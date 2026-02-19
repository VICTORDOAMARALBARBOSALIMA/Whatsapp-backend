// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sendMessage, scheduleMessageLocal, initSession, clients } = require('./services/whatsappService');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------
// CORS
// ---------------------
app.use(cors({
  origin: [
    'https://formulape2.mocha.app',
    'https://app.formulape.app.br',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(bodyParser.json());

// ---------------------
// Status simples
// ---------------------
app.get('/', (req, res) => res.json({ status: 'WhatsApp backend ativo!' }));

// ---------------------
// Status de sessão
// ---------------------
app.get('/status/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;
  const client = clients[clinic_id];
  if (client && client.info && client.info.wid) return res.json({ status: 'active', message: 'Sessão já ativa!' });
  res.json({ status: 'inactive', message: 'Sessão não ativa' });
});

// ---------------------
// Gerar QR
// ---------------------
app.get('/qr/:clinic_id', async (req, res) => {
  const { clinic_id } = req.params;
  try {
    const existingClient = clients[clinic_id];
    if (existingClient && existingClient.info && existingClient.info.wid) {
      return res.json({ status: 'active', message: 'Sessão já ativa!' });
    }

    const client = await initSession(clinic_id);

    client.once('qr', qr => res.json({ status: 'qr', qr }));
    client.once('ready', () => res.json({ status: 'active', message: 'Sessão já ativa!' }));

    setTimeout(() => res.status(500).json({ status: 'error', message: 'Não foi possível gerar o QR code. Tente novamente.' }), 60000);
  } catch (err) {
    console.error('Erro ao gerar QR code:', err);
    res.status(500).json({ status: 'error', message: 'Erro ao gerar QR code' });
  }
});

// ---------------------
// Logout
// ---------------------
app.post('/logout/:clinic_id', (req, res) => {
  const { clinic_id } = req.params;
  const client = clients[clinic_id];
  if (!client) return res.status(400).json({ status: 'error', message: 'Sessão não encontrada' });

  client.destroy().then(() => {
    delete clients[clinic_id];
    res.json({ status: 'success', message: 'Sessão encerrada' });
  }).catch(err => {
    res.status(500).json({ status: 'error', message: 'Erro ao encerrar sessão' });
  });
});

// ---------------------
// Envio imediato
// ---------------------
app.post('/send', async (req, res) => {
  const { clinic_id, phone, message, appointment_id } = req.body;
  if (!clinic_id || !phone || !message) return res.status(400).json({ error: 'clinic_id, phone e message obrigatórios' });
  const result = await sendMessage(clinic_id, phone, message, appointment_id);
  res.json(result);
});

// ---------------------
// Agendar mensagem
// ---------------------
app.post('/schedule', (req, res) => {
  const { clinic_id, phone, message, send_at, appointment_id } = req.body;
  if (!clinic_id || !phone || !message || !send_at) return res.status(400).json({ error: 'clinic_id, phone, message e send_at obrigatórios' });
  scheduleMessageLocal(clinic_id, phone, message, send_at, appointment_id);
  res.json({ success: true, info: 'Mensagem agendada com sucesso!' });
});

// ---------------------
// Start
// ---------------------
app.listen(PORT, () => console.log(`Servidor WhatsApp rodando na porta ${PORT}`));
