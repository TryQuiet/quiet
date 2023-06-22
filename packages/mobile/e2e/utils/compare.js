const fs = require('fs')

const compare = async (imagePath, expectedImagePath) => {
  const bitmapBuffer = fs.readFileSync(imagePath)
  const expectedBitmapBuffer = fs.readFileSync(expectedImagePath)
  if (!bitmapBuffer.equals(expectedBitmapBuffer)) {
    throw new Error(
      `Expected image at ${imagePath} to be equal to image at ${expectedImagePath}, but it was different!`
    )
  }
  // Remove unnecessary artifacts afterwards
  fs.unlinkSync(imagePath)
}

export default compare
