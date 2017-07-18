# testcafe-browser-provider-electron
[![Build Status](https://travis-ci.org/DevExpress/testcafe-browser-provider-electron.svg)](https://travis-ci.org/DevExpress/testcafe-browser-provider-electron)

This plugin allows you to test **Electron** applications with [TestCafe](http://devexpress.github.io/testcafe).

## Install

```
npm install testcafe-browser-provider-electron
```

## Usage

First, create a `.testcafe-electron-rc` file in the root directory of your Electron app. For more info, see the [Configuration](#configuration) section.

```
{
  "mainWindowUrl": "./index.html"
}
```

When you run tests from the command line, specify the path to the application root directory prefixed with "electron:" :

```
testcafe "electron:/home/user/electron-app" "path/to/test/file.js"
```

When you use API, pass the application path with the "electron:" prefix to the `browsers()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('electron:/home/user/electron-app')
    .run();
```

## Configuration

You can specify the following options in the `.testcafe-electron-rc` configuration file.

### mainWindowUrl

__Required.__ Specifies the URL of the application's main window page.
 For local application pages, you can also specify a relative (to the application directory) or an absolute path to the file of the page.

### appPath

__Optional.__ Alters path to the application, which, by default, must be located at the [default Electron app directory](https://github.com/electron/electron/blob/master/docs/tutorial/application-distribution.md#application-distribution).
You can use the `appPath` option to override the default path by specifying a new absolute path. Alternatively, you can append a relative path to the path specified after the "electron:" prefix.

### appArgs

__Optional.__ Overrides application command line arguments with the values specified in this option. It should be an array or an object with numeric keys.

### electronPath

__Optional__. Specifies a path to the electron binary. If `electronPath` is not specified, the [electron package](https://www.npmjs.com/package/electron) should be installed.
 On macOS, it can be either a path to the `electron` binary, or a path to the entire Electron.app (e.g. `/Applications/Electron.app`).

### enableNavigateEvents

__Optional.__ `testcafe-browser-provider-electron` suppresses `did-navigate` and `will-navigate`  webContent events because you will be unable to run tests if these events are used to prevent navigation. You can enable them back by setting this option to `true`.

### openDevTools

__Optional.__ If `true`, DevTools will be opened just before tests start.

## Helpers
You can use helper functions from the provider in your test files. Use ES6 import statement to access them.

```js
import { getMainMenu, clickOnMenuItem } from 'testcafe-browser-provider-electron';
```

### getMenuItem

Gets a snapshot of the specified menu item.

```js
async function getMenuItem (menuItemSelector)
```

Parameter          | Type   | Description
------------------ | ------ | -----
`menuItemSelector` | String | Consists of the menu type and menu item labels, separated by the `>` sign.

 For example, you can pass the following values in the `menuItemSelector` parameter.

 * `Main Menu > File > Open`
 * `Context Menu > Undo`

 The `Main Menu` menu type can be skipped.

 If there are several menu items with the same label on the same level, you can specify a one-based index
 in square brackets:

 * `Main Menu > Window > My Window [2]`

 This value corresponds to the second menu item with label `My Window` in the `Window` menu.

 Check the properties available in the snapshot
 [here](https://github.com/electron/electron/blob/master/docs/api/menu-item.md).

 ### getMainMenu

 Gets a snapshot of the application main menu.

 ```
 async function getMainMenu ()
 ```

 You can check properties available in the snapshot
 [here](https://github.com/electron/electron/blob/master/docs/api/menu.md).

 ### getContextMenu

 Gets a snapshot of the context menu.

 ```
 async function getContextMenu ()
 ```

 You can check properties available in the snapshot
 [here](https://github.com/electron/electron/blob/master/docs/api/menu.md),

 ### clickOnMenuItem

 Performs a click on the specified `menuItem`.

 ```
 async function clickOnMenuItem (menuItem, modifiers)
 ```

 Parameter          | Type   | Description
------------------ | ------ | -----
`menuItem` | String &#124; Object | The menu item to click.
`modifiers` | Object | Control keys held when clicking the menu item.

 If you specify a string in the `menuItem` parameter, it will be passed to the [getMenuItem](#getmenuitem) function and the returned value will be used. Alternatively, you can pass a value returned by the [getMenuItem](#getmenuitem), [getMainMenu](#getmainmenu) or [getContextMenu](#getcontextmenu) function.

 Use the `modifiers` parameter to specify state of the control keys (`Shift`, `Ctrl`, `Alt`, `Meta`). The default value is

 ```
 {
     shift: false,
     ctrl: false,
     alt: false,
     meta: false
 }
  ```

 **Examples**

 ```
 clickOnMenuItem('Main Menu > File > Open')
 ```

 ```
 clickOnMenuItem('File > Open')
 ```

 ```
 clickOnMenuItem((await getMainMenu()).items[0].submenu.items[0])
 ```

 ### setElectronDialogHandler

 Sets a function that will handle native Electron dialogs.

 ```
 async function setElectronDialogHandler (handler, dependencies)
 ```

  Parameter          | Type   | Description
------------------ | ------ | -----
`handler` | Function | A function that will handle Electron dialogs.
`dependencies` | Object | Variables passed to the `handler` function's scope as global variables.

 The `handler` function has the following signature.

 ```
 function handler (type, ...args)
 ```

 This function must be synchronous. It will be invoked with the dialog type `type`, and the arguments `args`
 from the original dialog function.

## Author
Developer Express Inc. (https://devexpress.com)
