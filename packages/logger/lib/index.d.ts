import log from 'electron-log';
export declare const saveToFileLogger: (packageName: string) => (module: string) => ((...params: any[]) => void) & log.LogFunctions;
export declare const consoleLogger: (packageName: string) => (module: string) => any;
declare const logger: (packageName: string) => (module: string) => any;
export default logger;
