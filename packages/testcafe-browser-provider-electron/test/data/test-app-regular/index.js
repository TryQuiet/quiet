var electron   = require('electron');
var path       = require('path');
var dialog     = electron.dialog;
var remoteMain = require('@electron/remote/main');

var BrowserWindow = electron.BrowserWindow;
var app           = electron.app;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var win = null;


function createWindow () {
    // Initialize main remote.
    remoteMain.initialize();

    // Create the browser window.
    win = new BrowserWindow({
        width:          1024,
        height:         768,
        webPreferences: {
            nodeIntegration:  true,
            // NOTE: Electron 12 breaking changes:
            // "Changed the default value of `contextIsolation` to `true`"
            // (https://www.electronjs.org/blog/electron-12-0#breaking-changes)
            contextIsolation: false,
        },
    });

    // and enable remote module for this windows
    remoteMain.enable(win.webContents);

    // and load the index.html of the app.
    win.webContents.loadURL('file://' + path.join(__dirname, 'index.html'));

    // Emitted when the window is closed.
    win.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });

    electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate([{
        label: 'Test',

        submenu: [
            {
                label:    'Click',
                sublabel: 'item 1',

                click () {
                    win.webContents.executeJavaScript('window.mainMenuClicked = true');
                }
            },
            {
                label:    'Dialog',
                sublabel: 'item 2',

                click () {
                    var x = dialog.showOpenDialog({ title: 'Test open' });

                    win.webContents.executeJavaScript(`window.dialogResult = "${x}"`);
                }
            },
            {
                label:    'New Menu',
                sublabel: 'item 3'
            },
            {
                label:    'New Menu',
                sublabel: 'item 4'
            }
        ]
    }]));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin')
        app.quit();
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null)
        createWindow();
});
