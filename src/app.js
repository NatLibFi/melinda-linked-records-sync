import {Utils} from '@natlibfi/melinda-commons';
import {getBlobs} from './services/eratuontiService';

const {createLogger} = Utils;

run();

function run() {
	const logger = createLogger();
	logger.log('info', 'Melinda-record-link-migration has been started');

	// TODO Start app by configuration
	// TODO - Start wanted service
	// TODO - Weit till done
	// TODO - Check more work
	// TODO - Repeat or shut down

	getBlobs();
}

