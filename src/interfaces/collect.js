import {getLinkedInfo} from './sru';
import {Json} from '@natlibfi/marc-record-serializers';
import {sendBlob} from './eratuonti';
import {Utils} from '@natlibfi/melinda-commons';

export async function collect({jobId}, amqpOperator) {
	const {createLogger} = Utils;
	const logger = createLogger(); // eslint-disable-line no-unused-vars

	// Read from queue
	const message = await amqpOperator.checkQueue(jobId, 'raw');

	if (message) {
		const links = message.properties.headers.links;
		const record = Json.from(message.content.toString());

		// Get link data
		const linkData = await getLinkedInfo(record, links);

		// TODO Check linkData
		if (linkData.length < 1) {
			// Ack message nothing to update
			await amqpOperator.ackMessages([message]);
			return;
		}

		const filteredLinkData = linkData.filter(data => data.record);
		// Check logger.log('debug', JSON.stringify(filteredLinkData, null, '\t'));

		if (filteredLinkData.length > 0) {
			logger.log('info', 'Sending blob to erätuonti');
			// Push to erätuonti
			const blobId = await sendBlob([{record, linkData: filteredLinkData}]);

			// Ack message data is passed to transformer
			await amqpOperator.ackMessages([message]);
			return blobId;
		}

		// Ack message nothing to update
		await amqpOperator.ackMessages([message]);
		return;
	}

	return true;
}
