const isProduction = import.meta.env.PROD;

export const logger = {
  log: (...args: unknown[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Errors generally should be logged even in production, or sent to a reporting service like Sentry
    console.error(...args);
  },
  info: (...args: unknown[]) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
};

export default logger;
