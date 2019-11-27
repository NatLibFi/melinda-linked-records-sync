/* eslint-disable no-unused-vars, */
import {Utils} from '@natlibfi/melinda-commons';
import createSruClient from '@natlibfi/sru-client';
import {SRU_URL, SRU_VERSION} from '../config';

// NEEDS MORE? const sruClient = createSruClient({serverUrl: sruURL, version: SRU_VERSION, maximumRecords: 1});
const client = createSruClient({serverUrl: 'https://sru.api.melinda-test.kansalliskirjasto.fi/bib', version: 2, maximumRecords: 1});
const {createLogger} = Utils;
const logger = createLogger();

export async function getLinkedInfo(marcRecord) {
	await new Promise((resolve, reject) => {
		client.searchRetrieve('rec.id=9000') // Haku titlellä client.searchRetrieve('dc.title="kivi*"')
			.on('record', xmlString => {
				logger.log(xmlString);
				// TODO processRecord(xmlString);
			})
			.on('end', () => resolve())
			.on('error', err => reject(err));
	});
	return {linkdata: 'data'};
}
