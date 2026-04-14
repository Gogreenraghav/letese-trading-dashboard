/**
 * Admin Audit Logger
 */
const db = require('../config/database');

async function logAdminAction(adminId, action, targetUserId, details, ipAddress) {
  try {
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, action, targetUserId || null, JSON.stringify(details || {}), ipAddress || null]
    );
  } catch (err) {
    console.error('Failed to log admin action:', err.message);
  }
}

module.exports = { logAdminAction };
