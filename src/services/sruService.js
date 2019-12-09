/* eslint-disable no-unused-vars, */
import {Utils} from '@natlibfi/melinda-commons';
import createSruClient from '@natlibfi/sru-client';
import {SRU_URL, SRU_VERSION} from '../config';
import {MARCXML} from '@natlibfi/marc-record-serializers';

// NEEDS MORE? const sruClient = createSruClient({serverUrl: sruURL, version: SRU_VERSION, maximumRecords: 1});
const client = createSruClient({serverUrl: 'https://sru.api.melinda-test.kansalliskirjasto.fi/bib', version: '2.0', maximumRecords: '1'});
const {createLogger} = Utils;
const logger = createLogger();

export async function getLinkedInfo(marcRecord, tags) {
	let linkdata = [];
	// Generate querries
	const querry = generateQuerry(marcRecord, tags);

	// Execute querries
	await new Promise((resolve, reject) => {
		// TODO: Search every tag
		client.searchRetrieve(querry[0])
			.on('record', xmlString => {
				// TODO processRecord(xmlString);
				linkdata.push(MARCXML.from(xmlString));
				// Check incoming data: logger.log('debug', JSON.stringify(record));
			})
			.on('end', () => resolve())
			.on('error', err => reject(err));
	});

	// Return json
	return linkdata;
}

function generateQuerry(marcRecord, tags) {
	// KATSO https://github.com/NatLibFi/marc-record-js
	// TODO Kentät BIB
	// Haku titlellä client.searchRetrieve('dc.title="kivi*"')
	// Haku idllä client.searchRetrieve('rec.id=9000')
	// Haku tekijällä client.searchRetrieve('dc.author="Päätalo, Kalle"')
	// Lisä infoa http://app.aleph.csc.fi:210/bib
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
	return ['dc.title="kivi*"'];
}
