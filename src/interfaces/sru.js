/* eslint-disable no-unused-vars, */
import {Utils} from '@natlibfi/melinda-commons';
import createSruClient from '@natlibfi/sru-client';
import {SRU_URL, SRU_VERSION} from '../config';
import {MARCXML} from '@natlibfi/marc-record-serializers';

// NEEDS MORE? const sruClient = createSruClient({serverUrl: sruURL, version: SRU_VERSION, maximumRecords: 1});
const client = createSruClient({serverUrl: 'https://sru.api.melinda-test.kansalliskirjasto.fi/autprv-names', version: '2.0', maximumRecords: '1'});
const {createLogger} = Utils;
const logger = createLogger();

export async function getLinkedInfo(marcRecord, tags) {
	let linkdata = [];
	// Generate queries
	const queries = await generateQueries(marcRecord, tags);
	// Check incoming record logger.log('debug', JSON.stringify(marcRecord));
	// Execute queries
	queries.forEach(data => {
		linkdata.push(doQuery(data));
	});

	// Return json
	return Promise.all(linkdata);

	async function doQuery(data) {
		return new Promise((resolve, reject) => {
			// TODO: Search every tag
			client.searchRetrieve(data.query)

				.on('record', xmlString => {
					// TODO processRecord(xmlString);
					resolve({tag: data.tag, record: MARCXML.from(xmlString)});
					// Check incoming data: logger.log('debug', JSON.stringify(record));
				})
				.on('end', () => resolve({tag: data.tag, record: false}))
				.on('error', err => reject(err));
		});
	}
}

// TODO CONFIG FILE -> run by tag!
async function generateQueries(marcRecord, tags) {
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
	const queries = [];
	let fields;
	tags.forEach(tag => {
		switch (tag) {
			case '100':
				fields = marcRecord.get(/^100$/);
				// Check ind1 = 0 - Nimen osien järjestys suora,  = 1 - Nimen osien järjestys käänteinen, = 3  - Suvun nimi
				if (fields.length > 0 && (fields[0].ind1 === '0' || fields[0].ind1 === '1')) {
					const subfields = fields[0].subfields;
					// Check field content console.log(fields[0]);
					// No point to repeat allready linked data ‡0 - Auktoriteettitietueen kontrollinumero (T)
					if (!subfields.some(sub => sub.code === '0')) {
						const subA = subfields.find(sub => sub.code === 'a'); // ‡a - Henkilönnimi (ET)
						const subD = subfields.find(sub => sub.code === 'd'); // ‡d - Nimeen liittyvät aikamääreet (ET)
						const subF = subfields.find(sub => sub.code === 'f'); // ‡f - Teoksen julkaisuaika (ET)
						const subQ = subfields.find(sub => sub.code === 'q'); // ‡q - Henkilönnimen täydellisempi muoto (ET)

						queries.push({tag, query: `"${subA.value}"`});
					}
				}

				break;
			case '110':
				// TODO: Yhteisöt
				fields = marcRecord.get(/^110$/);
				if (fields.length > 0) {
					const subfields = fields[0].subfields;
					// Check console.log(subfields);
					// No point to repeat allready linked data
					if (!subfields.some(sub => sub.code === '0')) {
						const subA = subfields.find(sub => sub.code === 'a'); // ‡a - Yhteisönnimi (ET)
						const subE = subfields.find(sub => sub.code === 'e'); // ‡e - Suhdetermi (T)
						const subF = subfields.find(sub => sub.code === 'f'); // ‡f - Teoksen julkaisuaika (ET)

						// Querry communities queries.push(`dc.author="${subA.value}"`);
					}
				}

				break;
			case '370':
				// TODO Paikat
				break;
			default:
				break;
		}
	});
	return queries;
}
