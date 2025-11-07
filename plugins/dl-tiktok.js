const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl"],
    desc: "Download TikTok video using JawadTech API",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎯 Please provide a valid TikTok link!\n\nExample:\n.tt url");

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Fetch TikTok data
        const api = `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(q)}`;
        const res = await axios.get(api);
        const json = res.data;

        if (!json?.status || !json?.result)
            return await reply("❌ Download failed! Try again later.");

        const meta = json.metadata;

        // 🎥 Send TikTok video with info in caption
        await conn.sendMessage(from, {
            video: { url: json.result },
            mimetype: 'video/mp4',
            caption: `🎵 *${meta.title}*\n👤 *Author:* ${meta.author}\n📱 *Username:* @${meta.username}\n🌍 *Region:* ${meta.region}\n\n> ✨ *DARKZONE-MD*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in .tiktok2:", e);
        await reply("❌ Error occurred while downloading TikTok video!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
