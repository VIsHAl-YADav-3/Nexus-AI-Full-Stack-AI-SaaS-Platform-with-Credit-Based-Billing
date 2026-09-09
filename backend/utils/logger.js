/**
 * Minimal structured logger. Swap out for winston/pino in a larger deployment.
 */
const timestamp = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`[INFO] ${timestamp()} -`, ...args),
  warn: (...args) => console.warn(`[WARN] ${timestamp()} -`, ...args),
  error: (...args) => console.error(`[ERROR] ${timestamp()} -`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${timestamp()} -`, ...args);
    }
  },
};

module.exports = logger;
