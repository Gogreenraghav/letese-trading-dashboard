/**
 * User Database — JSON file based
 * Stores: username, email, balance, referral_code, created_at
 */
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../users.json');

function readDB() {
  if (!fs.existsSync(DB_FILE)) return { users: [], nextId: 1 };
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch(e) {
    return { users: [], nextId: 1 };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function generateRefCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

class UserDB {
  // Create new user
  create({ username, email, referredBy, plan = 'basic', initialBalance = 100000 }) {
    const db = readDB();
    
    // Check unique constraints
    if (db.users.find(u => u.username === username)) {
      throw new Error('Username already taken');
    }
    if (email && db.users.find(u => u.email === email)) {
      throw new Error('Email already registered');
    }
    
    const user = {
      id: db.nextId++,
      userId: `AI24X7-${String(db.nextId).padStart(5, '0')}`,
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      email: email || null,
      balance: initialBalance,
      initialBalance,
      referredBy: referredBy || null,
      referralCode: generateRefCode(),
      plan,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      totalDeposits: initialBalance,
      totalWithdrawals: 0,
      tradesCount: 0,
      status: 'active',
    };
    
    db.users.push(user);
    writeDB(db);
    return user;
  }

  // Get all users (admin)
  getAll() {
    const db = readDB();
    return db.users.map(u => ({
      ...u,
      balance: undefined, // hide actual balance from list (admin sees it)
    }));
  }

  // Get user by username
  getByUsername(username) {
    const db = readDB();
    return db.users.find(u => u.username === username.toLowerCase());
  }

  // Get user by userId
  getByUserId(userId) {
    const db = readDB();
    return db.users.find(u => u.userId === userId);
  }

  // Get user by email
  getByEmail(email) {
    const db = readDB();
    return db.users.find(u => u.email === email);
  }

  // Admin: get user with full balance
  getAdminView(username) {
    const db = readDB();
    return db.users.find(u => u.username === username.toLowerCase());
  }

  // Admin: get full user by userId
  getAdminByUserId(userId) {
    const db = readDB();
    return db.users.find(u => u.userId === userId);
  }

  // Add balance (admin or self)
  addBalance(username, amount) {
    const db = readDB();
    const user = db.users.find(u => u.username === username.toLowerCase());
    if (!user) throw new Error('User not found');
    if (amount <= 0) throw new Error('Amount must be positive');
    
    user.balance += amount;
    user.totalDeposits += amount;
    user.lastActive = new Date().toISOString();
    
    writeDB(db);
    return user;
  }

  // Deduct balance
  deductBalance(username, amount) {
    const db = readDB();
    const user = db.users.find(u => u.username === username.toLowerCase());
    if (!user) throw new Error('User not found');
    if (user.balance < amount) throw new Error('Insufficient balance');
    
    user.balance -= amount;
    user.lastActive = new Date().toISOString();
    
    writeDB(db);
    return user;
  }

  // Get referral stats
  getReferralStats(referralCode) {
    const db = readDB();
    const referrals = db.users.filter(u => u.referredBy === referralCode);
    return {
      referralCode,
      totalReferrals: referrals.length,
      referrals: referrals.map(u => ({ username: u.username, joinedAt: u.createdAt, plan: u.plan })),
    };
  }

  // Update last active
  touch(username) {
    const db = readDB();
    const user = db.users.find(u => u.username === username.toLowerCase());
    if (user) {
      user.lastActive = new Date().toISOString();
      writeDB(db);
    }
  }
}

module.exports = new UserDB();
