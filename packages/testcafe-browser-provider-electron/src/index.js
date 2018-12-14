import path from 'path';
import { statSync } from 'fs';
import { spawn } from 'child_process';
import Promise from 'pinkie';
import OS from 'os-family';
import { getFreePorts } from 'endpoint-utils';
import NodeDebug from './node-debug';
import NodeInspect from './node-inspect';
import isAbsolute from './utils/is-absolute';
import getConfig from './utils/get-config';
import getHookCode from './hook';
import { Server as IPCServer } from './ipc';
import Helpers from './helpers';
import ERRORS from './errors';

import testRunTracker from 'testcafe/lib/api/test-run-tracker';


function startElectron (config, ports) {
    var cmd            = '';
    var args           = null;
    var debugPortsArgs = [`--debug-brk=${ports[0]}`, `--inspect-brk=${ports[1]}`];
    var extraArgs      = config.appArgs || [];

    if (OS.mac && statSync(config.electronPath).isDirectory()) {
        cmd  = 'open';
        args = ['-naW', `"${config.electronPath}"`, '--args'].concat(debugPortsArgs, extraArgs);
    }
    else {
        cmd  = config.electronPath;
        args = debugPortsArgs.concat(extraArgs);
    }

    spawn(cmd, args, { stdio: 'ignore' });
}

async function injectHookCode (client, code) {
    await client.connect();
    await client.evaluate(code);

    client.dispose();
}


const ElectronBrowserProvider = {
    isMultiBrowser: true,
    openedBrowsers: {},

    _getBrowserHelpers () {
        var testRun = testRunTracker.resolveContextTestRun();
        var id      = testRun.browserConnection.id;

        return ElectronBrowserProvider.openedBrowsers[id].helpers;
    },

    async isLocalBrowser () {
        return true;
    },
    
    async openBrowser (id, pageUrl, mainPath) {
        if (!isAbsolute(mainPath))
            mainPath = path.join(process.cwd(), mainPath);

        var config    = getConfig(id, mainPath);
        var ipcServer = new IPCServer(config);

        await ipcServer.start();

        var ports = await getFreePorts(2);

        startElectron(config, ports);

        var hookCode      = getHookCode(config, pageUrl);
        var debugClient   = new NodeDebug(ports[0]);
        var inspectClient = new NodeInspect(ports[1]);

        await Promise.race([
            injectHookCode(debugClient, hookCode),
            injectHookCode(inspectClient, hookCode)
        ]);

        await ipcServer.connect();

        var injectingStatus = await ipcServer.getInjectingStatus();

        if (!injectingStatus.completed) {
            await ipcServer.terminateProcess();

            ipcServer.stop();

            throw new Error(ERRORS.render(ERRORS.mainUrlWasNotLoaded, {
                mainWindowUrl: config.mainWindowUrl,
                openedUrls:    injectingStatus.openedUrls
            }));
        }

        this.openedBrowsers[id] = {
            config:  config,
            ipc:     ipcServer,
            helpers: new Helpers(ipcServer)
        };
    },

    async closeBrowser (id) {
        await this.openedBrowsers[id].ipc.terminateProcess();

        this.openedBrowsers[id].ipc.stop();

        delete this.openedBrowsers[id];
    },

    async getBrowserList () {
        return ['${PATH_TO_ELECTRON_APP}'];
    },

    // TODO: implement validation ?
    async isValidBrowserName (/* browserName */) {
        return true;
    },

    //Helpers
    async getMainMenuItems () {
        return ElectronBrowserProvider._getBrowserHelpers().getMainMenuItems();
    },


    async getContextMenuItems () {
        return ElectronBrowserProvider._getBrowserHelpers().getContextMenuItems();
    },

    async clickOnMainMenuItem (menuItem, modifiers = {}) {
        return ElectronBrowserProvider._getBrowserHelpers().clickOnMainMenuItem(menuItem, modifiers);
    },

    async clickOnContextMenuItem (menuItem, modifiers = {}) {
        return ElectronBrowserProvider._getBrowserHelpers().clickOnContextMenuItem(menuItem, modifiers);
    },

    async setElectronDialogHandler (fn, context) {
        return ElectronBrowserProvider._getBrowserHelpers().setElectronDialogHandler(fn, context);
    },

    async getMainMenuItem (menuItemSelector) {
        return ElectronBrowserProvider._getBrowserHelpers().getMainMenuItem(menuItemSelector);
    },

    async getContextMenuItem (menuItemSelector) {
        return ElectronBrowserProvider._getBrowserHelpers().getContextMenuItem(menuItemSelector);
    }
};

export { ElectronBrowserProvider as default };
