const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { logMessage } = require('../utils/logger');

if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');

const clients = {};
const scheduledMessages = [];

async function initSession(clinic_id) {
  if (clients[clinic_id]) return clients[clinic_id];

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: clinic_id, dataPath: path.resolve('./sessions') })
  });

  client.on('ready', () => console.log(`WhatsApp pronto para ${clinic_id}`));
  client.on('auth_failure', () => console.log(`Falha de autenticação: ${clinic_id}`));
  client.on('disconnected', () => console.log(`Sessão desconectada: ${clinic_id}`));

  client.initialize();
  clients[clinic_id] = client;
  return client;
}

async function sendMessage(clinic_id, to, message, appointment_id) {
  const client = await initSession(clinic_id);
  try {
    await client.sendMessage(to, message);
    logMessage({ clinic_id, patient_phone: to, message_content: message, status: 'sent', type: 'immediate', template_name: null, appointment_id });
    return { success: true, external_message_id: `${clinic_id}-${Date.now()}` };
  } catch (err) {
    console.log(`Erro envio ${to}: ${err.message}`);
    logMessage({ clinic_id, patient_phone: to, message_content: message, status: 'error', type: 'immediate', template_name: null, appointment_id });
    return { success: false, error: err.message };
  }
}

function scheduleMessageLocal(clinic_id, to, message, send_at, appointment_id) {
  scheduledMessages.push({ clinic_id, to, message, send_at: new Date(send_at), appointment_id });
  logMessage({ clinic_id, patient_phone: to, message_content: message, status: 'pending', type: 'scheduled', template_name: null, appointment_id });
}

// Cron interno
cron.schedule('* * * * *', async () => {
  const now = new Date();
  for (let i = scheduledMessages.length - 1; i >= 0; i--) {
    const msg = scheduledMessages[i];
    if (msg.send_at <= now) {
      await sendMessage(msg.clinic_id, msg.to, msg.message, msg.appointment_id);
      scheduledMessages.splice(i, 1);
    }
  }
});

module.exports = { sendMessage, scheduleMessageLocal };
