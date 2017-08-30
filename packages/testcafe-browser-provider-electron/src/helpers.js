import CONSTANTS from './constants';
import ERRORS from './errors';


const MODIFIERS_KEYS_MAP = {
    'shift': 'shiftKey',
    'ctrl':  'ctrlKey',
    'alt':   'altKey',
    'meta':  'metaKey'
};

function addMenuPaths (menuItems, prevPath = []) {
    menuItems.forEach(menuItem => {
        menuItem[CONSTANTS.menuPathProperty] = prevPath;

        if (menuItem.submenu)
            addMenuPaths(menuItem.submenu, prevPath.concat(menuItem.commandId));
    });

    return menuItems;
}

function findMenuItem (menuItems, menuItemSelector) {
    var menuItem = null;

    for (let i = 0; menuItems && i < menuItemSelector.length; i++) {
        const index = menuItemSelector[i].index ? menuItemSelector[i].index - 1 : 0;
        const label = typeof menuItemSelector[i] === 'string' ? menuItemSelector[i] : menuItemSelector[i].label;

        menuItem = label ? menuItems.filter(item => item.label === label)[index] : menuItems[index];

        menuItems = menuItem && menuItem.submenu || null;
    }

    return menuItem || null;
}

function ensureModifiers (srcModifiers = {}) {
    var result = {};

    Object.keys(MODIFIERS_KEYS_MAP).forEach(mod => result[MODIFIERS_KEYS_MAP[mod]] = !!srcModifiers[mod]);

    return result;
}

export default class Helpers {
    constructor (ipc) {
        this.ipc = ipc;
    }

    async _getMenuItems (menuType) {
        return addMenuPaths(await this.ipc.getMenuItems(menuType));
    }

    async _getMenuItem (menuType, menuItemSelector) {
        var menuItems = await this._getMenuItems(menuType);

        return findMenuItem(menuItems, menuItemSelector);
    }

    async _clickOnMenuItem (menuType, menuItem, modifiers) {
        var menuItemSnapshot = menuItem.commandId ? menuItem : await this._getMenuItem(menuType, menuItem);

        if (!menuItemSnapshot)
            throw new Error(ERRORS.invalidMenuItemArgument);

        await this.ipc.clickOnMenuItem(menuType, menuItemSnapshot, ensureModifiers(modifiers));
    }

    async getMainMenuItems () {
        return await this._getMenuItems(CONSTANTS.mainMenuType);
    }

    async getContextMenuItems () {
        return await this._getMenuItems(CONSTANTS.contextMenuType);
    }

    async getMainMenuItem (menuItemSelector) {
        return await this._getMenuItem(CONSTANTS.mainMenuType, menuItemSelector);
    }

    async getContextMenuItem (menuItemSelector) {
        return await this._getMenuItem(CONSTANTS.contextMenuType, menuItemSelector);
    }

    async clickOnMainMenuItem (menuItem, modifiers = {}) {
        await this._clickOnMenuItem(CONSTANTS.mainMenuType, menuItem, modifiers);
    }

    async clickOnContextMenuItem (menuItem, modifiers = {}) {
        await this._clickOnMenuItem(CONSTANTS.contextMenuType, menuItem, modifiers);
    }

    async setElectronDialogHandler (fn, context) {
        await this.ipc.setDialogHandler(fn, context);
    }
}
