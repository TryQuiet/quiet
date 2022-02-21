import { Accelerator, BrowserWindow, NativeImage, MenuItem, Menu } from "electron";

declare module 'testcafe-browser-provider-electron' {
    interface Modifiers {
        shift?: boolean;
        ctrl?: boolean;
        alt?: boolean;
        meta?: boolean;
    }

    type HandlerType =
        | 'open-dialog'
        | 'save-dialog'
        | 'message-box'
        | 'error-box'
        | 'certificate-trust-dialog'

    type HandlerFn = (type: HandlerType, browserWindow?: BrowserWindow, ...args: any[]) => any;

    export function getMainMenuItem(menuItemSelector: string[] | string | [string, { label: string, index: number }]): Promise<MenuItem>;
    export function getMainMenuItems(): Promise<MenuItem[]>;

    export function getContextMenuItem(menuItemSelector: string[] | string | [string, { label: string, index: number }]): Promise<MenuItem>
    export function getContextMenuItems(): Promise<Menu[]>;

    export function clickOnMainMenuItem(menuItem: string | MenuItem, modifiers?: Modifiers): Promise<void>;
    export function clickOnContextMenuItem(menuItem: string | MenuItem, modifiers?: Modifiers): Promise<void>;

    export function setElectronDialogHandler(handler: HandlerFn, dependencies: object)
}
