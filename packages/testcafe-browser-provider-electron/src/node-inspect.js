import remoteInterface from 'chrome-remote-interface';
import promisifyEvent from 'promisify-event';
import delay from './utils/delay';
import { connectionRetryDelay, maxConnectionRetryCount } from './constants';

export default class NodeInspect {
    constructor (port, host) {
        this.port        = port;
        this.host        = host;
        this.client      = null;
        this.callFrameId = null;
    }

    async _attemptToConnect (port, host) {
        return await remoteInterface({ host, port })
            .then(client => {
                this.client = client;
                return true;
            })
            .catch(() => delay(connectionRetryDelay));
    }

    async _connectRemoteInterface (port, host) {
        var connected = await this._attemptToConnect(port, host);

        for (var i = 0; !connected && i < maxConnectionRetryCount; i++)
            connected = await this._attemptToConnect(port, host);

        if (!connected)
            throw new Error('Unable to connect');
    }

    async _setupRemoteInterface () {
        await this.client.Debugger.enable();

        // NOTE: <= Electron v14.2.2
        await this.client.Debugger.setBreakpointByUrl({ lineNumber: 16, url: 'internal/main/run_main_module\.js' });
        // NOTE: >= Electron v15.0.0
        await this.client.Debugger.setBreakpointByUrl({ lineNumber: 16, url: 'node:internal/main/run_main_module' });

        var pausedEvent = promisifyEvent(this.client, 'Debugger.paused');

        await this.client.Runtime.runIfWaitingForDebugger();

        var { callFrames } = await pausedEvent;

        this.callFrameId = callFrames[0].callFrameId;
    }

    async connect () {
        await this._connectRemoteInterface(this.port, this.host);
        await this._setupRemoteInterface();
    }

    async evaluate (expression) {
        await this.client.Debugger.evaluateOnCallFrame({ callFrameId: this.callFrameId, expression: expression });
    }

    dispose () {
        this.client.close();
    }
}
