"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.lcuAPI = void 0;
const https = __importStar(require("https"));
const connector_1 = require("./connector");
class LCUAPI {
    request(method, path, body) {
        return new Promise((resolve, reject) => {
            const baseUrl = connector_1.lcuConnector.getBaseUrl();
            const authHeader = connector_1.lcuConnector.getAuthHeader();
            if (!baseUrl || !authHeader) {
                reject(new Error('LCU not connected'));
                return;
            }
            const credentials = connector_1.lcuConnector.getCredentials();
            if (!credentials) {
                reject(new Error('No credentials'));
                return;
            }
            const options = {
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
                                resolve(JSON.parse(data));
                            }
                            else {
                                resolve(undefined);
                            }
                        }
                        else {
                            reject(new Error(`LCU API error: ${res.statusCode} - ${data}`));
                        }
                    }
                    catch (e) {
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
    async getCurrentSummoner() {
        try {
            return await this.request('GET', '/lol-summoner/v1/current-summoner');
        }
        catch {
            return null;
        }
    }
    // Game flow endpoints
    async getGameFlowPhase() {
        try {
            return await this.request('GET', '/lol-gameflow/v1/gameflow-phase');
        }
        catch {
            return 'None';
        }
    }
    // Champion select endpoints
    async getChampSelectSession() {
        try {
            return await this.request('GET', '/lol-champ-select/v1/session');
        }
        catch {
            return null;
        }
    }
    // Runes endpoints
    async getRunePages() {
        try {
            return await this.request('GET', '/lol-perks/v1/pages');
        }
        catch {
            return [];
        }
    }
    async createRunePage(runePage) {
        try {
            // First, try to delete an existing page with the same name
            const existingPages = await this.getRunePages();
            const existingPage = existingPages.find((p) => p.name === runePage.name || p.name.startsWith('MidOrFeed'));
            if (existingPage && 'id' in existingPage) {
                await this.deleteRunePage(existingPage.id);
            }
            // Create the new page
            await this.request('POST', '/lol-perks/v1/pages', {
                ...runePage,
                current: true,
            });
            return true;
        }
        catch (error) {
            console.error('Failed to create rune page:', error);
            return false;
        }
    }
    async deleteRunePage(pageId) {
        try {
            await this.request('DELETE', `/lol-perks/v1/pages/${pageId}`);
            return true;
        }
        catch {
            return false;
        }
    }
    // Lobby endpoints
    async getLobby() {
        try {
            return await this.request('GET', '/lol-lobby/v2/lobby');
        }
        catch {
            return null;
        }
    }
}
exports.lcuAPI = new LCUAPI();
//# sourceMappingURL=api.js.map