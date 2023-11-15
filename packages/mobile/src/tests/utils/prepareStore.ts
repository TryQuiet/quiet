import { combineReducers, createStore, applyMiddleware } from 'redux'
import createSagaMiddleware, { Saga, SagaMonitor as SagaMonitorType, Task } from 'redux-saga'
import thunk from 'redux-thunk'
import MockedSocket from 'socket.io-mock'
import { fork, delay, call, put } from 'typed-redux-saga'
import { reducers } from '../../store/root.reducer'
import { rootSaga } from '../../store/root.saga'
import { Store } from '../../store/store.types'
import { StoreKeys } from '../../store/store.keys'
import { initActions } from '../../store/init/init.slice'
import { StoreKeys as StateManagerStoreKeys } from '@quiet/state-manager'

interface Options {
  effectId: number
  parentEffectId: number
  label?: string
  effect: any
  result?: any
}

export interface PrepareStore {
  store: Store
  root: Task | null
  runSaga: <S extends Saga<any[]>>(saga: S, ...args: Parameters<S>) => Task
  sagaMonitor: SagaMonitor
}

class SagaMonitor {
  effectsTriggeredArray
  effectsResolvedArray
  constructor() {
    this.effectsTriggeredArray = new Map<number, Options>()
    this.effectsResolvedArray = new Map<number, Options>()
  }

  effectTriggered: SagaMonitorType['effectTriggered'] = options => {
    this.effectsTriggeredArray.set(options.effectId, options)
  }

  effectResolved: SagaMonitorType['effectResolved'] = (effectId: number, result) => {
    const triggeredEffect = this.effectsTriggeredArray.get(effectId)
    if (!triggeredEffect) return
    this.effectsResolvedArray.set(effectId, { ...triggeredEffect, result })
  }

  public isEffectResolved = (effectName: string) => {
    const parentEffect = Array.from(this.effectsResolvedArray).filter(effect => {
      return effect[1].result?.meta?.name === effectName
    })
    const childrenEffects = Array.from(this.effectsResolvedArray).filter(effect => {
      return effect[1].parentEffectId === parentEffect[0][0]
    })
    return childrenEffects.filter(effect => {
      return effect[1].result === '@@redux-saga/TERMINATE'
    }).length
  }
}

export const prepareStore = async (
  mockedState?: { [key in StoreKeys | StateManagerStoreKeys]?: any },
  mockedSocket?: MockedSocket
): Promise<PrepareStore> => {
  const combinedReducers = combineReducers(reducers)

  const sagaMonitor = new SagaMonitor()
  const sagaMiddleware = createSagaMiddleware({
    sagaMonitor,
  })

  const store = createStore(combinedReducers, mockedState, applyMiddleware(...[sagaMiddleware, thunk]))

  let root: Task | null = null
  // Fork State manager's sagas (require mocked socket.io-client)
  if (mockedSocket) {
    root = sagaMiddleware.run(rootSaga)

    // This step is important (mobile-specific) due to combination of state-manager and local store structures
    sagaMiddleware.run(mockStoreReadySignal)

    // Mock socket connected event
    await sagaMiddleware.run(mockSocketConnectionSaga, mockedSocket).toPromise()
  }

  return {
    store,
    root,
    runSaga: sagaMiddleware.run,
    sagaMonitor,
  }
}

function* mockStoreReadySignal(): Generator {
  yield* put(initActions.setStoreReady())
}

function* mockSocketConnectionSaga(socket: MockedSocket): Generator {
  yield* fork(function* (): Generator {
    yield* delay(1000)
    yield* call(() => {
      socket.socketClient.emit('connect')
    })
  })
  yield* put(initActions.startWebsocketConnection({ dataPort: 4677 }))
}
