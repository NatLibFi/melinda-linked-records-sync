/* eslint-disable no-unused-vars */
import {promisify} from 'util';
import {v4 as uuid} from 'uuid';
import {Error as LoaderError, Utils} from '@natlibfi/melinda-commons';
import {mongoFactory, HARVESTER_JOB_STATES} from '@natlibfi/melinda-record-link-migration-commons';
import hostRecordHarvesterFactory from './hostRecordHarvest';

export async function epicLoaderFactory(mongoUrl) {
  const setTimeoutPromise = promisify(setTimeout);
  const {createLogger} = Utils;
  const logger = createLogger();
  const mongoOperator = await mongoFactory(mongoUrl);
  const hostRecordHarvester = await hostRecordHarvesterFactory();

  return {load};

  async function load({hostRecordHarvestConfig, hostRecordValidationFilters, linkDataHarvesterConfig, linkDataHarvesterApiProfileId, linkDataHarvesterValidationFilters}) {
    // Get host record
    // Const {validHostRecords, resumptionToken} = getTestRecords(); // Test
    const {validHostRecords, resumptionToken, offset} = await getHostRecords(hostRecordHarvestConfig, hostRecordValidationFilters);
    logger.log('debug', validHostRecords.length);

    if (resumptionToken) { // eslint-disable-line functional/no-conditional-statement
      logger.log('verbose', `Oai-pmh harvest resumption token: ${resumptionToken.token}`);
    }

    if (offset) { // eslint-disable-line functional/no-conditional-statement
      logger.log('verbose', `Sru harvest offset: ${offset}`);
    }

    const jobIds = await pumpJobs(validHostRecords);

    if (jobIds.length < 100) {
      return load({
        hostRecordHarvestConfig: {
          type: hostRecordHarvestConfig.type,
          location: hostRecordHarvestConfig.location,
          url: hostRecordHarvestConfig.url,
          set: hostRecordHarvestConfig.set,
          resumptionToken,
          offset
        },
        hostRecordValidationFilters,
        linkDataHarvesterConfig,
        linkDataHarvesterApiProfileId,
        linkDataHarvesterValidationFilters
      });
    }

    return {resumptionToken, offset, jobIds};

    async function pumpJobs(records, jobIds = []) {
      const [hostRecord, ...rest] = records;
      if (hostRecord === undefined) {
        logger.log('info', 'Jobs pumped!');
        return jobIds;
      }

      // Make jobs
      const jobs = linkDataHarvesterConfig.map(config => ({
        hostRecord: hostRecord.toObject(),
        linkDataHarvestSearch: config,
        linkDataHarvesterApiProfileId,
        linkDataHarvesterValidationFilters
      }));

      // Add jobs to mongo
      // More harvester config validation?
      const promicedJobIds = jobs.map(async job => {
        if (job.linkDataHarvestSearch.type === 'sru') {
          logger.log('info', 'Setting up SRU harvester job');
          const jobId = uuid();
          await mongoOperator.create({jobId, jobState: HARVESTER_JOB_STATES.PENDING_SRU_HARVESTER, jobConfig: job});
          return jobId;
        }
        if (job.linkDataHarvestSearch.type === 'oai-pmh') {
          logger.log('info', 'Setting up OAI-PMH harvester job');
          const jobId = uuid();
          await mongoOperator.create({jobId, jobState: HARVESTER_JOB_STATES.PENDING_OAI_PMH_HARVESTER, jobConfig: job});
          return jobId;
        }
        if (job.linkDataHarvestSearch.type === 'finto') {
          logger.log('info', 'Setting up FINTO harvester job');
          const jobId = uuid();
          await mongoOperator.create({jobId, jobState: HARVESTER_JOB_STATES.PENDING_FINTO_HARVESTER, jobConfig: job});
          return jobId;
        }
        throw new LoaderError(400, 'Invalid harvester settings');
      });

      const newJobIds = await Promise.all(promicedJobIds);
      logger.log('debug', `Mongo jobIds: ${newJobIds}`);

      return pumpJobs(rest, [...jobIds, ...newJobIds]);
    }
  }

  async function getHostRecords(hostRecordHarvestConfig, hostRecordValidationFilters) {
    // OAI-PMH hostRecords harvesting
    if (hostRecordHarvestConfig.type === 'oai-pmh') {
      const hostRecords = await hostRecordHarvester.oaiPmhHostRecordHarvesting({hostRecordHarvestConfig, hostRecordValidationFilters});
      return hostRecords;
    }

    // SRU hostRecords harvesting
    if (hostRecordHarvestConfig.type === 'sru') {
      const hostRecords = await hostRecordHarvester.sruHostRecordHarvesting({hostRecordHarvestConfig, hostRecordValidationFilters});
      return hostRecords;
    }

    if (hostRecordHarvestConfig.type === 'file') {
      const hostRecords = await hostRecordHarvester.fileHostRecordHarvesting({hostRecordHarvestConfig, hostRecordValidationFilters});
      return hostRecords;
    }

    throw new LoaderError(400, 'Invalid host record harvester settings');
  }
}
