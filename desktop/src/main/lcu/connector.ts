import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import type { LCUCredentials, LCUConnectionStatus } from '../../shared/types';

// Lockfile paths by platform
const LOCKFILE_PATHS: Record<string, string[]> = {
  win32: [
    'C:\\Riot Games\\League of Legends\\lockfile',
    'D:\\Riot Games\\League of Legends\\lockfile',
    'C:\\Program Files\\Riot Games\\League of Legends\\lockfile',
    'D:\\Program Files\\Riot Games\\League of Legends\\lockfile',
  ],
  darwin: [
    '/Applications/League of Legends.app/Contents/LoL/lockfile',
  ],
};

export class LCUConnector {
  private credentials: LCUCredentials | null = null;
  private statusCallbacks: ((status: LCUConnectionStatus) => void)[] = [];
  private pollInterval: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor() {
    // Disable certificate verification for LCU's self-signed cert
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  onStatusChange(callback: (status: LCUConnectionStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter((cb) => cb !== callback);
    };
  }

  private emitStatus(status: LCUConnectionStatus): void {
    this.statusCallbacks.forEach((cb) => cb(status));
  }

  startPolling(): void {
    if (this.isPolling) return;
    this.isPolling = true;
    this.emitStatus('connecting');

    this.pollInterval = setInterval(() => {
      this.tryConnect();
    }, 2000);

    // Try immediately
    this.tryConnect();
  }

  stopPolling(): void {
    this.isPolling = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async tryConnect(): Promise<void> {
    const lockfilePath = this.findLockfile();
    if (!lockfilePath) {
      this.credentials = null;
      this.emitStatus('disconnected');
      return;
    }

    try {
      const credentials = this.parseLockfile(lockfilePath);
      if (!credentials) {
        this.credentials = null;
        this.emitStatus('disconnected');
        return;
      }

      // Verify connection by making a test request
      const isConnected = await this.testConnection(credentials);
      if (isConnected) {
        this.credentials = credentials;
        this.emitStatus('connected');
      } else {
        this.credentials = null;
        this.emitStatus('disconnected');
      }
    } catch (error) {
      console.error('LCU connection error:', error);
      this.credentials = null;
      this.emitStatus('error');
    }
  }

  private findLockfile(): string | null {
    const paths = LOCKFILE_PATHS[process.platform] || [];
    for (const lockfilePath of paths) {
      if (fs.existsSync(lockfilePath)) {
        return lockfilePath;
      }
    }
    return null;
  }

  private parseLockfile(lockfilePath: string): LCUCredentials | null {
    try {
      const content = fs.readFileSync(lockfilePath, 'utf-8');
      // Format: LeagueClient:pid:port:password:protocol
      const [, pid, port, password, protocol] = content.split(':');

      if (!port || !password || !protocol) {
        return null;
      }

      return {
        port: parseInt(port, 10),
        password,
        protocol,
        pid: parseInt(pid, 10),
      };
    } catch (error) {
      console.error('Failed to parse lockfile:', error);
      return null;
    }
  }

  private testConnection(credentials: LCUCredentials): Promise<boolean> {
    return new Promise((resolve) => {
      const auth = Buffer.from(`riot:${credentials.password}`).toString('base64');

      const options: https.RequestOptions = {
        hostname: '127.0.0.1',
        port: credentials.port,
        path: '/lol-summoner/v1/current-summoner',
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
        rejectUnauthorized: false,
      };

      const req = https.request(options, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  getCredentials(): LCUCredentials | null {
    return this.credentials;
  }

  isConnected(): boolean {
    return this.credentials !== null;
  }

  getBaseUrl(): string | null {
    if (!this.credentials) return null;
    return `https://127.0.0.1:${this.credentials.port}`;
  }

  getAuthHeader(): string | null {
    if (!this.credentials) return null;
    return `Basic ${Buffer.from(`riot:${this.credentials.password}`).toString('base64')}`;
  }
}

// Singleton instance
export const lcuConnector = new LCUConnector();
