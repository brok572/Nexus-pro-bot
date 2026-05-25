const axios = require('axios');

const commands = [
  {
    name: 'ping',
    alias: ['p'],
    execute: async (sock, msg) => {
      const start = Date.now();
      await sock.sendMessage(msg.key.remoteJid, { text: 'Pinging...' });
      const ms = Date.now() - start;
      await sock.sendMessage(msg.key.remoteJid, { text: `Pong! ${ms}ms` });
    }
  },
  {
    name: 'meme',
    alias: [],
    execute: async (sock, msg) => {
      const { data } = await axios.get('https://meme-api.com/gimme');
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: data.url },
        caption: data.title
      });
    }
  },
  {
    name: 'joke',
    alias: [],
    execute: async (sock, msg) => {
      const { data } = await axios.get('https://official-joke-api.appspot.com/random_joke');
      await sock.sendMessage(msg.key.remoteJid, { text: `${data.setup}\n\n${data.punchline}` });
    }
  },
  {
    name: 'fact',
    alias: [],
    execute: async (sock, msg) => {
      const { data } = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
      await sock.sendMessage(msg.key.remoteJid, { text: data.text });
    }
  },
  {
    name: 'quote',
    alias: [],
    execute: async (sock, msg) => {
      const { data } = await axios.get('https://zenquotes.io/api/random');
      await sock.sendMessage(msg.key.remoteJid, { text: `"${data[0].q}"\n- ${data[0].a}` });
    }
  },
  {
    name: 'dog',
    alias: [],
    execute: async (sock, msg) => {
      const { data } = await axios.get('https://dog.ceo/api/breeds/image/random');
      await sock.sendMessage(msg.key.remoteJid, { image: { url: data.message } });
    }
  },
  {
    name: 'cat',
    alias: [],
    execute: async (sock, msg) => {
      const { data } = await axios.get('https://api.thecatapi.com/v1/images/search');
      await sock.sendMessage(msg.key.remoteJid, { image: { url: data[0].url } });
    }
  },
  {
    name: 'weather',
    alias: [],
    execute: async (sock, msg, args) => {
      if (!args[0]) return sock.sendMessage(msg.key.remoteJid, { text: 'Tumia:.weather Dar es Salaam' });
      const city = args.join(' ');
      const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      const current = data.current_condition[0];
      const text = `🌍 ${city}\n🌡️ ${current.temp_C}°C\n☁️ ${current.weatherDesc[0].value}\n💨 Upepo: ${current.windspeedKmph} km/h`;
      await sock.sendMessage(msg.key.remoteJid, { text });
    }
  },
  {
    name: 'tr',
    alias: ['translate'],
    execute: async (sock, msg, args) => {
      if (args.length < 2) return sock.sendMessage(msg.key.remoteJid, { text: 'Tumia:.tr sw Hello' });
      const lang = args[0];
      const text = args.slice(1).join(' ');
      const { data } = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`);
      await sock.sendMessage(msg.key.remoteJid, { text: data.responseData.translatedText });
    }
  },
  {
    name: 'menu',
    alias: ['help', 'commands'],
    execute: async (sock, msg) => {
      const text = `╭─ 𝐍𝐞𝐱𝐮𝐬 𝐂𝐨𝐦𝐚𝐧𝐝𝐬 ─◆
│ ◇.ping
│ ◇.meme
│ ◇.joke
│ ◇.fact
│ ◇.quote
│ ◇.dog
│ ◇.cat
│ ◇.weather Nairobi
│ ◇.tr sw Hello
╰────────────────◆

> Developed By Nexus`;
      await sock.sendMessage(msg.key.remoteJid, { text });
    }
  }
];

module.exports = { commands };
