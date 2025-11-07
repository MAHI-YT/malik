const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "bard",
    desc: "Ask questions to Google Bard AI.",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                "💬 *Usage Example:*\n\n" +
                "`.bard Tell me about the history of artificial intelligence.`\n\n" +
                "Ask anything and get a Bard AI response!"
            );
        }

        const apiUrl = `https://api.mrfrankofc.gleeze.com/api/ai/bard?query=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || !data.status) {
            return reply("❌ Failed to get a response from Bard API. Please try again later.");
        }

        let result = data.response || data.data || "⚠️ No response received from Bard.";
        reply(`🤖 *Bard Says:*\n\n${result}\n\n~ DARKZONE-MD`);
    } catch (error) {
        console.error("Bard API Error:", error.message);
        reply("❌ Failed to connect to Bard API. Please try again later.");
    }
});
