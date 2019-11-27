/* eslint-disable no-unused-vars */

import amqplib from 'amqplib';
import {Utils} from '@natlibfi/melinda-commons';
import {logError, changeJobStatus} from '../util';
import {readXMLResponseToMarcRecords} from './responseToRecordService';
import {getRecordsList, getRecordById} from './oai-pmhService';
import {getLinkedInfo} from './sruService';
import {AMQP_URL, AMQP_QUEUE_NAME, JOB_DONE} from '../config';
import {EMITTER} from '../app';

const {createLogger} = Utils;
const logger = createLogger();

export function createBlob({root, format, confType, ids, fromTo}) {
	logger.log('info', 'BEGUN TO MAKE BLOB!');
	setEmitterListeners(root, format);
	if (confType === 1 || confType === 2) {
		operateRabbitQueue(false, true);
	}
}

async function setEmitterListeners(root, format) {
	logger.log('info', 'emiter ok!');
	await new Promise(res => {
		EMITTER
			.on('DONE', async () => {
				const queueLength = await operateRabbitQueue(true);
				if (queueLength < 1) {
					changeJobStatus(JOB_DONE, 'done?');
					res();
				} else {
					operateRabbitQueue(false, true);
				}
			})
			.on('CHUNK_LOADED', async content => {
				// TODO START CONSUME
				let chunk = content.map(id => {
					return processId(id);
				});
				chunk = await Promise.all(chunk);
				EMITTER.emit('GET_SRU_DATA', chunk);

				async function processId(id) {
					const response = await getRecordById({root, id, format});
					const temp = await readXMLResponseToMarcRecords(response);
					if (temp) {
						return temp;
					}

					return false;
				}
			})
			.on('GET_SRU_DATA', async chunk => {
				logger.log('info', 'Getting link data from SRU');
				chunk = chunk.map(record => {
					if (record) {
						const linkedData = getLinkedInfo(record);
						return {
							record,
							linkedData
						};
					}

					return false;
				}).filter(record => {
					return record;
				});

				await Promise.all(chunk);
				EMITTER.emit('SEND_BLOB', chunk);
			})
			.on('SEND_BLOB', chunk => {
				console.log('SENDING BLOB!');
				console.log(chunk);
				// TODO SEND TO ERÄTUONTI
				EMITTER.emit('DONE');
			});
	});
}

async function operateRabbitQueue(checkQueue = false, consumeQueue = false) {
	logger.log('info', 'operating queue!');

	let connection;
	let channel;
	let queueLength;

	await Promise.all([operate()]);

	if (checkQueue) {
		return queueLength;
	}

	async function operate() {
		try {
			connection = await amqplib.connect(AMQP_URL);
			channel = await connection.createChannel();

			if (checkQueue) {
				const infoChannel = await channel.checkQueue(AMQP_QUEUE_NAME);
				queueLength = infoChannel.messageCount;
				logger.log('debug', `${AMQP_QUEUE_NAME}: ${queueLength} records`);
			}

			if (consumeQueue) {
				channel.prefetch(1); // Per consumer limit
				const chunk = await channel.get(AMQP_QUEUE_NAME);
				if (chunk) {
					channel.ack(chunk); // TODO ack after blob done
					const content = JSON.parse(chunk.content.toString());
					logger.log('debug', `CHUNK has consumed from queue ${content}`);
					EMITTER.emit('CHUNK_LOADED', content);
				}
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
