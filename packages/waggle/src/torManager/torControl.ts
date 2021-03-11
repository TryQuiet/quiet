var net = require('net')
var EventEmitter = require('events').EventEmitter

interface IOpts {
  port?: number
  host?: string
  password?: string
  persistent?: boolean
  path?: string
}
class TorControl {
  opts: IOpts = {}
  private connect: (params: any, cb: any) => { any: any }
  private connection: any
  private disconnect: any
  private isPersistent: any
  private setPersistent: any
  private eventEmitter: any = new EventEmitter()
  private sendCommand: any = (
    command: string,
    keepConnection: boolean
  ): Promise<{ code: number; messages: string[] }> => {
    return new Promise((resolve, reject) => {
      var self = this,
        tryDisconnect = function (callback: any) {
          if (keepConnection || self.isPersistent() || !self.connection) {
            return callback()
          }
          return self.disconnect(callback)
        }
      return this.connect(null, function (err: any, connection: any) {
        if (err) {
          return reject(err)
        }
        connection.once('data', function (data: any) {
          return tryDisconnect(function () {
            let messages = []
            let arr = []
            data = data.toString()
            console.log('dataaa', data)
            if (/250/.test(data)) {
              arr = data.split(/\r?\n/)
              for (let i = 0; i < arr.length; i += 1) {
                if (arr[i] !== '') {
                  var message = arr[i]
                  messages.push(message)
                }
              }
              return resolve({
                code: 250,
                messages: messages
              })
            }
            reject(new Error(data))
          })
        })
        connection.write(command + '\r\n')
      })
    })
  }
  constructor(opts: IOpts = {}) {
    var self = this

    opts = opts || {}

    if (!opts.hasOwnProperty('path')) {
      opts.port = opts.port || 9051
      opts.host = opts.host || 'localhost'
    }

    opts.password = opts.password || ''
    if (!opts.hasOwnProperty('persistent')) {
      opts.persistent = false
    }

    this.connect = function connectTorControl(params, cb) {
      params = params || opts

      if (this.connection) {
        if (cb) {
          return cb(null, this.connection)
        }
        return
      }

      if (!params.hasOwnProperty('path')) {
        if (opts.hasOwnProperty('path')) {
          params.path = opts.path
        } else {
          params.host = params.host || opts.host
          params.port = params.port || opts.port
        }
      }

      this.connection = net.connect(params)

      //Handling connection errors
      this.connection.once('error', function (err: any) {
        if (cb) {
          cb(new Error('Error connecting to control port: ' + err))
        }
      })

      // piping events
      this.connection.on('data', (data: any) => {
        self.eventEmitter.emit('data', data)
      })
      this.connection.on('end', () => {
        self.connection = null
        self.eventEmitter.emit('end')
      })

      if (cb) {
        this.connection.once('data', function (data: any) {
          data = data.toString()
          if (data.substr(0, 3) === '250') {
            return cb(null, self.connection)
          }
          return cb(new Error('Authentication failed with message: ' + data))
        })
      }

      this.connection.write('AUTHENTICATE "' + (params.password || opts.password) + '"\r\n') // Chapter 3.5
      return this
    }

    this.disconnect = function disconnectTorControl(cb: any, force: boolean) {
      if (!this.connection) {
        if (cb) {
          return cb()
        }
        return
      }
      if (cb) {
        this.connection.once('end', function () {
          return cb()
        })
      }
      if (force) {
        return this.connection.end()
      }
      this.connection.write('QUIT\r\n')
      return this
    }

    this.isPersistent = function isTorControlPersistent() {
      return !!opts.persistent
    }
    this.setPersistent = function setTorControlPersistent(value: any) {
      opts.persistent = !!value
      return this
    }
  }

  public async addOnion(request: string): Promise<{ code: number; messages: string[] }> {
    return this.sendCommand('ADD_ONION ' + request)
  }
  public async delOnion(request: string): Promise<{ code: number; messages: string[] }> {
    return this.sendCommand('DEL_ONION ' + request)
  }
  public signal(signal: string): Promise<{ code: number; messages: string[] }> {
    return this.sendCommand('SIGNAL ' + signal)
  }
  public signalReload(): Promise<{ code: number; messages: string[] }> {
    return this.signal('RELOAD')
  }
  public async setConf(request: string): Promise<{ code: number; messages: string[] }> {
    return this.sendCommand('SETCONF ' + request)
  }
}

export { TorControl }
