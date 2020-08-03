/* eslint-disable no-unused-vars */

export function listToChunkList(list = []) {
	const chunks = [];
	while (list.length > 5) {
		chunks.push([...list.splice(0, 5)]);
	}

	chunks.push([...list]);
	return chunks;
}

export function createIdsFromTo(fromTo) {
	return Array.from({length: fromTo.end - fromTo.start}, (v, k) => String(k + fromTo.start));
}
