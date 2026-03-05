type LoggerMethod = (...args: unknown[]) => void;

const formatPrefix = (level: string) => `[${new Date().toISOString()}] [Illustry] [${level}]`;

const createMethod = (level: string, output: (...args: unknown[]) => void): LoggerMethod => (
  ...args: unknown[]
) => {
  output(formatPrefix(level), ...args);
};

const logger = {
  info: createMethod('INFO', console.log),
  warn: createMethod('WARN', console.warn),
  error: createMethod('ERROR', console.error),
  debug: createMethod('DEBUG', console.debug)
};

export default logger;
