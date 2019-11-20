import fs from 'fs';
import {getRecordFrom} from './oai-pmhService';
import {validateConfFile} from '../util';
import {Utils} from '@natlibfi/melinda-commons';

import {
	CONF_FILE
} from './config';

const {createLogger} = Utils;

export function fromConfigFile() {
	const logger = createLogger();

	const jsonConf = JSON.parse(fs.readFileSync(CONF_FILE));
	logger.log('info', `Loading congif file: ${CONF_FILE}`);
	const options = validateConfFile(jsonConf);
	let id;

	switch (jsonConf.confType) {
		case 0:
			logger.log('info', 'Conf type 0 loaded');
			logger.log('debug', options);
			break;
		case 1:
			jsonConf.ids.forEach(id => {
				id = (String(id)).padStart(9, '0');
				options.id = id;
				getRecordFrom(options);
			});
			break;
		case 2:
			id = jsonConf.fromTo.start;
			while (id <= jsonConf.fromTo.end) {
				id = (String(id)).padStart(9, '0');
				options.id = id;
				getRecordFrom(options);
				id++;
			}

			break;
		default:
			logger.log('info', 'Conf type 0 loaded as default');
			logger.log('debug', options);
			break;
	}
}
