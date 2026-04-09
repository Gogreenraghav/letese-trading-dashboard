/**
 * Logger Utility
 */

const fs = require('fs-extra');
const path = require('path');

class Logger {
  constructor(module = 'App') {
    this.module = module;
    this.logPath = path.join(__dirname, '../../logs');
    fs.ensureDirSync(this.logPath);
    this.logFile = path.join(this.logPath, `${new Date().toISOString().split('T')[0]}.log`);
  }

  format(level, ...args) {
    const time = new Date().toISOString();
    const prefix = `[${time}] [${level}] [${this.module}]`;
    return prefix + ' ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
  }

  info(...args) {
    console.log(this.format('INFO', ...args));
    this.write('INFO', ...args);
  }

  warn(...args) {
    console.warn(this.format('WARN', ...args));
    this.write('WARN', ...args);
  }

  error(...args) {
    console.error(this.format('ERROR', ...args));
    this.write('ERROR', ...args);
  }

  debug(...args) {
    if (process.env.DEBUG) {
      console.log(this.format('DEBUG', ...args));
    }
    this.write('DEBUG', ...args);
  }

  async write(level, ...args) {
    try {
      const line = this.format(level, ...args) + '\n';
      await fs.appendFile(this.logFile, line);
    } catch (e) {
      // ignore
    }
  }
}

module.exports = Logger;
