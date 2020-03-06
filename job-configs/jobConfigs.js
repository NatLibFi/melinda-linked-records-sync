/*
    example = {
    Needed?
    "oai_pmh_root": "bib",
    "oai_pmh_format": "marc21" or "melinda_marc",

    Tags to be migrated
    "tags": ["100", "110", "350"],

    Set record ids to be migrated:
    Empty defaults to all records starting from 000000001 ->
    To do migration to specific id/s:
    "ids": ["000015418","002015419","010015420","000215421","010015422","008015423","000915424","000015425","003015426","010215427"]
    Range:
    "fromTo": {"start": 15408, "end": 15448}
    }
*/

export const configs = {
    default: {
        "oai_pmh_root": "bib",
        "oai_pmh_format": "melinda_marc",
        "tags": ["100", "110", "350"]
    },
    test1: {
        "fromTo": {"start": 15408, "end": 15448},
        "oai_pmh_root": "bib",
        "oai_pmh_format": "melinda_marc"
    },
    test2: {
        "ids": ["000015418", "002015419", "010015420", "000215421", "010015422", "008015423", "000915424", "000015425", "003015426", "010215427"],
        "oai_pmh_root": "bib",
        "oai_pmh_format": "melinda_marc",
        "tags": ["100", "110", "350"]
    }
}