const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "snapchat",
  alias: ["snap", "snapdl"],
  desc: "Download videos from Snapchat",
  react: "📸",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q) return reply("> *😈 Please provide a valid Snapchat video URL.*");

    // show "working" reaction
    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    // call your working API
    const apiURL = `https://universe-api-mocha.vercel.app/api/snapchat/download?url=${encodeURIComponent(q)}`;

    // get API JSON (timeout & reasonable redirects)
    const apiResp = await axios.get(apiURL, { timeout: 20000, maxRedirects: 5 });
    const data = apiResp.data;

    // Debug log: dump response so you can inspect it in console
    console.log("Snap API response:", JSON.stringify(data, null, 2));

    // Helper - try several likely fields for the actual downloadable video URL
    const getVideoUrlFrom = (obj) => {
      if (!obj) return null;
      const candidates = [
        "video", "video_url", "download", "dl_link", "link", "url",
        "media", "mediaUrl", "media_url", "result", "sd", "hd"
      ];
      // If obj has nested result, check there first
      if (obj.result && typeof obj.result === "object") {
        const nested = getVideoUrlFrom(obj.result);
        if (nested) return nested;
      }
      // check top-level keys
      for (const k of Object.keys(obj)) {
        if (typeof obj[k] === "string" && (k.toLowerCase().includes("video") || k.toLowerCase().includes("url") || k.toLowerCase().includes("link") || k.toLowerCase().includes("download") || k.toLowerCase().includes("media"))) {
          if (obj[k].startsWith("http")) return obj[k];
        }
        // if value is object, look inside
        if (typeof obj[k] === "object") {
          const found = getVideoUrlFrom(obj[k]);
          if (found) return found;
        }
      }
      // fallback: try common candidate keys
      for (const cand of candidates) {
        if (obj[cand] && typeof obj[cand] === "string" && obj[cand].startsWith("http")) return obj[cand];
      }
      return null;
    };

    const videoUrl = getVideoUrlFrom(data);
    const title = (data && data.result && (data.result.title || data.result.fileName)) || data.title || "snapchat_video";

    if (!videoUrl) {
      // very explicit error + console dump hint
      console.error("No video URL found in API response. Full response logged above.");
      return reply("⚠️ Could not find a downloadable video URL in the API response. Check console logs for the API response structure.");
    }

    // update reaction
    await conn.sendMessage(from, { react: { text: "⬆️", key: m.key } });

    // Try to download the video bytes (safer for WhatsApp upload)
    let videoBuffer = null;
    try {
      const getResp = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        maxRedirects: 5,
        headers: {
          // some servers block non-browser agents; providing common UA helps
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
        }
      });

      // convert to buffer
      videoBuffer = Buffer.from(getResp.data, "binary");

      // optional size check
      const sizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(2);
      console.log(`Downloaded video buffer: ${sizeMB} MB`);
    } catch (downloadErr) {
      console.warn("Failed to download video as buffer:", downloadErr.message || downloadErr);
      // we'll fallback to sending the remote URL below
      videoBuffer = null;
    }

    const caption = `╭━━━〔 *SNAPCHAT DOWNLOADER* 〕━━━⊷\n` +
      `┃▸ *Title:* ${title}\n` +
      `╰━━━⪼\n\n` +
      `> 📥 *DARKZONE-MD*`;

    // Primary: send buffer (reliable). If too large or buffer missing, fall back to sending remote URL as video/document.
    if (videoBuffer && videoBuffer.length > 0) {
      try {
        // Many WhatsApp libs accept { video: buffer } with mimetype; if yours expects 'document', change accordingly.
        await conn.sendMessage(from, {
          video: videoBuffer,
          mimetype: "video/mp4",
          fileName: `${title}.mp4`,
          caption
        }, { quoted: m });

        return;
      } catch (sendBufferErr) {
        console.warn("Sending buffer failed, will try sending as document or URL. Error:", sendBufferErr);
        // continue to fallback steps
      }
    }

    // Fallback 1: try to send as document using direct URL (if your library supports remote URL streaming)
    try {
      await conn.sendMessage(from, {
        document: { url: videoUrl },
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption
      }, { quoted: m });

      return;
    } catch (sendUrlDocErr) {
      console.warn("Sending remote URL as document failed:", sendUrlDocErr);
      // continue to fallback 2
    }

    // Final fallback: send a simple message with the direct link so user can download manually
    await reply(`❌ I couldn't upload the video directly to WhatsApp. Here is the direct link to the video:\n\n${videoUrl}\n\n(If the link requires special headers or blocks bots, the bot cannot fetch it — try a different Snapchat link or check the API output.)`);

  } catch (error) {
    console.error("Snapchat Downloader Error:", error && error.stack ? error.stack : error);
    reply("❌ Error processing the Snapchat URL. Check the bot console for detailed API response logs.");
  }
});
