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
export const JOB_CONFIG = readEnvironmentVariable('JOB_CONFIG', {defaultValue: 'test3'});

// Mongo variables to job
export const MONGO_URI = readEnvironmentVariable('MONGO_URI', {defaultValue: 'mongodb://127.0.0.1:27017/db'});

// AMQP variables
export const AMQP_URL = readEnvironmentVariable('AMQP_URL', {defaultValue: 'amqp://127.0.0.1:5672/'});
export const AMQP_QUEUE_PURGE_ON_LOAD = readEnvironmentVariable('PURGE_QUEUE_ON_LOAD', {defaultValue: 1, format: v => parseBoolean(v)});
