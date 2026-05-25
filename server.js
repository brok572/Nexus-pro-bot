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
let connected = false;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate', async (req, res) => {
  const number = req.body.number.replace(/[^0-9]/g, '');
  if (!number) return res.json({ error: 'Weka number sawa' });

  const sessionPath = `./sessions/${number}`;
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['Nexus-Bot', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr, pairingCode } = update;

    if (qr) {
      const qrImage = await qrcode.toDataURL(qr);
      return res.json({ type: 'qr', data: qrImage });
    }

    if (pairingCode) {
      return res.json({ type: 'code', data: pairingCode });
    }

    if (connection === 'open') {
      connected = true;
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

    if (connection === 'close') {
      connected = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      console.log('Disconnected, reconnecting:', shouldReconnect);
    }
  });

  try {
    await sock.requestPairingCode(number);
  } catch (e) {
    res.json({ error: e.message });
  }
});

sock?.ev.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0];
  if (!msg.message || msg.key.fromMe) return;
  await handleCommand(sock, msg);
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
