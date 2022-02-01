import debug from 'debug';
declare const logger: (module: string) => debug.Debugger & {
    error: debug.Debugger;
    success: debug.Debugger;
};
export default logger;
