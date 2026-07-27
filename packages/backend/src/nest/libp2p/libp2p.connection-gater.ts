import type { ConnectionGater, MultiaddrConnection, PeerId } from '@libp2p/interface'
import { createLogger } from '../common/logger'
import type { Multiaddr } from '@multiformats/multiaddr'
import { Injectable } from '@nestjs/common'

@Injectable()
export class Libp2pConnectionGater implements ConnectionGater {
  private _connectionsAllowed: boolean
  private logger = createLogger('libp2p:connection-gater')

  constructor() {
    this._connectionsAllowed = false
  }

  public get connectionsAllowed(): boolean {
    return this._connectionsAllowed
  }

  public pauseAllConnections() {
    this.logger.debug(`Pausing connections - all incoming and outgoing connections will be denied!`)
    this._connectionsAllowed = false
  }

  public allowConnections() {
    this.logger.debug(`Resuming connections`)
    this._connectionsAllowed = true
  }

  /**
   * denyDialPeer tests whether we're permitted to Dial the
   * specified peer.
   *
   * This is called by the dialer.connectToPeer implementation before
   * dialling a peer.
   *
   * Return true to prevent dialing the passed peer.
   */
  public denyDialPeer?(peerId: PeerId): boolean {
    if (this._areConnectionsPaused()) return true

    // add any specific logic here
    return false
  }

  /**
   * denyDialMultiaddr tests whether we're permitted to dial the specified
   * multiaddr.
   *
   * This is called by the connection manager - if the peer id of the remote
   * node is known it will be present in the multiaddr.
   *
   * Return true to prevent dialing the passed peer on the passed multiaddr.
   */
  public denyDialMultiaddr?(multiaddr: Multiaddr): boolean {
    if (this._areConnectionsPaused()) return true

    // add any specific logic here
    return false
  }

  /**
   * denyInboundConnection tests whether an incipient inbound connection is allowed.
   *
   * This is called by the upgrader, or by the transport directly (e.g. QUIC,
   * Bluetooth), straight after it has accepted a connection from its socket.
   *
   * Return true to deny the incoming passed connection.
   */
  public denyInboundConnection?(maConn: MultiaddrConnection): boolean {
    if (this._areConnectionsPaused()) return true

    // add any specific logic here
    return false
  }

  /**
   * denyOutboundConnection tests whether an incipient outbound connection is allowed.
   *
   * This is called by the upgrader, or by the transport directly (e.g. QUIC,
   * Bluetooth), straight after it has created a connection with its socket.
   *
   * Return true to deny the incoming passed connection.
   */
  public denyOutboundConnection?(peerId: PeerId, maConn: MultiaddrConnection): boolean {
    if (this._areConnectionsPaused()) return true

    // add any specific logic here
    return false
  }

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
  public denyInboundEncryptedConnection?(peerId: PeerId, maConn: MultiaddrConnection): boolean {
    if (this._areConnectionsPaused()) return true

    // add any specific logic here
    return false
  }

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
  public denyOutboundEncryptedConnection?(peerId: PeerId, maConn: MultiaddrConnection): boolean {
    if (this._areConnectionsPaused()) return true

    // add any specific logic here
    return false
  }

  /**
   * denyInboundUpgradedConnection tests whether a fully capable connection is allowed.
   *
   * This is called after encryption has been negotiated and the connection has been
   * multiplexed, if a multiplexer is configured.
   *
   * Return true to deny the passed upgraded connection.
   */
  public denyInboundUpgradedConnection?(peerId: PeerId, maConn: MultiaddrConnection): boolean {
    if (this._areConnectionsPaused()) return true

    // add any specific logic here
    return false
  }

  /**
   * denyOutboundUpgradedConnection tests whether a fully capable connection is allowed.
   *
   * This is called after encryption has been negotiated and the connection has been
   * multiplexed, if a multiplexer is configured.
   *
   * Return true to deny the passed upgraded connection.
   */
  public denyOutboundUpgradedConnection?(peerId: PeerId, maConn: MultiaddrConnection): boolean {
    if (this._areConnectionsPaused()) return true

    // add any specific logic here
    return false
  }

  /**
   * denyInboundRelayReservation tests whether a remote peer is allowed make a
   * relay reservation on this node.
   *
   * Return true to deny the relay reservation.
   */
  public denyInboundRelayReservation?(source: PeerId): boolean {
    if (this._areConnectionsPaused()) return true

    // add any specific logic here
    return false
  }

  /**
   * denyOutboundRelayedConnection tests whether a remote peer is allowed to open a relayed
   * connection to the destination node.
   *
   * This is invoked on the relay server when a source client with a reservation instructs
   * the server to relay a connection to a destination peer.
   *
   * Return true to deny the relayed connection.
   */
  public denyOutboundRelayedConnection?(source: PeerId, destination: PeerId): boolean {
    if (this._areConnectionsPaused()) return true

    // add any specific logic here
    return false
  }

  /**
   * denyInboundRelayedConnection tests whether a remote peer is allowed to open a relayed
   * connection to this node.
   *
   * This is invoked on the relay client when a remote relay has received an instruction to
   * relay a connection to the client.
   *
   * Return true to deny the relayed connection.
   */
  public denyInboundRelayedConnection?(relay: PeerId, remotePeer: PeerId): boolean {
    if (this._areConnectionsPaused()) return true

    // add any specific logic here
    return false
  }

  /**
   * Used by the address book to filter passed addresses.
   *
   * Return true to allow storing the passed multiaddr for the passed peer.
   */
  public filterMultiaddrForPeer?(peer: PeerId, multiaddr: Multiaddr): boolean {
    if (this._areConnectionsPaused()) return true

    // add any specific logic here
    return false
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
