const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "gita",
  desc: "Get AI-powered spiritual and philosophical guidance from the Bhagavad Gita.",
  category: "ai",
  react: "🕉️",
  filename: __filename
},
async (conn, mek, m, { text, q, reply }) => {
  try {
    const input = q || text || (m.quoted && (m.quoted.text || (m.quoted.message && m.quoted.message.conversation)));
    if (!input) {
      return reply(
        "🕉️ *Usage Example:*\n\n" +
        ".gita What is karma?\n\n" +
        "Get AI-powered wisdom inspired by the Bhagavad Gita."
      );
    }

    await reply("🧘‍♂️ Seeking divine wisdom from GitaGPT...");

    const apiUrl = `https://api.mrfrankofc.gleeze.com/api/ai/gita?q=${encodeURIComponent(input)}`;
    const res = await axios.get(apiUrl, { timeout: 30000 });

    if (!res || !res.data) {
      return reply("❌ No response from GitaGPT API. Please try again later.");
    }

    if (res.data.status === false) {
      const err = res.data.error || res.data.message || JSON.stringify(res.data);
      return reply(`❌ API error:\n${err}`);
    }

    // Extract possible answer text from different response formats
    const data = res.data.data || res.data.response || res.data.answer || res.data;
    const extractText = (p) => {
      if (!p) return "";
      if (typeof p === "string") return p;
      if (typeof p === "object") {
        return p.answer || p.text || p.message || p.content || JSON.stringify(p, null, 2);
      }
      return String(p);
    };

    const answer = extractText(data).trim() || "⚠️ No spiritual message returned by the API.";

    const finalMsg = 
`🕉️ *GitaGPT Response* 🕉️

${answer}

~ DARKZONE-MD`;

    await conn.sendMessage(m.chat, { text: finalMsg }, { quoted: mek });

  } catch (err) {
    console.error("Gita Command Error:", err);
    if (err.code === "ECONNABORTED") return reply("❌ Request timed out. Please try again later.");
    return reply("❌ Failed to connect to GitaGPT API. Please try again later.");
  }
});
