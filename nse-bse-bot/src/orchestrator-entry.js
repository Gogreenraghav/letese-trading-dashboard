/**
 * Multi-User Trading Orchestrator Entry Point
 * Run with: node src/orchestrator-entry.js
 * 
 * This replaces the single-user index.js as the main entry point.
 * Each active user gets their own trading engine instance.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs-extra');
const { TradingOrchestrator } = require('./orchestrator');

async function main() {
  const logger = {
    info: (...a) => console.log(`[${new Date().toISOString()}] [Launcher] INFO:`, ...a),
    error: (...a) => console.error(`[${new Date().toISOString()}] [Launcher] ERROR:`, ...a),
  };

  const logDir = path.join(__dirname, '../logs');
  fs.ensureDirSync(logDir);
  const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);

  // File logging
  const origInfo = logger.info.bind(logger);
  logger.info = (...a) => {
    origInfo(...a);
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] [Launcher] INFO: ${a.join(' ')}\n`);
  };

  logger.info('🚀 Starting Multi-User Trading Orchestrator...');

  const orchestrator = new TradingOrchestrator();

  // Handle shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down...');
    await orchestrator.stopAll();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down...');
    await orchestrator.stopAll();
    process.exit(0);
  });

  try {
    await orchestrator.initialize();
    await orchestrator.startAll();
    logger.info('✅ Orchestrator fully running!');
  } catch (err) {
    logger.error('Fatal error:', String(err));
    process.exit(1);
  }
}

main();
