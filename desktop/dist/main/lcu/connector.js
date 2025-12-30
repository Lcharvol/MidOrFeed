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
exports.lcuConnector = exports.LCUConnector = void 0;
const fs = __importStar(require("fs"));
const https = __importStar(require("https"));
// Lockfile paths by platform
const LOCKFILE_PATHS = {
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
class LCUConnector {
    credentials = null;
    statusCallbacks = [];
    pollInterval = null;
    isPolling = false;
    constructor() {
        // Disable certificate verification for LCU's self-signed cert
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    onStatusChange(callback) {
        this.statusCallbacks.push(callback);
        return () => {
            this.statusCallbacks = this.statusCallbacks.filter((cb) => cb !== callback);
        };
    }
    emitStatus(status) {
        this.statusCallbacks.forEach((cb) => cb(status));
    }
    startPolling() {
        if (this.isPolling)
            return;
        this.isPolling = true;
        this.emitStatus('connecting');
        this.pollInterval = setInterval(() => {
            this.tryConnect();
        }, 2000);
        // Try immediately
        this.tryConnect();
    }
    stopPolling() {
        this.isPolling = false;
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    async tryConnect() {
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
            }
            else {
                this.credentials = null;
                this.emitStatus('disconnected');
            }
        }
        catch (error) {
            console.error('LCU connection error:', error);
            this.credentials = null;
            this.emitStatus('error');
        }
    }
    findLockfile() {
        const paths = LOCKFILE_PATHS[process.platform] || [];
        for (const lockfilePath of paths) {
            if (fs.existsSync(lockfilePath)) {
                return lockfilePath;
            }
        }
        return null;
    }
    parseLockfile(lockfilePath) {
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
        }
        catch (error) {
            console.error('Failed to parse lockfile:', error);
            return null;
        }
    }
    testConnection(credentials) {
        return new Promise((resolve) => {
            const auth = Buffer.from(`riot:${credentials.password}`).toString('base64');
            const options = {
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
    getCredentials() {
        return this.credentials;
    }
    isConnected() {
        return this.credentials !== null;
    }
    getBaseUrl() {
        if (!this.credentials)
            return null;
        return `https://127.0.0.1:${this.credentials.port}`;
    }
    getAuthHeader() {
        if (!this.credentials)
            return null;
        return `Basic ${Buffer.from(`riot:${this.credentials.password}`).toString('base64')}`;
    }
}
exports.LCUConnector = LCUConnector;
// Singleton instance
exports.lcuConnector = new LCUConnector();
//# sourceMappingURL=connector.js.map