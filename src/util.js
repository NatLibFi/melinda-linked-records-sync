/* eslint-disable no-unused-vars */

import {Utils} from '@natlibfi/melinda-commons';
import fs from 'fs';
import path from 'path';
import moment from 'moment';

import {CURRENT_JOB_FILEPATH, CHUNK_SIZE, JOB_NONE} from './config';

const {createLogger} = Utils;

export function logError(err) {
	const logger = createLogger();
	if (err !== 'SIGINT') {
		logger.log('error', 'stack' in err ? err.stack : err);
	}

	logger.log('error', err);
}

export function changeJobStatus(status, message) {
	const jobStatus = {
		status,
		message,
		timeStamp: moment()
	};
	try {
		fs.writeFile(path.resolve(CURRENT_JOB_FILEPATH), JSON.stringify(jobStatus), function (err) {
			if (err) {
				console.log(err);
				changeJobStatus(status, message);
			}
		});
	} catch (err) {
		console.log(err);
	}
}

export function checkIfJobDone() {
	try {
		const filePath = path.resolve(CURRENT_JOB_FILEPATH);
		if (fs.existsSync(filePath)) {
			return JSON.parse(fs.readFileSync(filePath));
		}

		return {status: JOB_NONE};
	} catch (err) {
		console.log(err);
	}
}

export function listToChunkList(ids = []) {
	const chunks = [];
	while (ids.length > CHUNK_SIZE) {
		chunks.push([...ids.splice(0, CHUNK_SIZE)]);
	}

	chunks.push([...ids]);
	return chunks;
}

export function createIdsFromTo(fromTo) {
	return Array.from({length: fromTo.end - fromTo.start}, (v, k) => String(k + fromTo.start));
}
