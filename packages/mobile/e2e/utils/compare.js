const fs = require('fs')

const compare = (imagePath, expectedImagePath) => {
  const bitmapBuffer = fs.readFileSync(imagePath)
  const expectedBitmapBuffer = fs.readFileSync(expectedImagePath)
  if (!bitmapBuffer.equals(expectedBitmapBuffer)) {
    throw new Error(
      `Expected image at ${imagePath} to be equal to image at ${expectedImagePath}, but it was different!`
    )
  }
}

export default compare
