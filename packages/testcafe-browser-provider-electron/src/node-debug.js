import Promise from 'pinkie';
import { Socket } from 'net';
import promisifyEvent from 'promisify-event';
import EventEmitter from 'events';
import delay from './utils/delay';
import { connectionRetryDelay, maxConnectionRetryCount } from './constants';

const HEADER_SEPARATOR = '\r\n\r\n';
const HEADER_LINE_RE = /^([^:]+):\s+(.*)$/;

export default class NodeDebug {
    constructor (port = 5858, host = '127.0.0.1') {
        this.currentPacketNumber = 1;
        this.events              = new EventEmitter();
        this.port                = port;
        this.host                = host;
        this.socket              = new Socket();
        this.buffer              = Buffer.alloc(0);
        this.getPacketPromise    = Promise.resolve();
        this.sendPacketPromise   = Promise.resolve();

        this.nodeInfo = {
            v8Version:       '',
            protocolVersion: '',
            embeddingHost:   ''
        };
    }

    async _attemptToConnect (port, host) {
        this.socket.connect(port, host);

        var connectionPromise = Promise.race([
            promisifyEvent(this.socket, 'connect'),
            promisifyEvent(this.socket, 'error')
        ]);

        return await connectionPromise
            .then(() => true)
            .catch(() => {
                this.socket.removeAllListeners('connect');
                return delay(connectionRetryDelay);
            });
    }

    async _connectSocket (port, host) {
        var connected = await this._attemptToConnect(port, host);

        for (var i = 0; !connected && i < maxConnectionRetryCount; i++)
            connected = await this._attemptToConnect(port, host);

        if (!connected)
            throw new Error('Unable to connect');

        this.socket.on('data', data => this._handleNewData(data));
    }

    async _writeSocket (message) {
        if (!this.socket.write(message))
            await promisifyEvent(this.socket, 'drain');
    }

    _handleNewData (data) {
        this.buffer = Buffer.concat([this.buffer, data]);

        this.events.emit('new-data');
    }

    _getPacket () {
        this.getPacketPromise = this.getPacketPromise.then(async () => {
            var headerEndIndex = this.buffer.indexOf(HEADER_SEPARATOR);

            while (headerEndIndex < 0) {
                await promisifyEvent(this.events, 'new-data');

                headerEndIndex = this.buffer.indexOf('\r\n\r\n');
            }

            var packet = {
                headers: null,
                body:    null
            };

            packet.headers = this.buffer
                .toString('utf8', 0, headerEndIndex)
                .split('\r\n')
                .map(line => line.match(HEADER_LINE_RE))
                .reduce((obj, match) => {
                    obj[match[1].toLowerCase()] = match[2];

                    return obj;
                }, {});

            var contentLengthHeader = packet.headers['content-length'];
            var contentLength       = contentLengthHeader && parseInt(contentLengthHeader, 10) || 0;
            var bodyStartIndex      = headerEndIndex + HEADER_SEPARATOR.length;
            var bodyEndIndex        = bodyStartIndex + contentLength;

            if (contentLength) {
                while (this.buffer.length < bodyEndIndex)
                    await promisifyEvent(this.events, 'new-data');

                packet.body = JSON.parse(this.buffer.toString('utf8', bodyStartIndex, bodyEndIndex));
            }

            this.buffer = this.buffer.slice(bodyEndIndex);

            return packet;
        });

        return this.getPacketPromise;
    }

    _sendPacket (payload) {
        this.sendPacketPromise = this.sendPacketPromise.then(async () => {
            var body       = Object.assign({}, payload, { seq: this.currentPacketNumber++, type: 'request' });
            var serialized = JSON.stringify(body);
            var message    = 'Content-Length: ' + Buffer.byteLength(serialized, 'utf8') + HEADER_SEPARATOR + serialized;

            this._writeSocket(message);
        });

        return this.sendPacketPromise;
    }

    async connect () {
        await this._connectSocket(this.port, this.host);

        var infoPacket = await this._getPacket();

        this.nodeInfo = {
            v8Version:       infoPacket.headers['v8-version'],
            protocolVersion: infoPacket.headers['protocol-version'],
            embeddingHost:   infoPacket.headers['embedding-host']
        };
    }

    dispose () {
        this.socket.end();
        this.buffer = null;
    }

    async evaluate (expression) {
        var packetNumber = this.currentPacketNumber;

        await this._sendPacket({ command: 'evaluate', arguments: { expression: expression, 'disable_break': true } });

        var responsePacket = await this._getPacket();

        while (!responsePacket.body || responsePacket.body['request_seq'] !== packetNumber)
            responsePacket = await this._getPacket();

        return responsePacket;
    }
}

