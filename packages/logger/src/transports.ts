import winston from 'winston';
import { ConsoleForElectron } from 'winston-console-for-electron'

import { LogTransportType } from "./enums";
import { SharedLogTransportMap, TransportConfig } from "./types";
import { DEFAULT_LOG_FILE } from "./const";

export class LogTransports {
    public sharedTransports: SharedLogTransportMap = {}

    constructor(public logFile?: string, public rotatedLogFile?: string) {}

    public initTransport(config: TransportConfig): winston.transport {
        if (config.shared && this.sharedTransports[config.type] != null) {
            return this.sharedTransports[config.type] as winston.transport
        }

        const transport = this.generateTransport(config.type, config.fileName)
        if (config.shared) {
            this.sharedTransports[config.type] = transport as any
        }
        return transport
    }

    private generateTransport(type: LogTransportType, fileName?: string): winston.transport {
        switch (type) {
            case LogTransportType.CONSOLE:
                return new winston.transports.Console()
            case LogTransportType.CONSOLE_ELECTRON:
                return new ConsoleForElectron({
                    prefix: '',
                })
            case LogTransportType.FILE:
                return new winston.transports.File({ filename: fileName || this.logFile || DEFAULT_LOG_FILE })
            case LogTransportType.ROTATE_FILE:
                return new winston.transports.DailyRotateFile({ filename: fileName || this.rotatedLogFile || DEFAULT_LOG_FILE, datePattern: "HH" })
            default:
                throw new Error(`Unknown log transport type ${type}`)
        }
    }
}