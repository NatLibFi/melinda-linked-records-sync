/* eslint-disable no-unused-vars, no-warning-comments */

import https from 'https';
import {Utils} from '@natlibfi/melinda-commons';

import {OAI_PMH_URL, OAI_PMH_HTTP_PORT, OAI_PMH_USERNAME, OAI_PMH_PASSWORD} from '../config';

const {createLogger} = Utils;

export async function getRecordFrom(opts) {
	const logger = createLogger();

	// Temp to see all opts
	const {root, id, format} = opts;

	// TODO HTTP gets
	/*
    {
    "descr": "Should respond with a record",
    "requestUrl": "/bib?verb=GetRecord&metadataPrefix=marc&identifier=oai:foo.bar/12345"
    }
    */
	const getString = `?verb=GetRecord&metadataPrefix=${format}&identifier=${OAI_PMH_USERNAME}:${OAI_PMH_PASSWORD}/${id}`;
	logger.log('debug', 'incoming opts + http options');
	logger.log('debug', JSON.stringify(opts));

	const https = require('https');
	const options = {
		hostname: OAI_PMH_URL,
		port: OAI_PMH_HTTP_PORT,
		path: `/${root}${getString}`,
		method: 'GET'
	};
	logger.log('debug', JSON.stringify(options));
	/*
    Const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`)

        res.on('data', d => {
          logger.log(d);
        })
      })

      req.on('error', error => {
        logger.log('error',error)
      })

      req.end()
      */
}
