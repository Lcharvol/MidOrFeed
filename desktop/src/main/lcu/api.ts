import * as https from 'https';
import { lcuConnector } from './connector';
import type { CurrentSummoner, ChampSelectSession, RunePage } from '../../shared/types';

class LCUAPI {
  private request<T>(method: string, path: string, body?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const baseUrl = lcuConnector.getBaseUrl();
      const authHeader = lcuConnector.getAuthHeader();

      if (!baseUrl || !authHeader) {
        reject(new Error('LCU not connected'));
        return;
      }

      const credentials = lcuConnector.getCredentials();
      if (!credentials) {
        reject(new Error('No credentials'));
        return;
      }

      const options: https.RequestOptions = {
        hostname: '127.0.0.1',
        port: credentials.port,
        path,
        method,
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        rejectUnauthorized: false,
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              if (data) {
                resolve(JSON.parse(data) as T);
              } else {
                resolve(undefined as T);
              }
            } else {
              reject(new Error(`LCU API error: ${res.statusCode} - ${data}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  // Summoner endpoints
  async getCurrentSummoner(): Promise<CurrentSummoner | null> {
    try {
      return await this.request<CurrentSummoner>('GET', '/lol-summoner/v1/current-summoner');
    } catch {
      return null;
    }
  }

  // Game flow endpoints
  async getGameFlowPhase(): Promise<string> {
    try {
      return await this.request<string>('GET', '/lol-gameflow/v1/gameflow-phase');
    } catch {
      return 'None';
    }
  }

  // Champion select endpoints
  async getChampSelectSession(): Promise<ChampSelectSession | null> {
    try {
      return await this.request<ChampSelectSession>('GET', '/lol-champ-select/v1/session');
    } catch {
      return null;
    }
  }

  // Runes endpoints
  async getRunePages(): Promise<RunePage[]> {
    try {
      return await this.request<RunePage[]>('GET', '/lol-perks/v1/pages');
    } catch {
      return [];
    }
  }

  async createRunePage(runePage: RunePage): Promise<boolean> {
    try {
      // First, try to delete an existing page with the same name
      const existingPages = await this.getRunePages();
      const existingPage = existingPages.find(
        (p) => p.name === runePage.name || p.name.startsWith('MidOrFeed')
      );

      if (existingPage && 'id' in existingPage) {
        await this.deleteRunePage((existingPage as RunePage & { id: number }).id);
      }

      // Create the new page
      await this.request('POST', '/lol-perks/v1/pages', {
        ...runePage,
        current: true,
      });

      return true;
    } catch (error) {
      console.error('Failed to create rune page:', error);
      return false;
    }
  }

  async deleteRunePage(pageId: number): Promise<boolean> {
    try {
      await this.request('DELETE', `/lol-perks/v1/pages/${pageId}`);
      return true;
    } catch {
      return false;
    }
  }

  // Lobby endpoints
  async getLobby(): Promise<unknown> {
    try {
      return await this.request('GET', '/lol-lobby/v2/lobby');
    } catch {
      return null;
    }
  }
}

export const lcuAPI = new LCUAPI();
