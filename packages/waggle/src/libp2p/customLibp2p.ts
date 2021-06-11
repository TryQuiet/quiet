import Libp2p from 'libp2p'
import PeerId from 'peer-id'
import debug from 'debug'

const log = Object.assign(debug('waggle:libp2p'), {
  error: debug('waggle:libp2p:err')
})

export interface Libp2pType extends CustomLibp2p, Libp2p {}

export default class CustomLibp2p extends Libp2p {
  [x: string]: any
  constructor (_options) {
    log('Using CustomLibp2p')
    super(_options)
  }

  /**
 * Will dial to the given `peerId` if the current number of
 * connected peers is less than the configured `ConnectionManager`
 * minConnections.
 *
 * Delete peer from PeerBook if dial fails.
 * TODO: to be removed when proper cleanup strategy is implemented in libp2p js (https://github.com/libp2p/js-libp2p/issues/639)
 *
 *
 * @private
 * @param {PeerId} peerId
 */
  async _maybeConnect (peerId: PeerId) {
    // If auto dialing is on and we have no connection to the peer, check if we should dial
    if (this._config.peerDiscovery.autoDial === true && !this.connectionManager.get(peerId)) {
      const minConnections = this._options.connectionManager.minConnections || 0
      if (minConnections > this.connectionManager.size) {
        log('connecting to discovered peer %s', peerId.toB58String())
        try {
          await this.dialer.connectToPeer(peerId)
          log(`Successfully dialed ${peerId.toB58String()}`)
        } catch (err) {
          log.error(`Could not connect to discovered peer ${peerId.toB58String()}`, err)
          if (err.message.includes('HostUnreachable')) {
            log(`Couldn't dial peer. Deleting peer ${peerId.toB58String()} from the peer store`)
            this.peerStore.delete(peerId)
          }
        }
      }
    }
  }
}
