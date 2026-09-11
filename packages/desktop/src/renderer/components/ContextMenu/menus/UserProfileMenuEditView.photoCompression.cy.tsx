import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import { mount } from 'cypress/react18'
import { it, cy, describe, expect, beforeEach, Cypress } from 'local-cypress'

import { MAX_PROFILE_PHOTO_SIZE_BYTES } from '@quiet/common'

import { UserProfileMenuEditView } from './UserProfileContextMenu.container'
import { compressProfilePhoto } from './profilePhoto/compressProfilePhoto'
import {
  prepareProfilePhotoForUpload,
  type UploadableProfilePhoto,
  type WriteProfilePhotoTempFileRequest,
} from './profilePhoto/prepareProfilePhoto'
import { lightTheme } from '../../../theme'

const contextMenu = {
  visible: true,
  handleOpen: () => {},
  handleClose: () => {},
}

const ORIGINAL_PHOTO_PATH = '/home/me/Pictures/original.png'
const TEMP_PHOTO_PATH = '/appData/temporaryFiles/profile-photo_cypress.jpg'

/**
 * A 2000x2000 field of random pixels. Noise does not compress, so the PNG comes
 * out far over the profile photo budget - this is the "photo straight off a
 * phone" case that #2953 is about.
 */
const makeNoisyPng = (edge: number): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = edge
    canvas.height = edge
    const context = canvas.getContext('2d')
    if (!context) {
      reject(new Error('no 2d context'))
      return
    }
    const image = context.createImageData(edge, edge)
    const data = image.data
    for (let i = 0; i < data.length; i += 4) {
      const rgb = (Math.random() * 0xffffff) | 0
      data[i] = rgb & 0xff
      data[i + 1] = (rgb >> 8) & 0xff
      data[i + 2] = (rgb >> 16) & 0xff
      data[i + 3] = 255
    }
    context.putImageData(image, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('toBlob returned nothing'))
        return
      }
      blob.arrayBuffer().then(buffer => resolve(new Uint8Array(buffer)), reject)
    }, 'image/png')
  })

/** A 16x16 solid square: a perfectly ordinary, already-small profile photo. */
const makeSmallPng = (): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    const context = canvas.getContext('2d')
    if (!context) {
      reject(new Error('no 2d context'))
      return
    }
    context.fillStyle = '#1c7bd4'
    context.fillRect(0, 0, 16, 16)
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('toBlob returned nothing'))
        return
      }
      blob.arrayBuffer().then(buffer => resolve(new Uint8Array(buffer)), reject)
    }, 'image/png')
  })

describe('Edit profile view: oversized photos are compressed, not refused', () => {
  // Everything the real container does, except the hop into the main process.
  let writeTempFileCalls: WriteProfilePhotoTempFileRequest[]
  let dispatched: UploadableProfilePhoto[]

  const onSaveUserProfile = async ({ photo }: { photo: File }) => {
    const prepared = await prepareProfilePhotoForUpload(photo, {
      compress: compressProfilePhoto,
      writeTempFile: async request => {
        writeTempFileCalls.push(request)
        return { path: TEMP_PHOTO_PATH, name: 'profile-photo', ext: '.jpg' }
      },
      getPathForFile: () => ORIGINAL_PHOTO_PATH,
    })
    dispatched.push(prepared)
  }

  const mountEditView = (handler: ({ photo }: { photo: File }) => void | Promise<void> = onSaveUserProfile) => {
    mount(
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          <UserProfileMenuEditView
            username='nick'
            userId='userId'
            contextMenu={contextMenu}
            setRoute={() => {}}
            onSaveUserProfile={handler}
            errorBanner={null}
          />
        </ThemeProvider>
      </StyledEngineProvider>
    )
  }

  const choosePhoto = (bytes: Uint8Array, fileName: string, mimeType: string) => {
    cy.get('[data-testid="user-profile-edit-photo-input"]').selectFile(
      { contents: Cypress.Buffer.from(bytes), fileName, mimeType },
      { force: true }
    )
  }

  beforeEach(() => {
    writeTempFileCalls = []
    dispatched = []
    cy.viewport(600, 560)
  })

  it('re-encodes a multi-megabyte photo down to the 200KB budget', () => {
    cy.then(() => makeNoisyPng(2000)).then((bytes: Uint8Array) => {
      // Sanity check on the fixture itself: it really is over the budget.
      expect(bytes.byteLength).to.be.greaterThan(1024 * 1024)
      expect(bytes.byteLength).to.be.greaterThan(MAX_PROFILE_PHOTO_SIZE_BYTES)

      mountEditView()
      choosePhoto(bytes, 'huge.png', 'image/png')
    })

    cy.wrap(writeTempFileCalls, { timeout: 30000 }).should('have.length', 1)

    cy.then(() => {
      const written = writeTempFileCalls[0]
      expect(written.fileName).to.equal('profile-photo.jpg')
      expect(written.ext).to.equal('.jpg')
      expect(written.fileBuffer.byteLength).to.be.at.most(MAX_PROFILE_PHOTO_SIZE_BYTES)
      // JPEG SOI marker: the bytes handed to the main process really are a JPEG.
      expect(written.fileBuffer[0]).to.equal(0xff)
      expect(written.fileBuffer[1]).to.equal(0xd8)

      // The saga uploads from disk, so the dispatched photo must point at the
      // temp file, not at the user's original.
      expect(dispatched).to.have.length(1)
      expect(dispatched[0].path).to.equal(TEMP_PHOTO_PATH)
      expect(dispatched[0].name).to.equal('profile-photo.jpg')
      expect(dispatched[0].size).to.be.at.most(MAX_PROFILE_PHOTO_SIZE_BYTES)
    })

    // No banner: the photo was accepted, which is the whole point of the change.
    cy.contains('Photo is too large').should('not.exist')
    cy.contains('Edit photo').should('be.visible')
    cy.screenshot('2953-compress-accepted-light', { overwrite: true, capture: 'viewport' })
  })

  it('leaves a photo that already fits completely untouched', () => {
    cy.then(() => makeSmallPng()).then((bytes: Uint8Array) => {
      expect(bytes.byteLength).to.be.lessThan(MAX_PROFILE_PHOTO_SIZE_BYTES)

      mountEditView()
      choosePhoto(bytes, 'small.png', 'image/png')
    })

    cy.wrap(dispatched, { timeout: 30000 }).should('have.length', 1)

    cy.then(() => {
      // Not re-encoded: no temp file, and the upload still reads the user's own
      // file off disk exactly as it did before this change.
      expect(writeTempFileCalls).to.have.length(0)
      expect(dispatched[0].path).to.equal(ORIGINAL_PHOTO_PATH)
      expect(dispatched[0].name).to.equal('small.png')
      expect(dispatched[0].type).to.equal('image/png')
    })

    cy.contains('Photo is too large').should('not.exist')
  })

  it('disables the Edit photo button while the photo is being resized', () => {
    // A multi-megabyte photo takes a moment to re-encode; hold the button so it
    // cannot be clicked a second time mid-flight. A handler that never settles
    // makes that window observable.
    mountEditView(() => new Promise<void>(() => {}))

    cy.get('[data-testid="user-profile-edit-photo-button"]').should('not.be.disabled')
    cy.contains('Edit photo').should('be.visible')

    choosePhoto(new TextEncoder().encode('anything'), 'any.png', 'image/png')

    cy.get('[data-testid="user-profile-edit-photo-button"]').should('be.disabled')
    cy.contains('Resizing photo').should('be.visible')
    cy.screenshot('2953-compress-resizing-light', { overwrite: true, capture: 'viewport' })
  })

  it('falls back to the original file when the chosen file is not a decodable image', () => {
    const notAnImage = new TextEncoder().encode('this is not a png, whatever the extension says')

    mountEditView()
    choosePhoto(notAnImage, 'lies.png', 'image/png')

    cy.wrap(dispatched, { timeout: 30000 }).should('have.length', 1)

    cy.then(() => {
      // Compression could not rescue it, so the user's file goes through
      // unchanged and the size guard in saveUserProfileSaga stays the backstop
      // that produces the too-large banner.
      expect(writeTempFileCalls).to.have.length(0)
      expect(dispatched[0].path).to.equal(ORIGINAL_PHOTO_PATH)
      expect(dispatched[0].name).to.equal('lies.png')
    })
  })
})
