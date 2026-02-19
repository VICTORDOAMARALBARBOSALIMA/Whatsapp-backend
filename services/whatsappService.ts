import { Client, LocalAuth } from 'whatsapp-web.js';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';
import { logMessage } from '../utils/logger';

// Cria pasta de sessões se não existir
if (!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');

// Armazena clientes WhatsApp por clinic_id
const clients: Record<string, Client> = {};
// Armazena mensagens agendadas
const scheduledMessages: any[] = [];

// Inicializa sessão WhatsApp para cada clinic_id
export async function initSession(clinic_id: string) {
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

// Envio imediato de mensagem
export async function sendMessage(
  clinic_id: string,
  to: string,
  message: string,
  appointment_id?: string,
  type?: string,
  template_name?: string
) {
  const client = await initSession(clinic_id);

  try {
    await client.sendMessage(to, message);

    // Registrar log de sucesso
    logMessage({
      clinic_id,
      patient_phone: to,
      message_content: message,
      status: 'sent',
      type: type || 'immediate',
      template_name: template_name || null,
      appointment_id: appointment_id || null
    });

    const external_message_id = `${clinic_id}-${Date.now()}`;
    console.log(`Mensagem enviada para ${to} pelo ${clinic_id}`);
    return { success: true, external_message_id };
  } catch (err: any) {
    // Registrar log de erro
    logMessage({
      clinic_id,
      patient_phone: to,
      message_content: message,
      status: 'error',
      type: type || 'immediate',
      template_name: template_name || null,
      appointment_id: appointment_id || null,
      error_message: err.message
    });

    console.log(`Erro envio ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Agendamento local de mensagem
export function scheduleMessageLocal(
  clinic_id: string,
  to: string,
  message: string,
  send_at: string,
  appointment_id?: string,
  type?: string,
  template_name?: string
) {
  const date = new Date(send_at);
  scheduledMessages.push({ clinic_id, to, message, send_at: date, appointment_id, type, template_name });

  // Registrar log de mensagem pendente
  logMessage({
    clinic_id,
    patient_phone: to,
    message_content: message,
    status: 'pending',
    type: type || 'scheduled',
    template_name: template_name || null,
    appointment_id: appointment_id || null
  });

  console.log(`Mensagem agendada para ${to} às ${date.toISOString()} pelo ${clinic_id}`);
}

// Cron interno para disparo de mensagens agendadas a cada minuto
cron.schedule('* * * * *', async () => {
  const now = new Date();
  for (let i = scheduledMessages.length - 1; i >= 0; i--) {
    const msg = scheduledMessages[i];
    if (msg.send_at <= now) {
      await sendMessage(
        msg.clinic_id,
        msg.to,
        msg.message,
        msg.appointment_id,
        msg.type,
        msg.template_name
      );
      scheduledMessages.splice(i, 1);
    }
  }
});
