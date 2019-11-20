import {Utils} from '@natlibfi/melinda-commons';

const {createLogger} = Utils;

run();

function run() {
	const logger = createLogger();
	logger.log('info', 'Melinda-record-link-migration has been started');
}

