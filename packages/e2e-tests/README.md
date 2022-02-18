For running end to end tests we use testcafe (https://testcafe.io/) along with its official electron plugin (https://github.com/DevExpress/testcafe-browser-provider-electron)

## Running tests locally

*  Using built version:

`npm run test:build`

or when you already have a built app to test:

`npm run test`

* Using dev version:

`npm run test:dev`

## Notes

App data (e.g store) is kept under .config/Electron and .config/Quiet (linux). 
Currently both dev and test version uses the same data directory (Quiet) so you may want to delete it manually before running tests.