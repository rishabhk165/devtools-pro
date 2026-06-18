/**
 * Google Meet Link Service
 * Manages a pool of pre-created Meet links and assigns them to new submissions.
 * 
 * How it works:
 * 1. You pre-create Google Meet links and add them to .env
 * 2. When a user submits, the system picks the next available link
 * 3. The link is included in the WhatsApp auto-reply message
 * 4. A note about "team joining in 5 minutes" is automatically added
 */

// Pool of pre-created Google Meet links (loaded from env)
function getMeetLinks() {
  const links = [];
  let i = 1;
  while (process.env[`MEET_LINK_${i}`]) {
    links.push(process.env[`MEET_LINK_${i}`]);
    i++;
  }
  // Fallback if no links configured
  if (links.length === 0) {
    links.push('https://meet.google.com/landing');
  }
  return links;
}

// Track which link to assign next (round-robin)
let currentLinkIndex = 0;

/**
 * Get the next available Google Meet link
 * Uses round-robin to distribute across available links
 */
function getNextMeetLink() {
  const links = getMeetLinks();
  const link = links[currentLinkIndex % links.length];
  currentLinkIndex++;
  return link;
}

/**
 * Generate the complete setup message with Meet link and team note
 * This message is sent automatically when a user submits their details
 */
function generateSetupMessage(userData) {
  const meetLink = getNextMeetLink();
  const planName = userData.selectedPlan.split(' —')[0].trim();

  const message = {
    meetLink,
    whatsappMessage: buildWhatsAppMessage(userData, meetLink, planName),
    autoReplyNote: `Our team will join the Google Meet within 5 minutes for setup. Please keep the link open.`,
    planName
  };

  return message;
}

/**
 * Build the WhatsApp message that gets sent automatically
 * Includes: user details, Meet link, and setup instructions
 */
function buildWhatsAppMessage(userData, meetLink, planName) {
  return [
    `✅ *Payment Received — Setup Scheduled!*`,
    ``,
    `Hi ${userData.firstName}! Thanks for choosing DevTools Pro.`,
    ``,
    `📋 *Your Details:*`,
    `• Name: ${userData.firstName} ${userData.lastName}`,
    `• Email: ${userData.email}`,
    `• Plan: ${planName}`,
    `• UTR: ${userData.utrId}`,
    ``,
    `🎥 *Google Meet Setup Link:*`,
    `${meetLink}`,
    ``,
    `⏰ *Note:* Our team will be joining the Meet within *5 minutes* to help you set up everything. Please:`,
    `1. Click the Meet link above`,
    `2. Keep your screen ready for sharing`,
    `3. We'll walk you through the complete installation`,
    ``,
    `If you need to reschedule, just reply here.`,
    ``,
    `— DevTools Pro Team 🚀`
  ].join('\n');
}

/**
 * Generate a shorter confirmation message for immediate auto-reply
 */
function generateQuickReply(userData, meetLink) {
  const planName = userData.selectedPlan.split(' —')[0].trim();
  return [
    `Hey ${userData.firstName}! 👋`,
    ``,
    `Payment confirmed for *${planName}* plan.`,
    ``,
    `🔗 Your setup Meet link: ${meetLink}`,
    `⏰ Team joins in ~5 minutes.`,
    ``,
    `Keep the link open — we'll screen share and get you set up! 🎯`
  ].join('\n');
}

module.exports = {
  getNextMeetLink,
  generateSetupMessage,
  generateQuickReply,
  getMeetLinks
};
