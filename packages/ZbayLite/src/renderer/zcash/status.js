import { DateTime } from 'luxon'
import BigNumber from 'bignumber.js'
const BLOCK_OFFSET = 10

const calculateStatus = (current, latest) => {
  if (latest && current >= latest - BLOCK_OFFSET) {
    return 'healthy'
  }
  return 'syncing'
}

export default (zcashClient) => {
  const getBestBlock = async () => {
    const bestBlockHash = await zcashClient.request.getbestblockhash()
    return zcashClient.request.getblock(bestBlockHash)
  }

  const getGenesisBlock = async () => {
    const genesisBlockHash = await zcashClient.request.getblockhash(0)
    return zcashClient.request.getblock(genesisBlockHash)
  }

  const estimateChainHeight = async () => {
    const [genesisBlock, bestBlock] = await Promise.all([
      getGenesisBlock(),
      getBestBlock()
    ])
    const genesisTime = new BigNumber(genesisBlock.time)
    const bestTime = new BigNumber(bestBlock.time)
    const bestHeight = new BigNumber(bestBlock.height)
    const avgTime = bestTime.minus(genesisTime).dividedToIntegerBy(bestHeight)
    const now = new BigNumber(DateTime.utc().toSeconds())
    const leftBlocks = now.minus(bestTime).dividedToIntegerBy(avgTime)
    return bestHeight.plus(leftBlocks)
  }

  const info = async () => {
    const [info, latestBlock] = await Promise.all([
      await zcashClient.request.getinfo(),
      await estimateChainHeight()
    ])
    const currentBlock = new BigNumber(info.blocks)
    const status = calculateStatus(currentBlock, latestBlock)
    return {
      isTestnet: info.testnet,
      status,
      latestBlock: latestBlock,
      currentBlock: currentBlock,
      connections: new BigNumber(info.connections)
    }
  }

  return {
    info
  }
}
