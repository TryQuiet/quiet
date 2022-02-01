import { BrowserWindow } from 'electron';
export declare const isDev: boolean;
export declare const isE2Etest: boolean;
export declare const checkForUpdate: (win: BrowserWindow) => Promise<void>;
