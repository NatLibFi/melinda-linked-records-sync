/*

// AccessRights,DoubleCommas, DuplicatesInd1, EmptyFields, EndingPunctuation, FieldExclusion,
// FieldsPresent, FieldStructure, FixedFields, IdenticalFields, IsbnIssn, ItemLanguage,
// Punctuation, ResolvableExtReferences, SortTags, SubfieldExclusion, UnicodeDecomposition, Urn

JobState: PENDING_SRU_HARVESTER or PENDING_OAI_PMH_HARVESTER
jobConfig:{blobIds, hostFile, linkDataHarvesterApiProfileId, linkDataHarvestSearch, linkDataHarvesterValidationFilter, changes}

Epic:
epicId:
repeat: false,
status: null,
epicConfig: {
  hostRecordHarvestConfig
  hostRecordValidationFilter
  linkDataHarvesterConfig: [{from, query, url} or {searchSet, url}]
  linkDataHarvesterApiProfileId
  linkDataHarvesterValidationFilters:{changes}
}
*/

import {baseFintoHarvesterConfig, baseOaiPmhBibHostRecordHarvestConfig, baseSruAuthorHarvesterConfig, baseOaiPmhAuthNamesHostRecordHarvestConfig} from './epicConfigConstants';

export const epicTemplate = {
  hostRecordHarvestConfig: {},
  hostRecordValidationFilters: {},
  linkDataHarvesterConfig: [
    {type: 'sru', from: {}, queryFormat: '', url: ''},
    {type: 'oai-pmh', set: '', url: '', resumptionToken: ''},
    {type: 'finto', from: {}, queryFormat: '', url: ''}
  ],
  linkDataHarvesterApiProfileId: '',
  linkDataHarvesterValidationFilters: [{changes: {}}]
};

// Find hosts from oai-pmh
export const testEpic = {
  hostRecordHarvestConfig: baseOaiPmhAuthNamesHostRecordHarvestConfig,
  hostRecordValidationFilters: {
    fieldsPresent: ['^100$'],
    subfieldExclusion: [{tag: '^100$', subfields: [{code: 't'}]}],
    fieldStructure: [{tag: '^040$', subfields: {d: {pattern: '^(?:FI-NLD)$'}}}]
  },
  linkDataHarvesterConfig: [baseSruAuthorHarvesterConfig],
  linkDataHarvesterApiProfileId: 'foo',
  linkDataHarvesterValidationFilters: [
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '100', value: 'collect'}
      },
      fieldsPresent: ['^100$'],
      fieldStructure: [{tag: '^SID$', subfields: {b: {pattern: '^(?:viola)'}}}],
      subfieldExclusion: [{tag: '^100$', subfields: [{code: '0'}]}],
      changes: [
        {
          from: {tag: '001', value: 'value'}, // From host record
          to: {
            tag: '100', value: {code: '0'}, format: `(FIN11)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '100', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    },
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '600', value: 'collect'}
      },
      fieldsPresent: ['^600$'],
      fieldStructure: [{tag: '^SID$', subfields: {'b': {pattern: '^(?:viola)$'}}}],
      subfieldExclusion: [{tag: '^600$', subfields: [{code: '0'}]}],
      changes: [
        {

          from: {tag: '001', value: 'value'}, // From host record
          to: {
            tag: '600', value: {code: '0'}, format: `(FIN11)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '600', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    },
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '700', value: 'collect'}
      },
      fieldsPresent: ['^700$'],
      fieldStructure: [{tag: '^SID$', subfields: {'b': {pattern: '^(?:viola)$'}}}],
      subfieldExclusion: [{tag: '^700$', subfields: [{code: '0'}]}],
      changes: [
        {

          from: {tag: '001', value: 'value'}, // From host record
          to: {
            tag: '700', value: {code: '0'}, format: `(FIN11)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '700', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    }
  ]
};

// Find hosts from sru by id
export const testEpic2 = {
  hostRecordHarvestConfig: {
    type: 'sru',
    list: ['000015523'],
    queryFormat: 'rec.id=%s',
    url: 'https://sru.api.melinda-test.kansalliskirjasto.fi/bib',
    offset: 0
  },
  hostRecordValidationFilters: {
    fieldsPresent: ['100$'],
    subfieldExclusion: [{tag: '100$', subfields: [{code: 't'}]}],
    fieldStructure: [{tag: '040$', subfields: {'d': {pattern: '(?:FI-NLD)$'}}}]
  },
  linkDataHarvesterConfig: [baseSruAuthorHarvesterConfig],
  linkDataHarvesterApiProfileId: 'foo',
  linkDataHarvesterValidationFilters: [
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '100', value: 'collect'}
      },
      fieldsPresent: ['100$'],
      fieldStructure: [{tag: 'SID$', subfields: {'b': {pattern: '(?:viola)$'}}}],
      subfieldExclusion: [{tag: '100$', subfields: [{code: '0'}]}],
      changes: [
        {
          from: {tag: '001', value: 'value'}, // From host record
          to: {
            tag: '100', value: {code: '0'}, format: `(FIN11)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '100', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    },
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '600', value: 'collect'}
      },
      fieldsPresent: ['600$'],
      fieldStructure: [{tag: 'SID$', subfields: {'b': {pattern: '(?:viola)$'}}}],
      subfieldExclusion: [{tag: '600$', subfields: [{code: '0'}]}],
      changes: [
        {
          from: {tag: '001', value: 'value'}, // From host record
          to: {
            tag: '600', value: {code: '0'}, format: `(FIN11)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '600', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    },
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '700', value: 'collect'}
      },
      fieldsPresent: ['700$'],
      fieldStructure: [{tag: 'SID$', subfields: {'b': {pattern: '(?:viola)$'}}}],
      subfieldExclusion: [{tag: '700$', subfields: [{code: '0'}]}],
      changes: [
        {

          from: {tag: '001', value: 'value'}, // From host record
          to: {
            tag: '700', value: {code: '0'}, format: `(FIN11)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '700', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    }
  ]
};

// Harvest hosts from file
export const testEpic3 = {
  hostRecordHarvestConfig: {
    type: 'file',
    location: 'mallitietueet/test.json'
  },
  hostRecordValidationFilters: {
    fieldsPresent: ['100$'],
    subfieldExclusion: [{tag: '100$', subfields: [{code: 't'}]}],
    fieldStructure: [{tag: '040$', subfields: {'d': {pattern: '(?:FI-NLD)$'}}}]
  },
  linkDataHarvesterConfig: [baseSruAuthorHarvesterConfig],
  linkDataHarvesterApiProfileId: 'foo',
  linkDataHarvesterValidationFilters: [
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '100', value: 'collect'}
      },
      fieldsPresent: ['100$'],
      fieldStructure: [{tag: 'SID$', subfields: {'b': {pattern: '(?:viola)$'}}}],
      subfieldExclusion: [{tag: '100$', subfields: [{code: '0'}]}],
      changes: [
        {
          from: {tag: '001', value: 'value'}, // From host record
          to: {
            tag: '100', value: {code: '0'}, format: `(FIN11)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '100', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    },
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '600', value: 'collect'}
      },
      fieldsPresent: ['600$'],
      fieldStructure: [{tag: 'SID$', subfields: {'b': {pattern: '(?:viola)$'}}}],
      subfieldExclusion: [{tag: '600$', subfields: [{code: '0'}]}],
      changes: [
        {

          from: {tag: '001', value: 'value'}, // From host record
          to: {
            tag: '600', value: {code: '0'}, format: `(FIN11)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '600', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    },
    {
      if: {
        collect: ['a', 'b', 'c', 'd', 'q'],
        from: {tag: '100', value: 'collect'},
        to: {tag: '700', value: 'collect'}
      },
      fieldsPresent: ['700$'],
      fieldStructure: [{tag: 'SID$', subfields: {'b': {pattern: '(?:viola)$'}}}],
      subfieldExclusion: [{tag: '700$', subfields: [{code: '0'}]}],
      changes: [
        {

          from: {tag: '001', value: 'value'}, // From host record
          to: {
            tag: '700', value: {code: '0'}, format: `(FIN11)%s`, where: {
              collect: ['a', 'b', 'c', 'd', 'q'],
              from: {tag: '100', value: 'collect'},
              to: {tag: '700', value: 'collect'}
            }
          }, // To result record
          order: ['a', 'c', 'q', 'd', 'e', '0'] // Subfield sort order after modify
        }
      ]
    }
  ]
};

// Find YSOs
export const testEpic1 = {
  hostRecordHarvestConfig: baseOaiPmhBibHostRecordHarvestConfig,
  hostRecordValidationFilters: {
    fieldStructure: [{tag: '650$', subfields: {'2': {pattern: '(?:yso/)'}}}]
  },
  linkDataHarvesterConfig: [baseFintoHarvesterConfig],
  linkDataHarvesterApiProfileId: 'foo',
  linkDataHarvesterValidationFilters: [
    {
      changes: [
        {
          add: {tag: '650', ind1: ' ', ind2: '7', subfields: [{code: 'a', value: '%s'}, {code: '2', value: 'yso/%s'}, {code: '0', value: 'http://www.yso.fi/onto/yso/%s'}]}, // To result record
          order: ['a', '2', '0'],
          duplicateFilterCodes: ['2', '0']
        }
      ]
    }
  ]
};
