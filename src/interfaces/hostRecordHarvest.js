import {Utils} from '@natlibfi/melinda-commons';
import createOaiPmhClient from '@natlibfi/oai-pmh-client';
import createSruClient from '@natlibfi/sru-client';
import {MARCXML} from '@natlibfi/marc-record-serializers';
import {createValidationFactory} from '@natlibfi/melinda-record-link-migration-commons';
import {MarcRecord} from '@natlibfi/marc-record';
import fs from 'fs';
import path from 'path';
import {format} from 'util';

export default function () {
  const {createLogger, logError} = Utils;
  const logger = createLogger();

  return {fileHostRecordHarvesting, sruHostRecordHarvesting, oaiPmhHostRecordHarvesting};

  // Works
  async function fileHostRecordHarvesting({hostRecordHarvestConfig, hostRecordValidationFilters}) {
    logger.log('info', 'Harvesting host records from FILE');
    logger.log('silly', JSON.stringify(hostRecordHarvestConfig));
    logger.log('silly', JSON.stringify(hostRecordValidationFilters));
    const filepath = path.resolve(hostRecordHarvestConfig.location);
    const file = fs.readFileSync(filepath);
    const jsonFile = JSON.parse(file.toString());
    const records = jsonFile.map(record => new MarcRecord(record));
    const validate = await createValidationFactory(hostRecordValidationFilters);
    const validHostRecords = await filterValidRecords(records, validate);
    logger.log('info', `Got ${validHostRecords.length} valid host records file`);

    return {validHostRecords};
  }

  // Proto
  async function sruHostRecordHarvesting({hostRecordHarvestConfig, hostRecordValidationFilters}) {
    logger.log('info', 'Harvesting host records from SRU');
    logger.log('silly', JSON.stringify(hostRecordHarvestConfig));
    logger.log('silly', JSON.stringify(hostRecordValidationFilters));
    const {queryFormat, list, offset} = hostRecordHarvestConfig;
    const sruClient = createSruClient({
      url: hostRecordHarvestConfig.url,
      recordSchema: 'marcxml',
      maxRecordsPerRequest: 50,
      retrieveAll: false
    });

    logger.log('info', 'Generating queries');
    const querys = list.map(id => format(queryFormat, id));
    const [query] = querys;
    const {records} = await getSruRecords(sruClient, query, offset);

    return {records};
  }

  function getSruRecords(sruClient, query, offset) {
    return new Promise((resolve, reject) => {
      const records = [];
      sruClient.searchRetrieve(query, {startRecord: offset})
        .on('record', xmlString => {
          logger.log('silly', 'Got Record');
          records.push(MARCXML.from(xmlString)); // eslint-disable-line functional/immutable-data
        })
        .on('end', offset => {
          logger.log('info', 'Ending queries');
          resolve({offset, records});
        })
        .on('error', err => reject(err));
    });
  }

  // Works
  async function oaiPmhHostRecordHarvesting({hostRecordHarvestConfig, hostRecordValidationFilters}) {
    logger.log('info', 'Harvesting host records from OAI-PMH');
    logger.log('silly', JSON.stringify(hostRecordHarvestConfig));
    logger.log('silly', JSON.stringify(hostRecordValidationFilters));
    const oaiPmhClient = createOaiPmhClient({
      url: hostRecordHarvestConfig.url,
      set: hostRecordHarvestConfig.set,
      metadataPrefix: 'melinda_marc',
      metadataFormat: 'string',
      retrieveAll: false,
      filterDeleted: true
    });
    const validate = await createValidationFactory(hostRecordValidationFilters);

    // Get auth records
    const {records, resumptionToken} = await getOaiPMhRecords(hostRecordHarvestConfig.resumptionToken);
    // Validate auth records
    const validHostRecords = await filterValidRecords(records, validate);
    // Return valid auth records
    return {validHostRecords, resumptionToken};

    function getOaiPMhRecords(resumptionToken) { // eslint-disable-line no-unused-vars
      if (resumptionToken.token !== undefined) {
        logger.log('info', 'Connect to OAI-PMH and using resumptionToken');
        logger.log('silly', JSON.stringify(resumptionToken));
        return new Promise((resolve, reject) => {
          const records = [];
          const promises = [];
          oaiPmhClient.listRecords({resumptionToken})
            .on('record', record => {
              promises.push(transform(record.metadata)); // eslint-disable-line functional/immutable-data
              async function transform(xmlStringRecord) {
                const record = await MARCXML.from(xmlStringRecord);
                records.push(record); // eslint-disable-line functional/immutable-data
              }
            }) // eslint-disable-line functional/immutable-data
            .on('end', resumptionToken => endProcessing(resumptionToken))
            .on('error', err => handleError(err));

          async function endProcessing(resumptionToken) {
            logger.log('info', 'Got records from OAI-PMH');
            await Promise.all(promises);
            resolve({records, resumptionToken});
          }

          function handleError(err) {
            logError(err);
            reject(err);
          }
        });
      }

      logger.log('info', 'Connect to OAI-PMH');
      return new Promise((resolve, reject) => {
        const promises = [];
        const records = [];
        oaiPmhClient.listRecords()
          .on('record', record => {
            promises.push(transform(record.metadata)); // eslint-disable-line functional/immutable-data
            async function transform(xmlStringRecord) {
              const record = await MARCXML.from(xmlStringRecord);
              records.push(record); // eslint-disable-line functional/immutable-data
            }
          })
          .on('end', resumptionToken => endProcessing(resumptionToken))
          .on('error', err => handleError(err));

        async function endProcessing(resumptionToken) {
          logger.log('info', 'Got records from OAI-PMH');
          await Promise.all(promises);
          resolve({records, resumptionToken});
        }

        function handleError(err) {
          logError(err);
          reject(err);
        }
      });
    }
  }

  async function filterValidRecords(records, validate, validRecords = []) {
    const [record, ...rest] = records;
    if (record === undefined) {
      return validRecords;
    }
    // Filter records
    try {
      const validationResults = await validate(record, {fix: false, validateFixes: false});

      // Logger.log('silly', JSON.stringify(validationResults));
      const {valid, report} = validationResults;
      logger.log('debug', `Record validation: ${valid}`);
      // Logger.log('silly', JSON.stringify(record));
      logger.log('silly', JSON.stringify(report));
      const [f100] = record.get(/^100$/u);
      logger.log('silly', JSON.stringify(f100));

      if (valid) {
        return filterValidRecords(rest, validate, [...validRecords, record]);
      }
    } catch (error) {
      logger.log('error', JSON.stringify(record));
      logger.log('error', error);
    }

    return filterValidRecords(rest, validate, validRecords);
  }
}
