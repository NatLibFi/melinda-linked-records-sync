/* eslint-disable no-unused-vars */

import {isNumber} from 'util';
import {Utils} from '@natlibfi/melinda-commons';
import {configs} from '../../job-configs/jobConfigs';
import {DEFAULT_JOB_CONFIG} from '@natlibfi/melinda-record-link-migration-commons';
import {JOB_CONFIG} from '../config';

const {createLogger} = Utils;
const logger = createLogger();

export function getJobConfig() {
	logger.log('info', `Loading config : ${JOB_CONFIG}`);
	try {
		const opts = buildOpts(configs[`${JOB_CONFIG}`]);

		if (opts.ids && opts.ids.length < 1) {
			throw Error('Config validation error: Invalid configuration value "ids"!');
		}

		checkFromTo(opts.fromTo);
		checkStartFrom(opts.startFrom);

		logger.log('info', `Loaded configs: ${JSON.stringify(opts)}`);
		return opts;
	} catch (err) {
		logger.log('error', err);
		process.exit(0);
	}

	function buildOpts(config) {
		const opts = {
			oaiPmhRoot: config.oai_pmh_root || DEFAULT_JOB_CONFIG.oaiPmhRoot,
			oaiPmhFormat: config.oai_pmh_format || DEFAULT_JOB_CONFIG.oaiPmhFormat,
			tags: config.tags || DEFAULT_JOB_CONFIG.tags,
			ids: config.ids || DEFAULT_JOB_CONFIG.ids,
			fromTo: config.fromTo || DEFAULT_JOB_CONFIG.fromTo,
			startFrom: config.startFrom || DEFAULT_JOB_CONFIG.startFrom
		};

		return opts;
	}

	function checkFromTo(fromTo) {
		if (fromTo) {
			if (!isNumber(fromTo.start)) {
				throw Error('Config validation error: Invalid configuration value "fromTo.start"!');
			}

			if (!isNumber(fromTo.end)) {
				throw Error('Config validation error: Invalid configuration value "fromTo.end"!');
			}

			if (fromTo.start > fromTo.end) {
				throw Error('Config validation error: Invalid configuration in "fromTo"!');
			}
		}
	}

	function checkStartFrom(startFrom) {
		if (startFrom) {
			if (!isNumber(startFrom)) {
				throw Error('Config validation error: Invalid configuration value "startFrom"!');
			}
		}
	}
}
