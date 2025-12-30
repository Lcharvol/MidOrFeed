import WebSocket from 'ws';
import { lcuConnector } from './connector';
import type { GameFlowPhase, ChampSelectSession, CurrentSummoner } from '../../shared/types';

type LCUEvent = [number, string, { uri: string; eventType: string; data: unknown }];

type EventCallbacks = {
  gameflow: ((phase: GameFlowPhase) => void)[];
  champselect: ((session: ChampSelectSession | null) => void)[];
  summoner: ((summoner: CurrentSummoner | null) => void)[];
};

class LCUWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private callbacks: EventCallbacks = {
    gameflow: [],
    champselect: [],
    summoner: [],
  };

  connect(): void {
    const credentials = lcuConnector.getCredentials();
    if (!credentials) {
      console.log('Cannot connect WebSocket: no LCU credentials');
      return;
    }

    if (this.ws) {
      this.disconnect();
    }

    const auth = Buffer.from(`riot:${credentials.password}`).toString('base64');

    try {
      this.ws = new WebSocket(`wss://127.0.0.1:${credentials.port}`, {
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
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
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

  private subscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Subscribe to all events using WAMP protocol
    // [5, "event_name"] - Subscribe message format
    const subscribeMessage = JSON.stringify([5, 'OnJsonApiEvent']);
    this.ws.send(subscribeMessage);
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as LCUEvent;

      // WAMP event message format: [8, "topic", payload]
      if (!Array.isArray(message) || message[0] !== 8) return;

      const payload = message[2];
      if (!payload || typeof payload !== 'object') return;

      const { uri, data: eventData } = payload;

      // Handle specific events
      if (uri === '/lol-gameflow/v1/gameflow-phase') {
        this.callbacks.gameflow.forEach((cb) => cb(eventData as GameFlowPhase));
      } else if (uri === '/lol-champ-select/v1/session') {
        this.callbacks.champselect.forEach((cb) => cb(eventData as ChampSelectSession | null));
      } else if (uri === '/lol-summoner/v1/current-summoner') {
        this.callbacks.summoner.forEach((cb) => cb(eventData as CurrentSummoner | null));
      }
    } catch (error) {
      // Silently ignore parse errors for non-JSON messages
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (lcuConnector.isConnected()) {
        this.connect();
      }
    }, 3000);
  }

  // Event subscriptions
  onGameFlow(callback: (phase: GameFlowPhase) => void): () => void {
    this.callbacks.gameflow.push(callback);
    return () => {
      this.callbacks.gameflow = this.callbacks.gameflow.filter((cb) => cb !== callback);
    };
  }

  onChampSelect(callback: (session: ChampSelectSession | null) => void): () => void {
    this.callbacks.champselect.push(callback);
    return () => {
      this.callbacks.champselect = this.callbacks.champselect.filter((cb) => cb !== callback);
    };
  }

  onSummoner(callback: (summoner: CurrentSummoner | null) => void): () => void {
    this.callbacks.summoner.push(callback);
    return () => {
      this.callbacks.summoner = this.callbacks.summoner.filter((cb) => cb !== callback);
    };
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const lcuWebSocket = new LCUWebSocket();
