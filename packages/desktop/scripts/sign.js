exports.default = async function (configuration) {
  if (process.env.E2E) {
    console.log('E2E workflow - no need to sign')
    return
  }
  console.log('config', configuration.path)
  require('child_process').execSync(
    `java \
    -jar ./jsign-2.1.jar \
    --keystore ${process.env.CERTIFICATE_PATH} \
    --storepass ${process.env.WIN_CSC_KEY_PASSWORD} \
    --storetype PKCS12 \
    --tsaurl http://timestamp.digicert.com \
    --alias ${process.env.WINDOWS_ALIAS} \
    "${configuration.path}"
    `,
    {
      stdio: 'inherit',
    }
  )
}
