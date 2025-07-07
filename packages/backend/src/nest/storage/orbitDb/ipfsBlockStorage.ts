/**
 * Forked from:
 * https://github.com/TryQuiet/orbitdb/blob/083429d94dbaa539576c6c93173e70760dca330e/src/storage/ipfs-block.js
 *
 * Adds an abort controller for more immediate aborts when not connected to providers.
 */

/**
 * @namespace Storage-IPFS
 * @memberof module:Storage
 * @description
 * IPFSBlockStorage uses IPFS to store data as raw blocks.
 */
import { CID } from 'multiformats/cid'
import { base58btc } from 'multiformats/bases/base58'
import drain from 'it-drain'
import { HeliaLibp2p } from 'helia'

interface IPFSBlockStorageParams {
  ipfs: HeliaLibp2p
  pin?: boolean
  timeout?: number
}

const DefaultTimeout = 30000 // 30 seconds

/**
 * Creates an instance of IPFSBlockStorage.
 * @function
 * @param {Object} params One or more parameters for configuring
 * IPFSBlockStorage.
 * @param {IPFS} params.ipfs An IPFS instance.
 * @param {boolean} [params.pin=false] True, if the block should be pinned,
 * false otherwise.
 * @param {number} [params.timeout=defaultTimeout] A timeout in ms.
 * @return {module:Storage.Storage-IPFS} An instance of IPFSBlockStorage.
 * @memberof module:Storage
 * @throw An instance of ipfs is required if params.ipfs is not specified.
 * @instance
 */
const IPFSBlockStorage = async ({ ipfs, pin, timeout }: IPFSBlockStorageParams = {} as IPFSBlockStorageParams) => {
  if (!ipfs) throw new Error('An instance of ipfs is required.')

  /**
   * Puts data to an IPFS block.
   * @function
   * @param {string} hash The hash of the block to put.
   * @param {*} data The data to store in the IPFS block.
   * @memberof module:Storage.Storage-IPFS
   * @instance
   */
  const put = async (hash: string, data: Uint8Array) => {
    const cid = CID.parse(hash, base58btc)
    const abortController = new AbortController()
    await ipfs.blockstore.put(cid, data, abortController)
    if (pin && !(await ipfs.pins.isPinned(cid))) {
      await drain(ipfs.pins.add(cid))
    }
  }

  const del = async (hash: string) => {}

  /**
   * Gets data from an IPFS block.
   * @function
   * @param {string} hash The hash of the block to get.
   * @return {Uint8Array} The block.
   * @memberof module:Storage.Storage-IPFS
   * @instance
   */
  const get = async (hash: string): Promise<Uint8Array | undefined> => {
    const cid = CID.parse(hash, base58btc)
    if (ipfs.libp2p.getConnections().length === 0) {
      return await ipfs.blockstore.get(cid, { offline: true })
    } else {
      const abortController = new AbortController()
      const timer = setTimeout(() => abortController.abort(), timeout ?? DefaultTimeout)
      const block = await ipfs.blockstore.get(cid, abortController)
      clearTimeout(timer)
      return block
    }
  }

  const iterator = async function* (): AsyncGenerator<any, void, unknown> {}

  const merge = async (other: any) => {}

  const clear = async (): Promise<void> => {}

  const close = async (): Promise<void> => {}

  return {
    put,
    del,
    get,
    iterator,
    merge,
    clear,
    close,
  }
}

export default IPFSBlockStorage
