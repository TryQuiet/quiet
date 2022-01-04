For running end to end tests we use testcafe (https://testcafe.io/) along with its official electron plugin (https://github.com/DevExpress/testcafe-browser-provider-electron)

## Running tests locally

`npm run build:prod`

`npm run start:e2e`

## Notes

App data (e.g store) is kept under .config/Electron and .config/Zbay (linux). 
Currently both dev and test version uses the same data directory (Zbay) so you may want to delete it manually before running tests.