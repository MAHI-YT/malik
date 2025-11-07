const { cmd } = require('../command');
const config = require("../config");

cmd({
  on: "body"
}, async (conn, m, store, {
  from,
  body,
  sender,
  isGroup,
  isAdmins,
  isBotAdmins,
  reply
}) => {
  try {
    // Only run in groups where bot is admin and sender isn't admin
    if (!isGroup || isAdmins || !isBotAdmins) return;

    // 🧠 Regex for all domain types (.com, .io, .net, etc.)
    const allLinksRegex = /\b((https?:\/\/)?(www\.)?([a-z0-9-]+\.)+[a-z]{2,})(\/\S*)?/gi;

    // 🔗 WhatsApp group & channel link regex (for kicking)
    const waDangerLinks = /(chat\.whatsapp\.com\/[A-Za-z0-9]+|whatsapp\.com\/channel\/[A-Za-z0-9]+)/gi;

    const hasAnyLink = allLinksRegex.test(body);
    const hasWaDangerLink = waDangerLinks.test(body);

    // Only continue if ANTI_LINK is enabled
    if (config.ANTI_LINK !== 'true') return;

    if (hasWaDangerLink) {
      // 🚨 WhatsApp group or channel link detected — delete + kick
      console.log(`🚫 WhatsApp link detected from ${sender}: ${body}`);

      // Try to delete message
      try {
        await conn.sendMessage(from, { delete: m.key });
        console.log(`✅ Message deleted (WhatsApp link)`);
      } catch (error) {
        console.error("❌ Failed to delete WhatsApp link message:", error);
      }

      // Notify group
      await conn.sendMessage(from, {
        text: `🚨 *FORBIDDEN LINK DETECTED!* 🚨\n@${sender.split('@')[0]} shared a *WhatsApp group/channel link!* 😡\n\nUser has been removed from this group.`,
        mentions: [sender]
      });

      // Kick user
      await conn.groupParticipantsUpdate(from, [sender], "remove");
      console.log(`👢 User removed: ${sender}`);
    }

    else if (hasAnyLink) {
      // 🌐 Other normal links (delete only)
      console.log(`🌍 Regular link detected from ${sender}: ${body}`);

      // Try to delete
      try {
        await conn.sendMessage(from, { delete: m.key });
        console.log(`✅ Message deleted (normal link)`);
      } catch (error) {
        console.error("❌ Failed to delete message:", error);
      }

      // Warn user (no kick)
      await conn.sendMessage(from, {
        text: `⚠️ @${sender.split('@')[0]}, links are *not allowed* here!\nYour message has been deleted.`,
        mentions: [sender]
      });
    }

  } catch (error) {
    console.error("Anti-link error:", error);
    reply("❌ Error while checking link message.");
  }
});
