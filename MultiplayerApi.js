// Wrapper för mpapi-main-klient till MultiplayerApi.js interface
import { mpapi } from './mpapi.js';

export class MultiplayerApi {
    constructor(serverUrl) {
        this.api = new mpapi(serverUrl, 'snake');
    }

    host() {
        return this.api.host();
    }

    join(sessionId, data) {
        return this.api.join(sessionId, data);
    }

    leave() {
        return this.api.leave();
    }

    game(data, destination = null) {
        return this.api.transmit(data, destination);
    }

    listen(callback) {
        return this.api.listen(callback);
    }
}
