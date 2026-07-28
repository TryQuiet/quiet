/**
 * Implementation of Libp2p's ConnectionGater for conditionally denying inbound/outbound connections in p2p
 */
import type { ConnectionGater, MultiaddrConnection, PeerId } from '@libp2p/interface'
import { createLogger } from '../common/logger'
import type { Multiaddr } from '@multiformats/multiaddr'
import { Injectable } from '@nestjs/common'

@Injectable()
export class Libp2pConnectionGater {
  /**
   * True if we allow any connections
   */
  private _connectionsAllowed: boolean
  private logger = createLogger('libp2p:connection-gater')

  constructor() {
    this._connectionsAllowed = false
  }

  /**
   * Are connections currently allowed?
   */
  public get connectionsAllowed(): boolean {
    return this._connectionsAllowed
  }

  /**
   * Deny all inbound and outbound connections
   */
  public pauseConnections() {
    this.logger.debug(`Pausing connections - all incoming and outgoing connections will be denied!`)
    this._connectionsAllowed = false
  }

  /**
   * Allow all inbound and outbound connections (subject to any specific rules in `gaterImpl`)
   */
  public resumeConnections() {
    this.logger.debug(`Resuming connections`)
    this._connectionsAllowed = true
  }

  /**
   * Implementation of the ConnectionGater instance passed to Libp2p
   */
  public gaterImpl: ConnectionGater = {
    /**
     * denyDialPeer tests whether we're permitted to Dial the
     * specified peer.
     *
     * This is called by the dialer.connectToPeer implementation before
     * dialling a peer.
     *
     * Return true to prevent dialing the passed peer.
     */
    denyDialPeer: (peerId: PeerId): boolean => {
      this.logger.debug('denyDialPeer', this._areConnectionsPaused())
      if (this._areConnectionsPaused()) return true

      // add any specific logic here
      return false
    },

    /**
     * denyDialMultiaddr tests whether we're permitted to dial the specified
     * multiaddr.
     *
     * This is called by the connection manager - if the peer id of the remote
     * node is known it will be present in the multiaddr.
     *
     * Return true to prevent dialing the passed peer on the passed multiaddr.
     */
    denyDialMultiaddr: (multiaddr: Multiaddr): boolean => {
      this.logger.debug('denyDialMultiaddr', this._areConnectionsPaused())
      if (this._areConnectionsPaused()) return true

      // add any specific logic here
      return false
    },

    /**
     * denyInboundConnection tests whether an incipient inbound connection is allowed.
     *
     * This is called by the upgrader, or by the transport directly (e.g. QUIC,
     * Bluetooth), straight after it has accepted a connection from its socket.
     *
     * Return true to deny the incoming passed connection.
     */
    denyInboundConnection: (maConn: MultiaddrConnection): boolean => {
      this.logger.debug('denyInboundConnection', this._areConnectionsPaused())
      if (this._areConnectionsPaused()) return true

      // add any specific logic here
      return false
    },

    /**
     * denyOutboundConnection tests whether an incipient outbound connection is allowed.
     *
     * This is called by the upgrader, or by the transport directly (e.g. QUIC,
     * Bluetooth), straight after it has created a connection with its socket.
     *
     * Return true to deny the incoming passed connection.
     */
    denyOutboundConnection: (peerId: PeerId, maConn: MultiaddrConnection): boolean => {
      this.logger.debug('denyOutboundConnection', this._areConnectionsPaused())
      if (this._areConnectionsPaused()) return true

      // add any specific logic here
      return false
    },

    /**
     * denyInboundEncryptedConnection tests whether a given connection, now encrypted,
     * is allowed.
     *
     * This is called by the upgrader, after it has performed the security
     * handshake, and before it negotiates the muxer, or by the directly by the
     * transport, at the exact same checkpoint.
     *
     * Return true to deny the passed secured connection.
     */
    denyInboundEncryptedConnection: (peerId: PeerId, maConn: MultiaddrConnection): boolean => {
      this.logger.debug('denyInboundEncryptedConnection', this._areConnectionsPaused())
      if (this._areConnectionsPaused()) return true

      // add any specific logic here
      return false
    },

    /**
     * denyOutboundEncryptedConnection tests whether a given connection, now encrypted,
     * is allowed.
     *
     * This is called by the upgrader, after it has performed the security
     * handshake, and before it negotiates the muxer, or by the directly by the
     * transport, at the exact same checkpoint.
     *
     * Return true to deny the passed secured connection.
     */
    denyOutboundEncryptedConnection: (peerId: PeerId, maConn: MultiaddrConnection): boolean => {
      this.logger.debug('denyOutboundEncryptedConnection', this._areConnectionsPaused())
      if (this._areConnectionsPaused()) return true

      // add any specific logic here
      return false
    },

    /**
     * denyInboundUpgradedConnection tests whether a fully capable connection is allowed.
     *
     * This is called after encryption has been negotiated and the connection has been
     * multiplexed, if a multiplexer is configured.
     *
     * Return true to deny the passed upgraded connection.
     */
    denyInboundUpgradedConnection: (peerId: PeerId, maConn: MultiaddrConnection): boolean => {
      this.logger.debug('denyInboundUpgradedConnection', this._areConnectionsPaused())
      if (this._areConnectionsPaused()) return true

      // add any specific logic here
      return false
    },

    /**
     * denyOutboundUpgradedConnection tests whether a fully capable connection is allowed.
     *
     * This is called after encryption has been negotiated and the connection has been
     * multiplexed, if a multiplexer is configured.
     *
     * Return true to deny the passed upgraded connection.
     */
    denyOutboundUpgradedConnection: (peerId: PeerId, maConn: MultiaddrConnection): boolean => {
      this.logger.debug('denyOutboundUpgradedConnection', this._areConnectionsPaused())
      if (this._areConnectionsPaused()) return true

      // add any specific logic here
      return false
    },

    /**
     * denyInboundRelayReservation tests whether a remote peer is allowed make a
     * relay reservation on this node.
     *
     * Return true to deny the relay reservation.
     */
    denyInboundRelayReservation: (source: PeerId): boolean => {
      this.logger.debug('denyInboundRelayReservation', this._areConnectionsPaused())
      if (this._areConnectionsPaused()) return true

      // add any specific logic here
      return false
    },

    /**
     * denyOutboundRelayedConnection tests whether a remote peer is allowed to open a relayed
     * connection to the destination node.
     *
     * This is invoked on the relay server when a source client with a reservation instructs
     * the server to relay a connection to a destination peer.
     *
     * Return true to deny the relayed connection.
     */
    denyOutboundRelayedConnection: (source: PeerId, destination: PeerId): boolean => {
      this.logger.debug('denyOutboundRelayedConnection', this._areConnectionsPaused())
      if (this._areConnectionsPaused()) return true

      // add any specific logic here
      return false
    },

    /**
     * denyInboundRelayedConnection tests whether a remote peer is allowed to open a relayed
     * connection to this node.
     *
     * This is invoked on the relay client when a remote relay has received an instruction to
     * relay a connection to the client.
     *
     * Return true to deny the relayed connection.
     */
    denyInboundRelayedConnection: (relay: PeerId, remotePeer: PeerId): boolean => {
      this.logger.debug('denyInboundRelayedConnection', this._areConnectionsPaused())
      if (this._areConnectionsPaused()) return true

      // add any specific logic here
      return false
    },

    /**
     * Used by the address book to filter passed addresses.
     *
     * Return true to allow storing the passed multiaddr for the passed peer.
     */
    filterMultiaddrForPeer: (peer: PeerId, multiaddr: Multiaddr): boolean => {
      return true
    },
  }

  /**
   * Checks if connections are currently paused
   *
   * @returns True if all connections are paused
   */
  private _areConnectionsPaused(): boolean {
    if (this.connectionsAllowed) return false
    this.logger.debug('Connections are paused, this connection will be denied')
    return true
  }
}
