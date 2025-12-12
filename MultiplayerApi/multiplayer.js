import { MultiplayerApi } from "./MultiplayerApi.js";

let api = null;

export async function initHost(url = 'ws://localhost:8080') {
	api = new MultiplayerApi(url);
	const { sessionId } = await api.host();
	return { api, sessionId };
}

export async function initJoin(sessionId, data = {}, url = 'ws://localhost:8080') {
	api = new MultiplayerApi(url);
	await api.join(sessionId, data);
	return { api };
}

export function listen(handler) {
	if (!api) throw new Error('API not initialized, call initHost or initJoin first');
	return api.listen(handler);
}

export function sendGame(data) {
	if (!api) throw new Error('API not initialized, call initHost or initJoin first');
	return api.game(data);
}