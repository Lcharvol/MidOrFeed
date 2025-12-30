"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lcuWebSocket = void 0;
const ws_1 = __importDefault(require("ws"));
const connector_1 = require("./connector");
class LCUWebSocket {
    ws = null;
    reconnectTimeout = null;
    callbacks = {
        gameflow: [],
        champselect: [],
        summoner: [],
    };
    connect() {
        const credentials = connector_1.lcuConnector.getCredentials();
        if (!credentials) {
            console.log('Cannot connect WebSocket: no LCU credentials');
            return;
        }
        if (this.ws) {
            this.disconnect();
        }
        const auth = Buffer.from(`riot:${credentials.password}`).toString('base64');
        try {
            this.ws = new ws_1.default(`wss://127.0.0.1:${credentials.port}`, {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
                rejectUnauthorized: false,
            });
            this.ws.on('open', () => {
                console.log('LCU WebSocket connected');
                // Subscribe to events
                this.subscribe();
            });
            this.ws.on('message', (data) => {
                this.handleMessage(data.toString());
            });
            this.ws.on('close', () => {
                console.log('LCU WebSocket closed');
                this.scheduleReconnect();
            });
            this.ws.on('error', (error) => {
                console.error('LCU WebSocket error:', error);
                this.scheduleReconnect();
            });
        }
        catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.scheduleReconnect();
        }
    }
    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
        }
    }
    subscribe() {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN)
            return;
        // Subscribe to all events using WAMP protocol
        // [5, "event_name"] - Subscribe message format
        const subscribeMessage = JSON.stringify([5, 'OnJsonApiEvent']);
        this.ws.send(subscribeMessage);
    }
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            // WAMP event message format: [8, "topic", payload]
            if (!Array.isArray(message) || message[0] !== 8)
                return;
            const payload = message[2];
            if (!payload || typeof payload !== 'object')
                return;
            const { uri, data: eventData } = payload;
            // Handle specific events
            if (uri === '/lol-gameflow/v1/gameflow-phase') {
                this.callbacks.gameflow.forEach((cb) => cb(eventData));
            }
            else if (uri === '/lol-champ-select/v1/session') {
                this.callbacks.champselect.forEach((cb) => cb(eventData));
            }
            else if (uri === '/lol-summoner/v1/current-summoner') {
                this.callbacks.summoner.forEach((cb) => cb(eventData));
            }
        }
        catch (error) {
            // Silently ignore parse errors for non-JSON messages
        }
    }
    scheduleReconnect() {
        if (this.reconnectTimeout)
            return;
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            if (connector_1.lcuConnector.isConnected()) {
                this.connect();
            }
        }, 3000);
    }
    // Event subscriptions
    onGameFlow(callback) {
        this.callbacks.gameflow.push(callback);
        return () => {
            this.callbacks.gameflow = this.callbacks.gameflow.filter((cb) => cb !== callback);
        };
    }
    onChampSelect(callback) {
        this.callbacks.champselect.push(callback);
        return () => {
            this.callbacks.champselect = this.callbacks.champselect.filter((cb) => cb !== callback);
        };
    }
    onSummoner(callback) {
        this.callbacks.summoner.push(callback);
        return () => {
            this.callbacks.summoner = this.callbacks.summoner.filter((cb) => cb !== callback);
        };
    }
    isConnected() {
        return this.ws !== null && this.ws.readyState === ws_1.default.OPEN;
    }
}
exports.lcuWebSocket = new LCUWebSocket();
//# sourceMappingURL=websocket.js.map