const { cmd } = require('../command');
const axios = require('axios');
const qs = require('querystring');

cmd({
  pattern: "aiart",
  alias: ["magicart", "aigen"],
  desc: "Generate AI-powered artwork from text prompt.",
  category: "ai-tools",
  use: ".aiart <text prompt>",
  filename: __filename
}, async (conn, mek, m, { args, from, reply }) => {
  try {
    // Show example usage if no input given
    if (!args.length) {
      return reply(
`🎨 *Example Usage:*
.aiart portrait of a wizard with a long beard

💡 *Tip:* Describe your image clearly (e.g., "futuristic city at sunset", "anime girl with neon lights").`
      );
    }

    const prompt = args.join(" ").trim();
    await reply("✨ Generating AI art, please wait...");

    const query = qs.stringify({ prompt });
    const apiUrl = `https://api.mrfrankofc.gleeze.com/api/ai/magicstudio?${query}`;

    const res = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
      headers: { accept: '*/*' },
      timeout: 60000
    });

    const contentType = (res.headers['content-type'] || '').toLowerCase();

    if (contentType.includes('application/json')) {
      const text = Buffer.from(res.data).toString('utf8');
      let json;
      try { json = JSON.parse(text); } catch (e) { json = { error: text }; }
      const errMsg = json.error || json.message || JSON.stringify(json);
      return reply(`❌ API returned an error:\n${errMsg}`);
    }

    const imageBuffer = Buffer.from(res.data);
    await conn.sendMessage(from, {
      image: imageBuffer,
      caption: `✅ *AI Art Generated Successfully by DARKZONE-MD!*\n🖌️ Prompt: ${prompt}`
    }, { quoted: mek });

  } catch (err) {
    console.error("AI Art Generator Error:", err.message);
    if (err.code === 'ECONNABORTED') return reply("❌ Request timed out. Try again later.");
    if (err.response && err.response.status) return reply(`❌ API error: HTTP ${err.response.status}`);
    return reply("❌ Failed to generate AI art. Please try again later.");
  }
});
