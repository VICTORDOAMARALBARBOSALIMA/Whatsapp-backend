// services/whatsappService.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer'); // garante o executablePath correto
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { logMessage } = require('../utils/logger');

const SESSIONS_DIR = path.resolve('./sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

const clients = {}; // clients por clinic_id
const scheduledMessages = [];

// Inicializa o client se ainda não existir
async function initClient(clinic_id) {
    if (clients[clinic_id]) return clients[clinic_id];

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: clinic_id, dataPath: SESSIONS_DIR }),
        puppeteer: {
            headless: true,
            executablePath: puppeteer.executablePath(),
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        }
    });

    const qrcode = require('qrcode-terminal');

    client.on('qr', qr => console.log(`QR Code para ${clinic_id}:`), qrcode.generate(qr, { small: true }));
    client.on('ready', () => console.log(`WhatsApp pronto para ${clinic_id}`));
    client.on('auth_failure', () => console.log(`Falha de autenticação: ${clinic_id}`));
    client.on('disconnected', () => delete clients[clinic_id]);

    await client.initialize();
    clients[clinic_id] = client;
    return client;
}

// Espera até o client estar pronto
function waitUntilReady(client, clinic_id) {
    if (client.info && client.info.wid) return Promise.resolve();
    return new Promise(resolve => client.once('ready', () => resolve()));
}

// Envio imediato
async function sendMessage(clinic_id, to, message, appointment_id = null) {
    const client = await initClient(clinic_id);
    await waitUntilReady(client, clinic_id);

    try {
        await client.sendMessage(to, message);
        logMessage({ clinic_id, patient_phone: to, message_content: message, status: 'sent', type: 'immediate', template_name: null, appointment_id });
        return { success: true, external_message_id: `${clinic_id}-${Date.now()}` };
    } catch (err) {
        console.error(err.message);
        logMessage({ clinic_id, patient_phone: to, message_content: message, status: 'error', type: 'immediate', template_name: null, appointment_id });
        return { success: false, error: err.message };
    }
}

// Agendar mensagens
function scheduleMessageLocal(clinic_id, to, message, send_at, appointment_id = null) {
    scheduledMessages.push({ clinic_id, to, message, send_at: new Date(send_at), appointment_id });
    logMessage({ clinic_id, patient_phone: to, message_content: message, status: 'pending', type: 'scheduled', template_name: null, appointment_id });
}

// Cron para enviar mensagens agendadas
cron.schedule('* * * * *', async () => {
    const now = new Date();
    for (let i = scheduledMessages.length - 1; i >= 0; i--) {
        const msg = scheduledMessages[i];
        await sendMessage(msg.clinic_id, msg.to, msg.message, msg.appointment_id);
        scheduledMessages.splice(i, 1);
    }
});

module.exports = { sendMessage, scheduleMessageLocal };
