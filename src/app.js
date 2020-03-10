/* eslint-disable no-unused-vars, no-undef */

import {Utils} from '@natlibfi/melinda-commons';
import {logError, mongoFactory, JOB_STATES, amqpFactory} from '@natlibfi/melinda-record-link-migration-commons';
import {createIdsFromTo, listToChunkList} from './util';
import {getJobConfig} from './interfaces/jobConfig';
import {v4 as uuid} from 'uuid';
import {getRecordsList} from './interfaces/oai-pmh';
import {collect} from './interfaces/collect';
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
		// Await till last part of migration process is done
		const jobInQ = await mongoOperator.getOne(JOB_STATES.IN_QUEUE); // Transformer
		if (jobInQ) {
			const allHandled = await collect(jobInQ, amqpOperator);

			if (allHandled) {
				await mongoOperator.setState({jobId: jobInQ.jobId, state: JOB_STATES.IN_PROCESS});
			}

			await setTimeoutPromise(1000); // Slow sru querys
			return checkJobs();
		}

		const jobInP = await mongoOperator.getOne(JOB_STATES.IN_PROCESS); // Importer
		if (jobInP !== null) {
			console.log(jobInP);

			if (jobInP) {
				// RemoveJob(jobInP.jobId);
				process.exit(0);
			}

			await setTimeoutPromise(3000);
			return checkJobs();
		}

		const jobDone = await mongoOperator.getOne(JOB_STATES.DONE);
		if (jobDone) {
			// DEV HELP
			removeJob(jobDone.jobId);
			// TODO check if specific time is past before making redo job
			// redo job
			await setTimeoutPromise(3000);
			return checkJobs();
		}

		const jobProcessR = await mongoOperator.getOne(JOB_STATES.PROCESSING_RECORDS);
		if (jobProcessR) {
			console.log(jobProcessR);
			return runJob(jobProcessR.jobId, jobProcessR.jobConfig);
		}

		const jobPendingR = await mongoOperator.getOne(JOB_STATES.PENDING_RECORDS);
		if (jobPendingR) {
			const newJob = await mongoOperator.setState({jobId: jobPendingR.jobId, state: JOB_STATES.PROCESSING_RECORDS});
			console.log(newJob);
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
	async function removeJob(id) {
		const params = {jobId: id};
		await mongoOperator.remove(params);
	}

	// TODO prosessing loop
	async function runJob(jobId, {oaiPmhRoot, oaiPmhFormat, tags, ids, fromTo, startFrom, resumptionToken = false}) {
		let chunks = [];
		// DEBUG
		// console.log(oaiPmhRoot);
		// console.log(oaiPmhFormat);
		// console.log(tags);
		// console.log(ids);
		// console.log(fromTo);
		// console.log(startFrom);
		// console.log(resumptionToken);

		// TODO if QUEUE empty check
		const messagesAmount = await amqpOperator.checkQueue(jobId, 'messages', false);

		if (messagesAmount) {
			await setTimeoutPromise(3000);
			return checkJobs();
		}

		// TODO Continue with resumption token
		if (resumptionToken) {
			const jsonResumptionToken = JSON.parse(resumptionToken);
			console.log(jsonResumptionToken);
		}

		// Queue from the start:
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

			return checkJobs();
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

			return checkJobs();
		}

		// TODO (startFrom)
		if (startFrom) {
			return checkJobs();
		}

		// GET JUST FROM ROOT (job.root)
		logger.log('info', `JOB from root: ${oaiPmhRoot}`);
		// Check if Queue exists ? get token : start one
		// Fetch 1000 from oai-pmh
		const xmlResponse = await getRecordsList({oaiPmhRoot, oaiPmhFormat});
		// Transform xmlResponse to marcRecords
		const newResumptionToken = await readXMLResponseToMarcRecords({amqpOperator, jobId, tags, response: xmlResponse});
		// TODO save resumptionToken to mongo
		// console.log(resumptionToken);
		console.log(await mongoOperator.updateResumptionToken({jobId, newResumptionToken}));
		// Console.log(records[0]);

		mongoOperator.setState({jobId, state: JOB_STATES.IN_QUEUE});

		return checkJobs();
	}
}
