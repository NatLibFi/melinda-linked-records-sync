/* eslint-disable no-unused-vars, */
import {Utils} from '@natlibfi/melinda-commons';
import createSruClient from '@natlibfi/sru-client';
import {SRU_URL, SRU_VERSION} from '../config';
import {MARCXML} from '@natlibfi/marc-record-serializers';

const {createLogger} = Utils;
const logger = createLogger();

export async function getLinkedInfo(marcRecord, links) {
	let linkdata = [];
	// Generate queries
	logger.log('info', 'Generating queries');
	const qLinks = await generateQueries(marcRecord, links);
	// Check incoming record logger.log('debug', JSON.stringify(marcRecord));

	// Execute queries
	logger.log('info', 'Executing queries');
	// Search every tag

	const filteredqLinks = qLinks.filter(data => data);

	filteredqLinks.forEach(tag => {
		const {serverUrl, version, maximumRecords} = tag.sru;
		const client = createSruClient({serverUrl, version, maximumRecords});
		linkdata.push(doQuery(client, tag));
	});

	// Return json
	return Promise.all(linkdata);

	async function doQuery(client, tag) {
		return new Promise((resolve, reject) => {
			// TODO Multi result support?
			client.searchRetrieve(tag.sru.query)
				.on('record', xmlString => {
					logger.log('debug', 'SRU search record');
					// XmlString to MarcRecord
					resolve({tag: tag.from.tag, record: MARCXML.from(xmlString)});
				})
				.on('end', () => {
					logger.log('debug', 'SRU search end');
					resolve({tag: tag.from.tag, record: false});
				})
				.on('error', err => reject(err));
		});
	}
}

// TODO CONFIG FILE -> run by tag!
async function generateQueries(marcRecord, links) {
	// KATSO https://github.com/NatLibFi/marc-record-js
	// TODO Kentät BIB
	// Haku titlellä client.searchRetrieve('dc.title="kivi*"')
	// Haku idllä client.searchRetrieve('rec.id=9000')
	// Haku tekijällä client.searchRetrieve('dc.author="Päätalo, Kalle"')
	// Lisä infoa https://rest.api.melinda-test.kansalliskirjasto.fi/bib
	// 026 Sormenjälki
	// 017 Tekijänoikeus
	// 034 kartta tiedot
	// 039 Suomalainen katasto
	// 100 Henkilönimet
	// 110 Yhteisöt
	// 245 Nimike- ja vastuullisuusmerkintö
	// henkilö auktorisoitu jos true <= marcRecord.containsFieldWithValue('100', [{code: '0'}]);
	// Jos ei tarvetta niin ei palautusta!

	// const f100 = marcRecord.get(/^100$/);
	// const nimi = f100.subfields.some(sub => (sub.code === 'a'));

	// TODO Kentät AUCT
	// 100 Henkilönimet
	// 110 Yhteisöt
	// 148 - OTSIKKOMUOTO - AIKAA ILMAISEVA TERMI (ET)
	// 151 - OTSIKKOMUOTO - MAANTIETEELLINEN NIMI (ET)
	// 181 - OTSIKKOMUOTO - MAANTIETEELLINEN LISÄMÄÄRE (ET)
	// 182 - OTSIKKOMUOTO - AIKAA ILMAISEVA LISÄMÄÄRE (ET)
	// 046 - ERIKOISKOODATUT AJANKOHDAT (T) alku ja loppu
	// 370 - PAIKANNIMI (T)
	// 373 - YHTEYS RYHMÄÄN (T)
	// 375 - SUKUPUOLI (T)
	// 378 - HENKILÖNNIMEN TÄYDELLISEMPI MUOTO (T)

	/* Example links config
	"links": [
		{
			from: {tag: "100", sub: "a", skip: "0"},
			to: {tag: "400", sub: "a"},
			sru: {
				serverUrl: "https://sru.api.melinda-test.kansalliskirjasto.fi/autprv-names",
				version: "2.0",
				maximumRecords: 1,
				query: ""}
		}
	]
	*/

	// Check logger.log('debug', JSON.stringify(links, null, '\t'));
	const qlinks = links.map(tag => {
		// RegExp to filter right fields
		const regexp = new RegExp('^' + tag.from.tag + '$');
		const fields = marcRecord.get(regexp);

		// Work on fields
		if (fields.length > 0) {
			// TODO Multi field support?
			const subfields = fields[0].subfields;

			// Check logger.log('debug', JSON.stringify(fields, null, '\t'));
			// Check logger.log('debug', JSON.stringify(subfields, null, '\t'));

			// Skip if allready linked
			if (subfields.some(sub => sub.code === tag.from.skip)) {
				return false;
			}

			const sub = subfields.find(sub => sub.code === tag.from.sub);
			tag.sru.query += '"' + sub.value + '"';
			logger.log('debug', `Query: ${tag.sru.query}`);
			return tag;
		}

		return false;
	});

	return qlinks;
}
