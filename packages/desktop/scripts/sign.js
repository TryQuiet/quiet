exports.default = async function (configuration) {
  const skip =
    process.env.GITHUB_EVENT_NAME === 'pull_request' ||
    process.env.TEST_MODE === 'true' ||
    process.env.IS_LOCAL === 'true' ||
    process.env.IS_E2E === 'true'

  if (skip) {
    console.log('[sign] Skipping Windows code signing (preview build or no cert)');
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
