const fs = require('fs');
const path = require('path');

const logPath = process.env.LOG_PATH || 'logs/messages.log';
if (!fs.existsSync('logs')) fs.mkdirSync('logs');

function logMessage({ clinic_id, patient_phone, message_content, status, type, template_name, appointment_id }) {
  const log = {
    clinic_id,
    patient_phone,
    message_content,
    status,
    type,
    template_name,
    appointment_id,
    timestamp: new Date().toISOString()
  };
  fs.appendFileSync(path.resolve(logPath), JSON.stringify(log) + '\n');
  console.log('Log:', log);
}

module.exports = { logMessage };
