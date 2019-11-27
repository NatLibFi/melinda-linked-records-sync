/* eslint-disable no-unused-vars */

import axios from 'axios';
import fs from 'fs';
import {Utils} from '@natlibfi/melinda-commons';

import {OAI_PMH_URL, OAI_PMH_USERNAME, OAI_PMH_PASSWORD} from '../config';

const {createLogger, fromAlephId} = Utils;
const logger = createLogger();

// TODO one function to connect + one function to make getString from opts

export async function getRecordById(opts) {
	// TODO HTTP gets
	// https://oai-pmh.api.melinda.kansalliskirjasto.fi/bib?verb=GetRecord&metadataPrefix=melinda_marc
	// Temp to see all opts
	const {root, id, format} = opts;

	const getString = `?verb=GetRecord&metadataPrefix=${format}&identifier=oai:melinda.kansalliskirjasto.fi/${fromAlephId(id)}`;
	const baseURL = OAI_PMH_URL;
	const url = `/${root}${getString}`;
	// TEST logger.log('debug', baseURL + url);

	// Axios#get(url[, config])
	return axios({
		method: 'GET',
		url,
		baseURL,
		responseType: 'text'
	});
}

export async function getRecordsList(opts) {
	// TODO HTTP gets
	// https://oai-pmh.api.melinda.kansalliskirjasto.fi/bib?verb=ListRecords&metadataPrefix=melinda_marc
	// Temp to see all opts
	const {root, format} = opts;

	const getString = `?verb=ListRecords&metadataPrefix=${format}`;
	const url = `/${root}${getString}`;
	const baseURL = `${OAI_PMH_URL}`;
	// TEST logger.log('debug', baseURL + url);

	// Axios#get(url[, config])
	return axios({
		method: 'GET',
		url,
		baseURL,
		responseType: 'text'
	});

	// Works too
	// Const response = await axios.get(baseURL + url);
	// console.log(response);
}

export async function resumeRecordList(opts) {
	// TODO HTTP gets
	// TODO ?verb=ListRecords&resumptionToken=<token>
	// Temp to see all opts
	const {root, resumptioinToken} = opts;

	const getString = `?verb=ListRecords&resumptionToken=${resumptioinToken}`;
	const url = `/${root}${getString}`;
	const baseURL = `${OAI_PMH_URL}`;
	// TEST logger.log('debug', baseURL + url);

	// Axios#get(url[, config])
	return axios({
		method: 'GET',
		url,
		baseURL,
		responseType: 'text'
	});
}
