import {Utils} from '@natlibfi/melinda-commons';
import {BLOB_STATE, createApiClient} from '@natlibfi/melinda-record-import-commons';

import {
	API_URL, API_USERNAME, API_PASSWORD, API_CLIENT_USER_AGENT
} from '../config';

const {createLogger} = Utils;

// TODO Connection to database
// TODO - Send record to queue
// TODO TRANSFORMER picks it from QUEUE

export async function getBlobs() {
	const logger = createLogger();
	logger.log('info', 'Melinda-record-link-migration ErätuontiService has begun!');

	// TODO Connection to erätuonti
	const client = createApiClient({
		url: API_URL, username: API_USERNAME, password: API_PASSWORD,
		userAgent: API_CLIENT_USER_AGENT
	});

	logger.log('info', `Trying to get blobs stated as ${BLOB_STATE.PROCESSED}`);
	await processBlobs({
		client, processCallback,
		query: {state: BLOB_STATE.PROCESSED}
	});

	async function processCallback(blobs) {
		const blob = blobs.shift();

		if (blob) {
			// TODO - Parse blobs
			const {id, processedRecords, failedRecords, numberOfRecords} = blob;
			logger.log('info', `Blob: ${id}, ${processedRecords}, ${failedRecords}, ${numberOfRecords}`);
			// TODO - Do staff to blob
			console.log(blob);
			getFailedRecordsFromBlob(id);
			return processCallback(blobs);
		}
	}

	async function getFailedRecordsFromBlob(id) {
		const data = await client.getBlobMetadata({id});
		console.log(data.processingInfo.failedRecords);
	}
}

export async function processBlobs({client, query, processCallback, messageCallback, filter = () => true}) {
	// TODO - Get blobs
	return new Promise((resolve, reject) => {
		let blobsTotal = 0;

		const logger = createLogger();
		const pendingProcessors = [];
		const emitter = client.getBlobs(query);

		emitter
			.on('error', reject)
			.on('blobs', blobs => {
				const filteredBlobs = blobs.filter(filter);

				blobsTotal += filteredBlobs.length;
				pendingProcessors.push(processCallback(filteredBlobs));
			})
			.on('end', () => {
				if (messageCallback) {
					logger.log('debug', messageCallback(blobsTotal));
				}

				resolve(Promise.all(pendingProcessors));
			});
	});
}
