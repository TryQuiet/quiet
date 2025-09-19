const fs = require('fs')
const path = require('path')

// Copy the selected ENVFILE into dist/main/mainEnvs.json
// ENVFILE should be a path like .env.development or .env.production
const envFile = process.env.ENVFILE || '.env.production'
const srcPath = path.resolve(envFile)
const destDir = path.resolve('dist', 'main')
const destPath = path.join(destDir, '.env')

try {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`ENVFILE not found at ${srcPath}`)
  }

  // Ensure output directory exists
  fs.mkdirSync(destDir, { recursive: true })

  // Copy raw dotenv contents (do not JSON-encode)
  const data = fs.readFileSync(srcPath, 'utf8')
  fs.writeFileSync(destPath, data)

  console.log(`Copied ENVFILE to bundle: ${srcPath} -> ${destPath}`)
} catch (err) {
  console.error(`Failed to copy ENVFILE into ${destPath}:`, err.message)
  process.exitCode = 1
}
