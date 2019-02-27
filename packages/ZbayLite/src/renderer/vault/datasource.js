import fs from 'fs'
import { Datasources } from '../vendor/buttercup'

const { TextDatasource, registerDatasource } = Datasources

export class IpcDatasource extends TextDatasource {
  constructor (filename) {
    super()
    this._filename = filename
  }

  load (password) {
    return Promise.resolve(fs.readFileSync(this._filename, 'utf8')).then(content => {
      this.setContent(content)
      return super.load(password)
    })
  }

  save (history, password) {
    return super.save(history, password).then(encryptedContent => {
      return fs.writeFileSync(this._filename, encryptedContent, 'utf8')
    })
  }

  toObject () {
    return {
      type: 'ipc',
      path: this._filename
    }
  }
}

IpcDatasource.fromObject = obj => {
  if (obj.type === 'ipc') {
    return new IpcDatasource(obj.path)
  }
  throw new Error(`Unknown or invalid type: ${obj.type}`)
}

IpcDatasource.fromString = (str, hostCredentials) => IpcDatasource.fromObject(JSON.parse(str), hostCredentials)

registerDatasource('ipc', IpcDatasource)
