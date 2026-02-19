// services/whatsappService.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const qrcode = require('qrcode-terminal');
const { logMessage } = require('../utils/logger');

// ---------------------
// Garantir que a pasta de sessões exista
// ---------------------
const SESSIONS_DIR = path.resolve('./sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// ---------------------
// Armazena instâncias de clientes por clinic_id
// ---------------------
const clients = {};

// ---------------------
// Armazena mensagens agendadas
// ---------------------
const scheduledMessages = [];

// ---------------------
// Espera até que o client esteja pronto
// ---------------------
function waitUntilReady(client, clinic_id) {
  if (client.info && client.info.wid) return Promise.resolve(); // já pronto
  return new Promise(resolve => {
    client.once('ready', () => {
      console.log(`Cliente ${clinic_id} pronto!`);
      resolve();
    });
  });
}

// ---------------------
// Inicializa ou retorna um client WhatsApp para uma clínica específica
// ---------------------
async function initSession(clinic_id) {
  if (clients[clinic_id]) return clients[clinic_id];

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: clinic_id,
      dataPath: SESSIONS_DIR
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--no-zygote'
      ]
    }
  });

  // ---------------------
  // Eventos do client
  // ---------------------
  client.on('qr', qr => {
    console.log(`QR Code gerado para ${clinic_id}. Escaneie no WhatsApp:`);
    qrcode.generate(qr, { small: true }); // mostra QR no terminal
  });

  client.on('ready', () => console.log(`WhatsApp pronto para ${clinic_id}`));
  client.on('auth_failure', () => console.log(`Falha de autenticação: ${clinic_id}`));
  client.on('disconnected', () => {
    console.log(`Sessão desconectada: ${clinic_id}`);
    delete clients[clinic_id]; // remove client desconectado
  });

  // Inicializa o client
  await client.initialize();
  clients[clinic_id] = client;

  return client;
}

// ---------------------
// Envia uma mensagem imediata
// ---------------------
async function sendMessage(clinic_id, to, message, appointment_id = null) {
  try {
    const client = await initSession(clinic_id);
    await waitUntilReady(client, clinic_id);

    // Força formato correto do WhatsApp
    const chatId = to.endsWith('@c.us') ? to : `${to}@c.us`;
    await client.sendMessage(chatId, message);

    logMessage({
      clinic_id,
      patient_phone: to,
      message_content: message,
      status: 'sent',
      type: 'immediate',
      template_name: null,
      appointment_id
    });

    return { success: true, external_message_id: `${clinic_id}-${Date.now()}` };
  } catch (err) {
    const errorMsg = err && err.message ? err.message : JSON.stringify(err);
    console.error(`Erro ao enviar para ${to}:`, errorMsg);

    logMessage({
      clinic_id,
      patient_phone: to,
      message_content: message,
      status: 'error',
      type: 'immediate',
      template_name: null,
      appointment_id
    });

    return { success: false, error: errorMsg };
  }
}

// ---------------------
// Agenda uma mensagem para envio futuro
// ---------------------
function scheduleMessageLocal(clinic_id, to, message, send_at, appointment_id = null) {
  scheduledMessages.push({
    clinic_id,
    to,
    message,
    send_at: new Date(send_at),
    appointment_id
  });

  logMessage({
    clinic_id,
    patient_phone: to,
    message_content: message,
    status: 'pending',
    type: 'scheduled',
    template_name: null,
    appointment_id
  });
}

// ---------------------
// Cron interno para processar mensagens agendadas a cada minuto
// ---------------------
cron.schedule('* * * * *', async () => {
  const now = new Date();
  for (let i = scheduledMessages.length - 1; i >= 0; i--) {
    const msg = scheduledMessages[i];
    if (msg.send_at <= now) {
      await sendMessage(msg.clinic_id, msg.to, msg.message, msg.appointment_id);
      scheduledMessages.splice(i, 1); // remove mensagem enviada
    }
  }
});

// ---------------------
// Exporta funções
// ---------------------
module.exports = {
  sendMessage,
  scheduleMessageLocal,
  initSession,
  clients
};
