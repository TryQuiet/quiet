const fs = require('fs')

const compare = async (imagePath, basePath) => {
  const bitmapBuffer = fs.readFileSync(imagePath)
  const expectedBitmapBuffer = fs.readFileSync(basePath)
  if (!bitmapBuffer.equals(expectedBitmapBuffer)) {
    throw new Error(
      `Expected image at ${imagePath} to be equal to image at ${basePath}, but it was different!`
    )
  }
  // Remove unnecessary artifacts afterwards
  fs.unlinkSync(imagePath)
}

export default compare
