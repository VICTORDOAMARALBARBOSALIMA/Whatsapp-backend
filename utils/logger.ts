import fs from 'fs';
import path from 'path';

// Criar pasta logs se não existir
const logsDir = path.resolve('./logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

// Função para gerar timestamp
function timestamp() {
  return new Date().toISOString();
}

// Logger principal
export function logMessage({
  clinic_id,
  patient_phone,
  message_content,
  status,
  type,
  template_name,
  appointment_id,
  error_message
}: {
  clinic_id: string;
  patient_phone: string;
  message_content: string;
  status: 'sent' | 'pending' | 'error';
  type?: string | null;
  template_name?: string | null;
  appointment_id?: string | null;
  error_message?: string | null;
}) {
  const logEntry = {
    timestamp: timestamp(),
    clinic_id,
    patient_phone,
    message_content,
    status,
    type: type || null,
    template_name: template_name || null,
    appointment_id: appointment_id || null,
    error_message: error_message || null
  };

  // Escreve no console
  console.log(logEntry);

  // Salva em arquivo logs/messages.log
  const logFile = path.join(logsDir, 'messages.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}
