import {getLinkedInfo} from './sru';
import {Json} from '@natlibfi/marc-record-serializers';
import {sendBlob} from './eratuonti';

export async function collect({jobId}, amqpOperator) {
	// Read from queue
	const message = await amqpOperator.checkQueue(jobId, 'raw');

	if (message) {
		const tags = message.properties.headers.tags;
		const record = Json.from(message.content.toString());

		// Get link data
		const linkData = await getLinkedInfo(record, tags);

		// TODO Check linkData
		if (linkData.length < 1) {
			// Ack message nothing to update
			await amqpOperator.ackMessages([message]);
			return;
		}

		const filteredLinkData = linkData.filter(data => data.record);

		if (filteredLinkData.length > 0) {
			console.log('SEND BLOB TO ERÄTUONTI');
			// Push to erätuonti
			await sendBlob([{record, linkData: filteredLinkData}]);

			// Ack message data is passed to transformer
			await amqpOperator.ackMessages([message]);
			return;
		}

		// Ack message nothing to update
		await amqpOperator.ackMessages([message]);
		return;
	}

	return true;
}
