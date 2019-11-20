import {Utils} from '@natlibfi/melinda-commons';
import {isNumber} from 'util';

import {DEFAULT_TAGS, DEFAULT_OAI_PMH_ROOT, DEFAULT_FORMAT} from './config';

const {createLogger} = Utils;

export function validateConfFile(jsonConf) {
    const logger = createLogger();

    try {
        if (jsonConf.confType > 3 && jsonConf.confType < 0) {
            throw Error('Config file validation error: Unvalid confType!');
        }
        if (jsonConf.confType === 1) {
            if (!jsonConf.ids) {
                throw Error('Config file validation error: Missing JSON variable ids!');
            }
            if (jsonConf.ids.length < 1) {
                throw Error('Config file validation error: MIssing values from JSON variable ids!');
            }
        } else if (jsonConf.confType === 2) {
            if (!jsonConf.fromTo) {
                throw Error('Config file validation error: Missing JSON variable fromTo!');
            }
            if (!isNumber(jsonConf.fromTo.start)) {
                throw Error('Config file validation error: Unvalid value in JSON variable fromTo.start!');
            }
            if (!isNumber(jsonConf.fromTo.end)) {
                throw Error('Config file validation error: Unvalid value in JSON variable fromTo.end!');
            }
            if (jsonConf.fromTo.start > jsonConf.fromTo.end) {
                throw Error('Config file validation error: Unvalid variables in JSON valiable fromTo!');
            }
        }
    } catch (err) {
        logger.log('error', err);
        process.exit(0);
    }

    const opts = buildOpts(jsonConf);
    logger.log('info', `Conftype ${jsonConf.confType}, root: ${opts.root}, format: ${opts.format}, tags: ${opts.tags}`);
    return opts;

    function buildOpts(jsonConf) {
        return {
            root: getRoot(jsonConf),
            format: getFormat(jsonConf),
            tags: getTags(jsonConf)
        };
    }

    function getTags(jsonConf) {
        if (jsonConf.tags) {
            return jsonConf.tags;
        }

        return DEFAULT_TAGS;
    }

    function getRoot(jsonConf) {
        if (jsonConf.oai_pmh_root) {
            return jsonConf.oai_pmh_root;
        }

        return DEFAULT_OAI_PMH_ROOT;
    }

    function getFormat(jsonConf) {
        if (jsonConf.format) {
            return jsonConf.format;
        }

        return DEFAULT_FORMAT;
    }
}