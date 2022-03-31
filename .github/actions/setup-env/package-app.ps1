echo "::group::vs build tools setup"
./install-vs-build-tools.ps1 -IncludeWin81Sdk $true
npm config set msvs_version 2017
echo "::endgroup::"

echo "::group::build native modules"
npm run postinstall:remove:prebuild-install
npm run clean:prebuilds
# $env:DEBUG = "*"
npm exec --package=electron-builder -- electron-builder install-app-deps --arch=x64
# $env:DEBUG = $null
echo "::endgroup::"

echo "::group::test:e2e"
yarn test:e2e
echo "::endgroup::"

echo "::group::package"
yarn build:electron-builder-hooks
npm run electron-builder:dist
echo "::endgroup::"

echo "::group::hash & upload"
yarn scripts/dist-packages/print-hashes
yarn scripts/dist-packages/upload
echo "::endgroup::"