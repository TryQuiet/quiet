import { jest } from '@jest/globals'
import EventEmitter from 'node:events'
import { QSSService } from './qss.service'
import { QSSAuthConnection } from './qss-auth-conn'
import { QSSEvents, QSSOperationResult } from './qss.types'
import { QSS_RECONNECT_DELAY_MS, QSS_RECONNECT_STABILITY_MS } from './qss.const'

describe('QSS admission and recovery boundaries', () => {
  let service: QSSService
  let client: EventEmitter
  let auth: EventEmitter
  beforeEach(() => {
    jest.useFakeTimers()
    client = new EventEmitter()
    auth = new EventEmitter()
    service = new QSSService(
      true,
      'wss://qss.example',
      client as any,
      auth as any,
      {} as any,
      {} as any,
      new EventEmitter() as any,
      new EventEmitter() as any
    )
    jest.spyOn(service, 'canConnect', 'get').mockReturnValue(true)
  })
  afterEach(() => {
    service['_clearReconnectTimer'](true)
    service['_teardownEventHandlers']()
    jest.useRealTimers()
  })

  it.each(['remote', 'sign-in', 'client-validation'] as const)(
    'uses the failure source, not an arbitrary remote code, for %s admission failure',
    source => {
      const fail = jest.fn()
      service['preparedAdmissions'].set('team', { context: { fail } } as any)
      auth.emit(QSSEvents.QSS_AUTH_ATTEMPT_FAILED, {
        teamId: 'team',
        code: 'REMOTE_CHOSEN_FATAL_ERROR',
        source,
        error: new Error('failed'),
        deviceAdmission: true,
      })
      expect(fail).toHaveBeenCalledWith(
        expect.objectContaining({ kind: source === 'client-validation' ? 'validation' : 'transport' })
      )
    }
  )

  it('notifies admission immediately when its underlying QSS socket disconnects', () => {
    const connection = new QSSAuthConnection({} as any, client as any)
    const fail = jest.fn()
    connection.admissionContext = { fail } as any
    connection['_onQssDisconnected']()
    expect(fail).toHaveBeenCalledWith(expect.objectContaining({ kind: 'transport' }))
  })

  it('grows backoff through authentication flaps and resets after a stable connection', () => {
    for (let flap = 0; flap < 4; flap++) {
      service['_markAuthenticated']()
      service['_scheduleReconnect'](QSSOperationResult.ERROR)
      expect(service['_reconnectDelayMs']).toBe(QSS_RECONNECT_DELAY_MS * 2 ** (flap + 1))
    }
    service['_markAuthenticated']()
    jest.advanceTimersByTime(QSS_RECONNECT_STABILITY_MS)
    service['_scheduleReconnect'](QSSOperationResult.ERROR)
    expect(service['_reconnectDelayMs']).toBe(QSS_RECONNECT_DELAY_MS * 2)
  })
})
