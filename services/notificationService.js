// Section 24-25: central dispatch. Real channel adapters (email/push) plug
// in here later; today only 'in_app' is persisted and read back.
const notificationModel = require('../models/notificationModel');

async function notify(userId, title, body, channel = 'in_app') {
  return notificationModel.create(userId, { title, body, channel });
}

async function listForUser(userId) {
  const [items, unread] = await Promise.all([
    notificationModel.listForUser(userId),
    notificationModel.unreadCount(userId),
  ]);
  return { items, unread };
}

async function markRead(userId, id) {
  return notificationModel.markRead(userId, id);
}

module.exports = { notify, listForUser, markRead };

