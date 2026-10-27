// electron-builder `artifactBuildCompleted` hook: signs each Windows installer / Linux AppImage as soon as
// it is built, before electron-builder starts uploading it. See updateSigning.cjs.
const { signArtifactWith, loadPublicKeys } = require('./updateSigning.cjs')

exports.default = async function signArtifact(event) {
  signArtifactWith(event.file, loadPublicKeys())
}
