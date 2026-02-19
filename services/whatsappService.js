const cron = require('node-cron');
const { logMessage } = require('../utils/logger');

// Mensagens agendadas
const scheduledMessages = [];

// Espera até o client estar pronto
function waitUntilReady(client, clinic_id) {
    if (client.info && client.info.wid) return Promise.resolve();
    return new Promise(resolve => {
        client.once('ready', () => {
            console.log(`Cliente ${clinic_id} pronto!`);
            resolve();
        });
    });
}

// Envio imediato
async function sendMessage(client, clinic_id, to, message, appointment_id = null) {
    await waitUntilReady(client, clinic_id);

    try {
        await client.sendMessage(to, message);
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
        console.error(`Erro ao enviar para ${to}:`, err.message);
        logMessage({
            clinic_id,
            patient_phone: to,
            message_content: message,
            status: 'error',
            type: 'immediate',
            template_name: null,
            appointment_id
        });
        return { success: false, error: err.message };
    }
}

// Agendar mensagens
function scheduleMessageLocal(client, clinic_id, to, message, send_at, appointment_id = null) {
    scheduledMessages.push({ client, clinic_id, to, message, send_at: new Date(send_at), appointment_id });
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

// Cron para processar mensagens agendadas
cron.schedule('* * * * *', async () => {
    const now = new Date();
    for (let i = scheduledMessages.length - 1; i >= 0; i--) {
        const msg = scheduledMessages[i];
        if (msg.send_at <= now) {
            await sendMessage(msg.client, msg.clinic_id, msg.to, msg.message, msg.appointment_id);
            scheduledMessages.splice(i, 1);
        }
    }
});

module.exports = { sendMessage, scheduleMessageLocal };
