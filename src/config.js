module.exports = {
  port: 3040,
  jwtSecret: process.env.JWT_SECRET || 'zummp-vorteq-secret-2026',
  jwtExpires: '7d'
};
