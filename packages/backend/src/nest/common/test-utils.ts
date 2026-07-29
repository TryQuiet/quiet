import { Test, TestingModule } from '@nestjs/testing'
import { TestModule } from './test.module'
import {
  generateLibp2pPSK,
  getLocalLibp2pInstanceParams,
  getInMemoryLibp2pInstanceParams,
  libp2pInstanceParams,
} from './utils'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { Libp2pEvents, Libp2pNodeParams } from '../libp2p/libp2p.types'
import { createLogger } from './logger'
import { Libp2pService } from '../libp2p/libp2p.service'
import { ConnectionsManagerModule } from '../connections-manager/connections-manager.module'
import { StorageModule } from '../storage/storage.module'
import { IpfsModule } from '../ipfs/ipfs.module'
import { SigChainService } from '../auth/sigchain.service'
import { AdmissionCandidate } from '../admission/admission.types'

const logger = createLogger('libp2p:test-utils')

const attachDirectAdmissionPersistence = async (module: TestingModule, libp2pService: Libp2pService): Promise<void> => {
  const sigChainService = await module.resolve(SigChainService)
  libp2pService.on(Libp2pEvents.ADMISSION_CANDIDATE, (candidate: AdmissionCandidate) => {
    candidate.deferUntilPersisted(sigChainService.saveChain(candidate.teamId))
  })
}

export const attachEventListeners = (libp2pService: Libp2pService, timeline: string[], instanceName: string) => {
  // loop over all enum Libp2pEvents and attach event listeners
  for (const event of Object.values(Libp2pEvents)) {
    if (event === Libp2pEvents.AUTH_STATE_CHANGED) {
      libp2pService.on(event, (state: any) => {
        timeline.push(`${event}:${state}`)
      })
    } else {
      libp2pService.on(event, () => {
        timeline.push(`${event}`)
      })
    }
  }
}

export const spawnTestModules = async (number: number) => {
  const modules = []
  for (let i = 0; i < number; i++) {
    const module = await Test.createTestingModule({
      imports: [TestModule, Libp2pModule, StorageModule, ConnectionsManagerModule, IpfsModule],
    }).compile()
    modules.push(module)
  }
  logger.info(`created ${modules.length} test modules`)
  return modules
}

export const spawnLibp2pInstances = async (
  modules: TestingModule[],
  customLibp2pInstanceParams?: Libp2pNodeParams,
  sharePsk: boolean = true
) => {
  logger.info(`creating ${modules.length} libp2p instances`)
  const singlePSK = generateLibp2pPSK().fullKey
  const libp2pServices = []
  for (let i = 0; i < modules.length; i++) {
    logger.info(`creating libp2p instance ${i}`)
    const libp2pService = await modules[i].resolve(Libp2pService)
    const params = {
      ...(await getLocalLibp2pInstanceParams()),
      ...customLibp2pInstanceParams,
      instanceName: `instance${i}`,
    }
    if (sharePsk) {
      params.psk = singlePSK
    }
    logger.info(`creating libp2p instance with params:`, params)
    await attachDirectAdmissionPersistence(modules[i], libp2pService)
    await libp2pService.createInstance(params)
    libp2pServices.push(libp2pService)
  }
  logger.info(`created ${libp2pServices.length} libp2p instances`)
  return libp2pServices
}

export const spawnLibp2pInstancesInMemory = async (
  modules: TestingModule[],
  customLibp2pInstanceParams?: Libp2pNodeParams,
  sharePsk: boolean = true
): Promise<Libp2pNodeParams[]> => {
  logger.info(`creating ${modules.length} in-memory libp2p instances`)
  const singlePSK = generateLibp2pPSK().fullKey
  const libp2pServices = []
  const params: Libp2pNodeParams[] = []
  for (let i = 0; i < modules.length; i++) {
    logger.info(`creating in-memory libp2p instance ${i}`)
    const libp2pService = await modules[i].resolve(Libp2pService)
    const instanceParams = {
      ...(await getInMemoryLibp2pInstanceParams()),
      ...customLibp2pInstanceParams,
      instanceName: `instance${i}`,
    }
    if (sharePsk) {
      instanceParams.psk = singlePSK
    }
    logger.info(`creating in-memory libp2p instance with params:`, instanceParams)
    await attachDirectAdmissionPersistence(modules[i], libp2pService)
    await libp2pService.createInstance(instanceParams)
    libp2pServices.push(libp2pService)
    params.push(instanceParams)
  }
  logger.info(`created ${libp2pServices.length} in-memory libp2p instances`)
  return params
}

export const timelinesInclude = (timelines: string[][], event: string): boolean => {
  if (timelines.every(timeline => timeline.includes(event))) {
    return true
  }
  return false
}
