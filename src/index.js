import {Utils} from '@natlibfi/melinda-commons';
import * as config from './config';
import startApp from './app';

run();

async function run() {
  const {handleInterrupt, logError} = Utils;

  registerInterruptionHandlers();

  await startApp(config);

  function registerInterruptionHandlers() {
    process
      .on('SIGTERM', handleSignal)
      .on('SIGINT', handleInterrupt)
      .on('uncaughtException', ({stack}) => {
        handleTermination({code: 1, message: stack});
      })
      .on('unhandledRejection', ({stack}) => {
        handleTermination({code: 1, message: stack});
      });

    function handleTermination({code = 0, message = false}) {
      logMessage(message);
      process.exit(code); // eslint-disable-line no-process-exit
    }

    function handleSignal(signal) {
      handleTermination({code: 1, message: `Received ${signal}`});
    }

    function logMessage(message) {
      if (message) {
        return logError(message);
      }
    }
  }
}
