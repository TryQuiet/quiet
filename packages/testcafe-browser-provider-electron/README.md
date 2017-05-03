# testcafe-browser-provider-electron
[![Build Status](https://travis-ci.org/DevExpress/testcafe-browser-provider-electron.svg)](https://travis-ci.org/DevExpress/testcafe-browser-provider-electron)

This is the **electron** browser provider plugin for [TestCafe](http://devexpress.github.io/testcafe).

## Install

```
npm install testcafe-browser-provider-electron
```

## Usage
First, create a `.testcafe-electron-rc` file in the root directory of your Electron app. For more info, see the Config section.
```
{
  "mainWindowUrl": "./index.html"
}
```

When you run tests from the command line, specify the path to the Electron app prefixed with "electron:" -

```
testcafe "electron:/home/user/electron-app" "path/to/test/file.js"
```


When you use API, pass the app path to the `browsers()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('electron:/home/user/electron-app')
    .run();
```

## Config
Below is a list of configuration options that you can specify in `.testcafe-electron-rc`.

 - `mainWindowUrl` __(required)__ - specifies URL used for the main window page of the appplication. 
 If you use `file://` urls, you can also specify a relative (to the application directory) or an absolute path to the file of the page.
 - `appPath` __(optional)__ - alters path to the application. By default, the application path is specified after the `electron:` 
 prefix in the string passed to the command line or API. You can override it by specifying an absolute path, or 
 append a relative path from `appPath`.  
 - `appArgs` __(optional)__ - overrides application command line arguments with the values specified in this option. It should be an array or an object with numeric keys.
 - `disableNavigateEvents` __(optional)__ - if you use `did-navigate` or `will-navigate` webContent events to prevent navigation, you should disable it by setting this option to `true`.
 - `openDevTools` __(optional)__ - if `true`, DevTools will be opened just before tests start.
 
## Helpers
You can use helper functions from the provider in your test files. Use ES6 import statement to access them.
```js
import { getMainMenu, clickOnMenuItem } from 'testcafe-browser-provider-electron';
```
 - `async function getMenuItem (menuItemSelector)` - gets a snapshot of the specified menu item. `menuItemSelector` 
 is a string that consists of the menu type and menu item labels, separated by the `>` sign, e.g. 
 `Main Menu > File > Open` or `Context Menu > Undo`. The `Main Menu` menu type can be skipped. 
 If there are several menu items with the same label on the same level, you can specify a one-based index 
 in square brackets, e.g. `Main Menu > Window > My Window [2]` selects the second menu item with 
 label `My Window` in the `Window` menu. Check the properties available in the snapshot 
 [here](https://github.com/electron/electron/blob/master/docs/api/menu-item.md).
 
 - `async function getMainMenu ()` - gets a snapshot of the application main menu. You can check properties available in the snapshot 
 [here](https://github.com/electron/electron/blob/master/docs/api/menu.md). 
 
 - `async function getContextMenu ()` - gets a snapshot of the context menu. You can check properties available in the snapshot 
 [here](https://github.com/electron/electron/blob/master/docs/api/menu.md), 

 - `async function clickOnMenuItem (menuItem, modifiers)` - performs a click on the given `menuItem`. It can be a string, 
 in this case it will be passed to the `getMenuItem` function and the returned value will be used; or a value retrieved 
 with `getMenuItem`, `getMainMenu`, `getContextMenu` functions. 
 Also, you can pass the state of the control keys (`Shift`, `Ctrl`, `Alt`, `Meta`) in the `modifiers` argument, e.g. the default is 
 `{ shift: false, ctrl: false, alt: false, meta: false}`. Examples: `clickOnMenuItem('Main Menu > File > Open')`,
 `clickOnMenuItem('File > Open')`, `clickOnMenuItem((await getMainMenu()).items[0].submenu.items[0])`,
 
 - `async function setElectronDialogHandler (handler, dependencies)` - sets a function `function handler (type, ...args)` 
 that will handle native Electron dialogs. Specify the function's global variables in the `dependencies` argument. 
 The handler function must be synchronous and will be invoked with the dialog type `type`, and the arguments `args` 
 from the original dialog function.
  
## Author
Developer Express Inc. (https://devexpress.com)
