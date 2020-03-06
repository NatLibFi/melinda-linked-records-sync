/* eslint-disable no-unused-vars, no-undef */

import {Utils} from '@natlibfi/melinda-commons';
import {logError, mongoFactory, JOB_STATES, amqpFactory} from '@natlibfi/melinda-record-link-migration-commons';
import {createIdsFromTo, listToChunkList} from './util';
import {getJobConfig} from './interfaces/jobConfig';
import {v4 as uuid} from 'uuid';
import {getRecordsList} from './interfaces/oai-pmh';
import {readXMLResponseToMarcRecords} from './interfaces/responseToRecord';
import {promisify} from 'util';

export default async function ({
	MONGO_URI, AMQP_URL
}) {
	const setTimeoutPromise = promisify(setTimeout);
	const {createLogger} = Utils;
	const logger = createLogger();
	const mongoOperator = await mongoFactory(MONGO_URI);
	const amqpOperator = await amqpFactory(AMQP_URL);
	removeJob();

	logger.log('info', 'Melinda-record-link-migration has been started');

	// TODO Check if job in mongo
	await checkJobs();

	// TODO Get stuff from queue and process it
	// Read from queue
	// Push to array [{record: {record}, linkData: {linkData}}]
	// All done -> make blob
	// Send Blob to erätuonti
	// TODO - Start wanted service
	// TODO - Weit till done
	// TODO - Check more work
	// TODO - Repeat or shut down

	async function checkJobs() {
		const jobDone = await mongoOperator.getOne(JOB_STATES.DONE);
		if (jobDone) {
			return runJob(jobDone.jobId, jobDone.jobConfig);
		}

		const jobInP = await mongoOperator.getOne(JOB_STATES.IN_PROCESS);
		if (jobInP) {
			return runJob(jobInP.jobId, jobInP.jobConfig);
		}

		const inQJob = await mongoOperator.getOne(JOB_STATES.IN_QUEUE);
		if (inQJob) {
			const newJob = mongoOperator.setState({jobId: inQJob.jobId, state: JOB_STATES.IN_PROCESS});
			return runJob(newJob.jobId, newJob.jobConfig);
		}

		return createNewJob();
	}

	async function createNewJob() {
		const jobConfig = getJobConfig();
		await mongoOperator.create({jobId: uuid(), jobConfig});
		return checkJobs();
	}

	// Dev helpper function
	async function removeJob() {
		const params = {jobId: 'c1458b53-4d29-4be3-94d3-fabd5d332797'};
		await mongoOperator.remove(params);
	}

	// TODO prosessing loop
	async function runJob(jobId, {oaiPmhRoot, oaiPmhFormat, tags, ids, fromTo, startFrom, resumptionToken}) {
		// DEBUG
		// console.log(oaiPmhRoot);
		// console.log(oaiPmhFormat);
		// console.log(tags);
		// console.log(ids);
		// console.log(fromTo);
		// console.log(startFrom);
		// console.log(resumptionToken);

		// TODO Check queue
		const messagesAmount = await amqpOperator.checkQueue(jobId, 'messages', false);

		if (messagesAmount) {
			await setTimeoutPromise(3000);
			return checkJobs();
		}

		let chunks = [];
		if (!ids && !fromTo && !startFrom) {
			// GET JUST FROM ROOT (job.root)
			logger.log('info', `JOB from root: ${oaiPmhRoot}`);
			// Check if Queue exists ? get token : start one
			// Fetch 1000 from oai-pmh
			const xmlResponse = await getRecordsList({oaiPmhRoot, oaiPmhFormat});
			// Transform xmlResponse to marcRecords
			const resumptionToken = await readXMLResponseToMarcRecords({amqpOperator, jobId, tags, response: xmlResponse});
			// TODO save resumptionToken to mongo
			// console.log(resumptionToken);
			console.log(await mongoOperator.updateResumptionToken({jobId, resumptionToken}));
			// Console.log(records[0]);
		}

		if (ids) {
			// GET SPECIFIC IDS FROM ROOT (job.ids & job.root)
			logger.log('info', `JOB from ids: ${ids}`);
			// TODO Adds each of theis to RabbitMq queue
			// Check if done file exists ? all done ? do nothing : resume; : start from the beging
			// TODO If ids.lenght > 100 => chunk requests
			chunks = listToChunkList(ids);
			logger.log('info', chunks);
			chunks.forEach(chunk => {
				console.log(chunk);
			});
		}

		if (fromTo) {
			// GET ALL BETWEEN GIVEN VALUES FROM ROOT (job.fromTO & job.root)
			logger.log('info', `JOB from fromTo: ${fromTo}`);
			// TODO Adds each of theis to RabbitMq queue
			// Check if done file exists ? all done ? do nothing : resume; : start from the beging

			chunks = listToChunkList(createIdsFromTo(fromTo));
			logger.log('info', JSON.stringify(chunks));
			chunks.forEach(chunk => {
				console.log(chunk);
			});
		}
	}
}
