/* eslint-disable no-unused-vars */

import {Utils} from '@natlibfi/melinda-commons';
import {getJob} from './services/configFileService';
import amqplib from 'amqplib';
import {createBlob} from './services/createBlobService';
// Import {getBlobs} from './services/eratuontiService';

import {
	AMQP_URL, AMQP_QUEUE_NAME, AMQP_QUEUE_PURGE_ON_LOAD,
	JOB_DONE, JOB_IN_QUEUE, JOB_NONE,
	EMITTER_JOB_CONSUME
} from './config';
import {logError, checkIfJobDone, createIdsFromTo, listToChunkList, changeJobStatus} from './util';

import {EventEmitter} from 'events';
class QueueEmitter extends EventEmitter {}
export const EMITTER = new QueueEmitter();

const {createLogger} = Utils;
const logger = createLogger();

process.on('UnhandledPromiseRejectionWarning', err => {
	logError(err);
	process.exit(1);
});

run();

async function run() {
	logger.log('info', 'Melinda-record-link-migration has been started');

	// TODO Start app by configuration
	const job = await getJob();
	logger.log('info', JSON.stringify(job));
	// TODO JOB STALLED?
	// NODEMON Cleans last run away!
	const jobStatus = await checkIfJobDone();
	logger.log('info', JSON.stringify(jobStatus));

	// TODO prosessing loop
	/* REMOVE COMMENT LATER....
	if (jobStatus.status === JOB_DONE) {
		// JOB IS DONE!
		logger.log('info', JSON.stringify(jobStatus));
		process.exit(1);
	}
	*/

	setEmitterListeners(job);

	if (jobStatus.status === JOB_NONE || jobStatus.status === JOB_DONE) {
		try {
			await initJob(job);
			jobStatus.status = JOB_IN_QUEUE;
		} catch (err) {
			logger.log('info', 'Error while initiating job!');
			logError(err);
		}

		logger.log('info', 'Job has been initiated!');
	}

	if (jobStatus.status === JOB_IN_QUEUE) {
		// TODO Get stuff from queue and process it
		// Read from queue
		// Push to array [{record: {record}, linkData: {linkData}}]
		// All done -> make blob
		// Send Blob to erätuonti

		logger.log('info', 'Starting queue consuming!');
		consumeQueue(job);
	}

	// TODO - Start wanted service
	// TODO - Weit till done
	// TODO - Check more work
	// TODO - Repeat or shut down

	// getBlobs();
}

async function setEmitterListeners(job) {
	await new Promise(res => {
		EMITTER
			.on('SHUTDOWN', () => res())
			.on(EMITTER_JOB_CONSUME, () => {
				// TODO START CONSUME
				logger.log('info', 'consuming');
				createBlob(job);
			});
	});
}

async function consumeQueue() {
	const queueLenght = await operateRabbitQueues(false, false, true);
	if (queueLenght > 0) {
		EMITTER.emit(EMITTER_JOB_CONSUME);
	} else {
		setTimeout(consumeQueue, 3000);
	}
}

async function initJob({root, format, confType, ids, fromTo}) {
	// Init & purge & check queues
	await operateRabbitQueues(true, AMQP_QUEUE_PURGE_ON_LOAD, true);
	let chunks = [];
	switch (confType) {
		case 0:
			// GET JUST FROM ROOT (job.root)
			logger.log('info', `CASE ${confType}: ${root}`);
			// TODO Fetch 1000 from oai-pmh
			// Check if Queue exists ? get token : start one

			// TODO!! readXMLResponseToMarcRecords(await getRecordsList({root, format}));

			break;
		case 1:
			// GET SPECIFIC IDS FROM ROOT (job.ids & job.root)
			logger.log('info', `CASE ${confType}: ${root}`);
			// TODO Adds each of theis to RabbitMq queue
			// Check if done file exists ? all done ? do nothing : resume; : start from the beging
			// TODO If ids.lenght > 100 => chunk requests
			chunks = listToChunkList(ids);
			logger.log('info', chunks);
			chunks.forEach(chunk => {
				operateRabbitQueues(false, false, false, JSON.stringify(chunk));
			});
			changeJobStatus(JOB_IN_QUEUE, {root, format, confType, ids, fromTo});

			break;
		case 2:
			// GET ALL BETWEEN GIVEN VALUES FROM ROOT (job.fromTO & job.root)
			logger.log('info', `CASE ${confType}: ${root}`);
			// TODO Adds each of theis to RabbitMq queue
			// Check if done file exists ? all done ? do nothing : resume; : start from the beging

			chunks = listToChunkList(createIdsFromTo(fromTo));
			logger.log('info', JSON.stringify(chunks));
			chunks.forEach(chunk => {
				operateRabbitQueues(false, false, false, JSON.stringify(chunk));
			});
			changeJobStatus(JOB_IN_QUEUE, {root, format, confType, ids, fromTo});

			break;
		default:
			// GET JUST FROM ROOT (job.root)
			logger.log('info', `DEFAULTS TO: ${root}`);
			// TODO Fetch 1000 from oai-pmh
			// Check if Queue exists ? get token : start one
			break;
	}
}

async function operateRabbitQueues(initQueue, purge, checkQueue, toQueue) {
	let connection;
	let channel;
	let queueCount = 0;

	await Promise.all([doAMQPinit()]);

	if (checkQueue) {
		return queueCount;
	}

	async function doAMQPinit() {
		try {
			connection = await amqplib.connect(AMQP_URL);
			channel = await connection.createChannel();

			if (initQueue) {
				await channel.assertQueue(AMQP_QUEUE_NAME, {durable: true, autoDelete: false});
				logger.log('info', 'Rabbitmq queues has been initiated');
			}

			if (purge) {
				await channel.purgeQueue(AMQP_QUEUE_NAME);
				logger.log('info', 'Rabbitmq queues have been purged');
			}

			if (toQueue) {
				channel.sendToQueue(
					AMQP_QUEUE_NAME,
					Buffer.from(toQueue),
					{persistent: true}
				);
			}

			if (checkQueue) {
				const infoChannel = await channel.checkQueue(AMQP_QUEUE_NAME);
				queueCount = infoChannel.messageCount;
				logger.log('debug', `${AMQP_QUEUE_NAME}: ${queueCount} records`);
			}
		} catch (err) {
			logError(err);
		} finally {
			if (channel) {
				await channel.close();
			}

			if (connection) {
				await connection.close();
			}
		}
	}
}
