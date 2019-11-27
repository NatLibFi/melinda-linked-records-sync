/* eslint-disable no-unused-vars, dot-notation */

import {Utils} from '@natlibfi/melinda-commons';
import {Parser, Builder} from 'xml2js';
import {MARCXML} from '@natlibfi/marc-record-serializers';

const {createLogger} = Utils;
const logger = createLogger();

export async function readXMLResponseToMarcRecords(response) {
	const obj = await parse();
	const records = [];

	// CHECK response as js object: console.log(JSON.stringify(obj));

	if (obj['OAI-PMH'].ListRecords) {
		logger.log('info', JSON.stringify(obj['OAI-PMH'].ListRecords[0].resumptionToken));
		obj['OAI-PMH'].ListRecords[0].record.forEach(async record => {
			if (!record.header[0].$) { // If record is deleted it has no metadata
				records.push(
					await MARCXML.from(
						await build(record.metadata[0].record[0])
					)
				);
			}
		});
	}

	if (obj['OAI-PMH'].GetRecord) {
		if (!obj['OAI-PMH'].GetRecord[0].record[0].header[0].$) { // If record is deleted it has no metadata
			const ctx = obj['OAI-PMH'].GetRecord[0].record[0].metadata[0].record[0];
			return MARCXML.from(await build(ctx));
		}
	}

	// TODO: stuff whit records array
	if (records.length > 0) {
		// Console.log(records);
		return records;
	}

	return false;

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
				pretty: true,
				indent: '\t'
			}

		}).buildObject(record);
	}
}
