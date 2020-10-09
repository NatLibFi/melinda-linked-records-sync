// Host record harvester variables

const oaiPmhAuthNamesUrl = 'https://oai-pmh.api.melinda.kansalliskirjasto.fi/aut-names';
const oaiPmhAuthNamesSet = 'personal';
const oaiPmhBibUrl = 'https://oai-pmh.api.melinda.kansalliskirjasto.fi/bib';
const oaiPmhBibSet = 'serial';

// Host record harvester configs
// Oai-pmh auth-names
export const baseOaiPmhAuthNamesHostRecordHarvestConfig = {
  type: 'oai-pmh',
  url: oaiPmhAuthNamesUrl,
  set: oaiPmhAuthNamesSet,
  resumptionToken: ''
};

// Oai-pmh bib
export const baseOaiPmhBibHostRecordHarvestConfig = {
  type: 'oai-pmh',
  url: oaiPmhBibUrl,
  set: oaiPmhBibSet,
  resumptionToken: ''
};

// Link data harvester variables
const sruUrl = 'https://sru.api.melinda-test.kansalliskirjasto.fi/bib';
const fintoQueryFormat = `
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX yso: <http://www.yso.fi/onto/yso/>
SELECT DISTINCT *
FROM yso:
WHERE {
yso:%s skos:prefLabel ?label .
}`;
const fintoUrl = 'http://api.dev.finto.fi/sparql?';

// Link data harvester configs
// Sru author
export const baseSruAuthorHarvesterConfig = {
  type: 'sru',
  from: {tag: '100', value: {code: 'a'}}, // From hostRecord to query
  queryFormat: 'dc.author=%s',
  url: sruUrl,
  offset: 0
};

// Finto
export const baseFintoHarvesterConfig = {
  type: 'finto',
  queryFormat: fintoQueryFormat,
  url: fintoUrl,
  collect: ['0'],
  from: {tag: '650', value: 'collect'} // From hostRecord to query
};
