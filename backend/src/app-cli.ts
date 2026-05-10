import Illustry from './app';
import logger from './config/logger';

let illustry: Illustry;
let shuttingDown = false;

const cleanup = async (exitCode = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  try {
    if (illustry) {
      await illustry.stop();
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'Error on cleanup');
    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
};

const restart = async (): Promise<void> => {
  await illustry.stop();
  illustry = new Illustry();
  await illustry.start();
};

const processUnhandledError = async (error: Error) => {
  logger.error(error.message);
  try {
    await restart();
  } catch (err) {
    await processUnhandledError(err as Error);
  }
};

const startIllustry = async () => {
  illustry = new Illustry();
  await illustry.start();
};

process.on('SIGINT', () => {
  void cleanup(0);
});
process.on('SIGTERM', () => {
  void cleanup(0);
});
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection, reason:${err}`);
  processUnhandledError(err as Error).catch((error) => {
    logger.error(error.message);
    process.exit(-1);
  });
});
process.on('uncaughtException', (err) => {
  logger.error(`Unhandled Exception, reason:${err}`);
  processUnhandledError(err as Error).catch((error) => {
    logger.error(error.message);
    process.exit(-1);
  });
});

startIllustry().catch((error) => {
  logger.error(error instanceof Error ? error.message : 'Unable to start Illustry service');
  process.exit(1);
});
