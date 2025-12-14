import { MultiplayerApi } from "./MultiplayerApi.js";

let api = null;

export async function initHost(url = 'wss://pedrochat.se/net') {
	api = new MultiplayerApi(url);
	const { session } = await api.host();
	return { api, sessionId: session };
}

export async function initJoin(sessionId, data = {}, url = 'wss://pedrochat.se/net') {
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