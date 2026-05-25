const { commands } = require('./commands');
const prefix = '.';

async function handleCommand(sock, msg) {
  const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
  if (!body.startsWith(prefix)) return;

  const args = body.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const command = commands.find(c => c.name === cmd || c.alias.includes(cmd));
  if (!command) return;

  try {
    await command.execute(sock, msg, args);
  } catch (e) {
    await sock.sendMessage(msg.key.remoteJid, { text: `Error: ${e.message}` });
  }
}

module.exports = { handleCommand };
