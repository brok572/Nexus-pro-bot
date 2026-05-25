const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { handleCommand } = require('./handler');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
let sock;

// Hakikisha folder ya sessions ipo
const SESSION_DIR = '/sessions';
fs.mkdirSync(SESSION_DIR, { recursive: true });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate', async (req, res) => {
  const number = req.body.number.replace(/[^0-9]/g, '');
  if (!number) return res.json({ error: 'Weka number sawa' });

  const sessionPath = `${SESSION_DIR}/${number}`;
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['Nexus-Bot', 'Chrome', '1.0.0'],
    generateHighQualityLinkPreview: true
  });

  let sent = false;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr, pairingCode } = update;

    if (qr && !sent) {
      sent = true;
      const qrImage = await qrcode.toDataURL(qr);
      return res.json({ type: 'qr', data: qrImage });
    }

    if (pairingCode && !sent) {
      sent = true;
      const formattedCode = pairingCode.match(/.{1,4}/g).join('-');
      return res.json({ type: 'code', data: formattedCode });
    }

    if (connection === 'open') {
      await sock.sendMessage(sock.user.id, {
        image: { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThRzog1q5GKsoEeA_yy2lwJEEnIappP2JrOzlPF25LoA&s=10' },
        caption: `╭◆ 𝐍𝐞𝐱𝐮𝐬 𝐌𝐢𝐧-𝐁𝐨𝐭
│ ✧ 𝐏𝐫𝐞𝐟𝐢𝐱: [. ]
│ ✧ 𝐔𝐬𝐞𝐫: ${sock.user.name}
│ ✧ 𝐌𝐨𝐝𝐞: Public
│ ✧ 𝐕𝐞𝐫𝐬𝐢𝐨𝐧: 1.0.0
╰◆

> Developed By Nexus`
      });
    }
  });

  setTimeout(async () => {
    try {
      if (!sock.authState.creds.registered) {
        await sock.requestPairingCode(number);
      }
    } catch (e) {
      if (!sent) res.json({ error: e.message });
    }
  }, 2000);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    await handleCommand(sock, msg);
  });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
