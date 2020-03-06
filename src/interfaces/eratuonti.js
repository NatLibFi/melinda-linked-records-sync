/* eslint-disable no-unused-vars, */

import {Utils} from '@natlibfi/melinda-commons';
import {BLOB_STATE, createApiClient} from '@natlibfi/melinda-record-import-commons';

import {
	API_URL, API_USERNAME, API_PASSWORD, API_CLIENT_USER_AGENT, API_HARVERSTER_PROFILE_ID
} from '../config';

const {createLogger} = Utils;

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
			// TODO - Do stuff to blob
			console.log(blob);
			getFailedRecordsFromBlob(id);
			return processCallback(blobs);
		}
	}

	// TODO: From failedRecords or from import state UPDATE_REQUIRED
	async function getFailedRecordsFromBlob(id) {
		const data = await client.getBlobMetadata({id});
		console.log(data.processingInfo.failedRecords);
		const failedRecords = data.processingInfo.failedRecords;
		const justRecords = failedRecords.map(record => {
			return record.record;
		});
		console.log(justRecords);
	}

	async function getUpdateRequiredRecordsFromBlob(id) {
		const data = await client.getBlobMetadata({id});
		console.log(data.processingInfo.importResults);
		const importResults = data.processingInfo.importResults;
		const justMetadata = importResults
			.filter(record => {
				return record.status === 'ACTION_NEEDED';
			})
			.map(record => {
				return record.metadata;
			});
		/* UPDATE REQUIRED schema: (Record does not have most recent version) TODO: Add reason to metadata.
		{
        	"timestamp": "2019-11-14T16:09:45.725Z",
        	"status": "ACTION_NEEDED",
        	"metadata": {
          		"id": "012345678",
          		"linkData": [
					{"400": data},
					{"100": data},
					{"135": data}
        		]
    		}
    	}
		*/
		console.log(justMetadata);
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

// TODO - Send record to queue
export async function sendBlob(blob = [], type = 'application/json', profile = API_HARVERSTER_PROFILE_ID) {
	const logger = createLogger();
	logger.log('info', 'Melinda-record-link-migration blob sending to ErätuontiService has begun!');
	if (blob.length > 0 && profile.length > 0) {
		const client = createApiClient({
			url: API_URL, username: API_USERNAME, password: API_PASSWORD,
			userAgent: API_CLIENT_USER_AGENT
		});

		logger.log('info', 'Trying to create  blob');
		// Record-import-commons: async function createBlob({blob, type, profile})
		client.createBlob({blob, type, profile});
		// TODO TRANSFORMER picks it from QUEUE
	}
}
