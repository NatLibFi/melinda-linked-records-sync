/* eslint-disable no-unused-vars, no-undef, no-warning-comments */
import {Utils} from '@natlibfi/melinda-commons';
import {promisify} from 'util';
// Import authChangesFactory from './interfaces/changesApiAuth';
import {testEpic} from './epicConfigs';
import {epicLoaderFactory} from './interfaces/epicLoader';

export default async function ({mongoUrl}) {
  const setTimeoutPromise = promisify(setTimeout);
  const {createLogger} = Utils;
  const logger = createLogger();
  const epicLoader = await epicLoaderFactory(mongoUrl);

  await initLoops();

  async function initLoops() {
    const {resumptionToken, jobIds} = await epicLoader.load(testEpic);
    logger.log('debug', `new jobs to epic: ${jobIds}`);
    logger.log('debug', `new harvest resumption token to epic: ${resumptionToken}`);
    // Loop here
    logger.log('info', 'Looping!');
    throw Error('shutdown');
    // Return initLoops();
  }

  // Check new one time jobs!
}


// Epic job -> Amqp jono
// Amqp jono -> Loop -> Amqp jono
// Loop:
// Tarkastukset?
// Uudelleen käynnistys?
// Status kartoitus?