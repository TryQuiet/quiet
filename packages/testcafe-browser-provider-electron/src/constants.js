export default {
    contextMenuGlobal:       '%testcafe-context-menu%',
    mainPathEnv:             'TESTCAFE_ELECTRON_MAIN_PATH',
    testUrlEnv:              'TESTCAFE_ELECTRON_TEST_URL',
    configFileName:          '.testcafe-electron-rc',
    mainMenuType:            'mainMenu',
    contextMenuType:         'contextMenu',
    typeProperty:            '%type%',
    indexProperty:           '%index%',
    electronStartedMarker:   'testcafe-browser-provider-electron: Electron started',
    electronErrorMarker:     'testcafe-browser-provider-electron: Error',
    connectionRetryDelay:    300,
    maxConnectionRetryCount: 10,
    loadingTimeout:          30000
};
