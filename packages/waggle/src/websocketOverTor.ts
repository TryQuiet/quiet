import withIs from 'class-is'
import WebSockets from 'libp2p-websockets'

class WebsocketsOverTor extends WebSockets {
  _websocketOpts: any
  constructor({ upgrader, websocket }) {
    super({ upgrader })
    this._websocketOpts = websocket
  }

  async dial(ma, options = {}) {
    super.dial(ma, { websocket: this._websocketOpts, ...options });
  }
}

export default withIs(WebsocketsOverTor, {
  className: 'WebsocketsOverTor',
  symbolName: '@libp2p/js-libp2p-websockets/websockets',
});
