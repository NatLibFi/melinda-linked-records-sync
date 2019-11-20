import {Utils} from '@natlibfi/melinda-commons/';

const {readEnvironmentVariable} = Utils;

// Config file to load
export const CONF_FILE = readEnvironmentVariable('CONF_FILE', {defaultValue: 'run2.json'});

// OAI-PMH connection variables
export const OAI_PMH_URL = readEnvironmentVariable('OAI_PMH_URL', {defaultValue: 'https://oai-pmh.api.melinda-test.kansalliskirjasto.fi'});
export const OAI_PMH_HTTP_PORT = readEnvironmentVariable('HTTP_PORT', {defaultValue: 8080, format: v => Number(v)});
export const OAI_PMH_USERNAME = readEnvironmentVariable('OAI_PMH_USERNAME', {defaultValue: ''});
export const OAI_PMH_PASSWORD = readEnvironmentVariable('OAI_PMH_PASSWORD', {defaultValue: ''});

// Config defaults
export const DEFAULT_OAI_PMH_ROOT = readEnvironmentVariable('DEFAULT_OAI_PMH_ROOT', {defaultValue: 'bib'});
export const DEFAULT_TAGS = readEnvironmentVariable('DEFAULT_TAGS', {defaultValue: ['100', '600', '650']});
export const DEFAULT_FORMAT = readEnvironmentVariable('DEFAULT_FORMAT', {defaultValue: 'melinda_marc'});
