import {Utils} from '@natlibfi/melinda-commons/';

const {readEnvironmentVariable, parseBoolean} = Utils;

// Api client variables
export const API_URL = readEnvironmentVariable('API_URL');
export const API_USERNAME = readEnvironmentVariable('API_USERNAME');
export const API_PASSWORD = readEnvironmentVariable('API_PASSWORD');
export const API_CLIENT_USER_AGENT = readEnvironmentVariable('API_CLIENT_USER_AGENT', {defaultValue: '_RECORD-LINK-MIGRATION'});
export const API_HARVERSTER_PROFILE_ID = readEnvironmentVariable('API_HARVERSTER_PROFILE_ID');

// OAI-PMH connection variables
// TODO Change URL to test
export const OAI_PMH_URL = readEnvironmentVariable('OAI_PMH_URL');
export const OAI_PMH_HTTP_PORT = readEnvironmentVariable('OAI_PMH_HTTP_PORT', {defaultValue: 8080, format: v => Number(v)});
export const OAI_PMH_USERNAME = readEnvironmentVariable('OAI_PMH_USERNAME');
export const OAI_PMH_PASSWORD = readEnvironmentVariable('OAI_PMH_PASSWORD');
export const OAI_PMH_CONCURRENT_REQUESTS = readEnvironmentVariable('OAI_PMH_CONCURRENT_REQUESTS', {defaultValue: 1, format: v => Number(v)});

// SRU variables
export const SRU_URL = readEnvironmentVariable('SRU_URL', {defaultValue: ''});
export const SRU_HTTP_PORT = readEnvironmentVariable('SRU_HTTP_PORT', {defaultValue: 8080, format: v => Number(v)});
export const SRU_VERSION = readEnvironmentVariable('SRU_VERSION', {defaultValue: '2'});

// Config file variables
export const CONF_FILE = './job-configs/' + readEnvironmentVariable('CONF_FILE', {defaultValue: 'run2.json'});
export const CURRENT_JOB_FILEPATH = './job/done.json';
export const DEFAULT_OAI_PMH_ROOT = readEnvironmentVariable('DEFAULT_OAI_PMH_ROOT', {defaultValue: 'bib'});
export const DEFAULT_TAGS = readEnvironmentVariable('DEFAULT_TAGS', {defaultValue: ['100', '110', '350']});
export const DEFAULT_FORMAT = readEnvironmentVariable('DEFAULT_FORMAT', {defaultValue: 'melinda_marc'});
// Chunk size 100 => last request time ~8.5sec. Chunk size 10 => last request time ~1sec (sequental id numbers)
// Chunk size 100 => last request time ?. Chunk size 10 => last request time ~1.1sec (unsequental id numbers)
export const CHUNK_SIZE = readEnvironmentVariable('CHUNK_SIZE', {defaultValue: 10, format: v => Number(v)});

// AMQP variables
export const AMQP_URL = readEnvironmentVariable('AMQP_URL', {
	defaultValue: {
		protocol: 'amqp',
		hostname: 'localhost',
		port: 5672,
		username: 'melinda',
		password: 'test12',
		frameMax: 0,
		heartbeat: 0,
		vhost: '/'
	}
});
export const AMQP_QUEUE_NAME = 'melinda-queue';
export const AMQP_QUEUE_PURGE_ON_LOAD = readEnvironmentVariable('PURGE_QUEUE_ON_LOAD', {defaultValue: true, format: parseBoolean});

// Emiter variables
export const EMITTER_JOB_CONSUME = 'EMITTER_JOB_CONSUME';

// JOB status
export const JOB_NONE = 'NONE';
export const JOB_DONE = 'DONE';
export const JOB_IN_QUEUE = 'IN_QUEUE';
export const JOB_FAILED = 'FAILED';
