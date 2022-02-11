function getMainWindowUrl() {
  return `file://${process.env.APPDIR}/dist/main/index.html#/`;
}

export default getMainWindowUrl;