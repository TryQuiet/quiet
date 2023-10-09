import {
  communities,
  identity,
  users,
  errors,
  messages,
  publicChannels,
  connection,
  settings,
  files,
  StoreKeys as StateManagerStoreKeys,
  Store,
  network,
} from '@quiet/state-manager'
import { StoreKeys } from '../store/store.keys'
import { combineReducers, createStore, applyMiddleware } from 'redux'
import createSagaMiddleware, { Saga, SagaMonitor as SagaMonitorType, Task } from 'redux-saga'
import thunk from 'redux-thunk'
import rootSaga from '../sagas/index.saga'
import { reducer as appReducer } from '../store/handlers/app'
import { socketActions, socketReducer } from '../sagas/socket/socket.slice'
import { modalsReducer } from '../sagas/modals/modals.slice'
import { navigationReducer } from '../store/navigation/navigation.slice'
import MockedSocket from 'socket.io-mock'
import { fork, delay, call, put } from 'typed-redux-saga'

export const reducers = {
  [StateManagerStoreKeys.Communities]: communities.reducer,
  [StateManagerStoreKeys.Identity]: identity.reducer,
  [StateManagerStoreKeys.Users]: users.reducer,
  [StateManagerStoreKeys.Errors]: errors.reducer,
  [StateManagerStoreKeys.Messages]: messages.reducer,
  [StateManagerStoreKeys.PublicChannels]: publicChannels.reducer,
  [StateManagerStoreKeys.Connection]: connection.reducer,
  [StateManagerStoreKeys.Settings]: settings.reducer,
  [StateManagerStoreKeys.Files]: files.reducer,
  [StateManagerStoreKeys.Network]: network.reducer,
  [StoreKeys.App]: appReducer,
  [StoreKeys.Socket]: socketReducer,
  [StoreKeys.Modals]: modalsReducer,
  [StoreKeys.Navigation]: navigationReducer,
}

interface Options {
  effectId: number
  parentEffectId: number
  label?: string
  effect: any
  result: any
}

export interface PrepareStore {
  store: Store
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

  effectTriggered: SagaMonitorType['effectTriggered'] = (options: Options) => {
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
  // Fork State manager's sagas (require mocked socket.io-client)
  if (mockedSocket) {
    sagaMiddleware.run(rootSaga)
    // Mock socket connected event
    await sagaMiddleware.run(mockSocketConnectionSaga, mockedSocket).toPromise()
  }

  return {
    store,
    runSaga: sagaMiddleware.run,
    sagaMonitor,
  }
}

function* mockSocketConnectionSaga(socket: MockedSocket): Generator {
  yield* fork(function* (): Generator {
    yield* delay(1000)
    yield* call(() => {
      socket.socketClient.emit('connect')
    })
  })
  yield* put(socketActions.startConnection({ dataPort: 4677, socketIOToken: 'testToken' }))
}
