/* eslint-disable no-unused-vars, dot-notation */

import {Utils} from '@natlibfi/melinda-commons';
import {Parser, Builder} from 'xml2js';
import {MARCXML} from '@natlibfi/marc-record-serializers';

const {createLogger} = Utils;
const logger = createLogger();

export async function readXMLResponseToMarcRecords({amqpOperator, jobId, links, response}) {
	const obj = await parse();
	let resumptionToken = '';
	const promises = [];
	// CHECK response as js object: console.log(JSON.stringify(obj));
	try {
		if (obj['OAI-PMH'].ListRecords) {
			resumptionToken = JSON.stringify(obj['OAI-PMH'].ListRecords[0].resumptionToken[0]);
			logger.log('info', resumptionToken);
			await obj['OAI-PMH'].ListRecords[0].record.forEach(async record => {
				if (!record.header[0].$) { // If record is deleted it has no metadata
					const marcRecord = await MARCXML.from(
						await build(record.metadata[0].record[0])
					);

					await amqpOperator.sendToQueue({queue: jobId, correlationId: jobId, headers: {links}, data: marcRecord.toObject()});
				}
			});

			await Promise.all(promises);
			return resumptionToken;
		}

		if (obj['OAI-PMH'].GetRecord) {
			if (!obj['OAI-PMH'].GetRecord[0].record[0].header[0].$) { // If record is deleted it has no metadata
				const ctx = obj['OAI-PMH'].GetRecord[0].record[0].metadata[0].record[0];
				return MARCXML.from(await build(ctx));
			}

			return false;
		}
	} catch (error) {
		process.exit(1);
	}

	async function parse() {
		return new Promise((resolve, reject) => {
			new Parser().parseString(response.data, (err, obj) => {
				if (err) {
					reject(err);
				} else {
					resolve(obj);
				}
			});
		});
	}

	async function build(record) {
		return new Builder({
			rootName: 'record',
			xmldec: {
				version: '1.0',
				encoding: 'UTF-8',
				standalone: false
			},
			renderOpts: {
				pretty: false
			}

		}).buildObject(record);
	}
}
