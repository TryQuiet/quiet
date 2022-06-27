import React from 'react'
import { createEvent, fireEvent, screen } from '@testing-library/dom'
import { prepareStore } from '../../../../testUtils/prepareStore'
import { renderComponent } from '../../../../testUtils/renderComponent'
import { ChannelInputComponent } from './ChannelInput'
import { INPUT_STATE } from './InputState.enum'
import {
  FileContent,
  getFactory,
  identity
} from '@quiet/state-manager'
import UploadFilesPreviewsComponent from '../../../Channel/File/UploadingPreview'

describe('ChannelInput', () => {
  it('renders component input available ', () => {
    const result = renderComponent(
      <ChannelInputComponent
        channelAddress={'channelAddress'}
        channelName={'channelName'}
        inputPlaceholder='#channel as @user'
        onChange={jest.fn()}
        onKeyPress={jest.fn()}
        infoClass={''}
        setInfoClass={jest.fn()}
        openFilesDialog={jest.fn()}
        handleOpenFiles={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-root-1"
          >
            <div
              class="MuiGrid-root makeStyles-root-1 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-inputsDiv-5 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
              >
                <div
                  class="MuiGrid-root makeStyles-textfield-4 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <div
                      class="makeStyles-input-3"
                      contenteditable="true"
                      data-testid="messageInput"
                      placeholder="Message #channel as @user"
                    >
                      
                    </div>
                  </div>
                  <div
                    class="makeStyles-icons-22"
                  >
                    <div
                      class="MuiGrid-root makeStyles-actions-14 MuiGrid-item"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                      >
                        <img
                          class="makeStyles-emoji-12"
                          src="test-file-stub"
                        />
                        <input
                          accept="image/*"
                          hidden=""
                          multiple=""
                          type="file"
                        />
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root makeStyles-actions-14 MuiGrid-item"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                      >
                        <img
                          class="makeStyles-emoji-12"
                          src="test-file-stub"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-boot-128 MuiGrid-container"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
  it('renders component input unavailable', () => {
    const result = renderComponent(
      <ChannelInputComponent
        channelAddress={'channelAddress'}
        channelName={'channelName'}
        inputPlaceholder='#channel as @user'
        onChange={jest.fn()}
        onKeyPress={jest.fn()}
        infoClass={''}
        setInfoClass={jest.fn()}
        inputState={INPUT_STATE.NOT_CONNECTED}
        openFilesDialog={jest.fn()}
        handleOpenFiles={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-root-129 makeStyles-notAllowed-148"
          >
            <div
              class="MuiGrid-root makeStyles-root-129 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-inputsDiv-133 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
              >
                <div
                  class="MuiGrid-root makeStyles-textfield-132 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <div
                      class="makeStyles-input-131"
                      contenteditable="false"
                      data-testid="messageInput"
                      disabled=""
                      placeholder="Message #channel as @user"
                    >
                      
                    </div>
                  </div>
                  <div
                    class="makeStyles-icons-150"
                  >
                    <div
                      class="MuiGrid-root makeStyles-actions-142 MuiGrid-item"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                      >
                        <img
                          class="makeStyles-emoji-140"
                          src="test-file-stub"
                        />
                        <input
                          accept="image/*"
                          hidden=""
                          multiple=""
                          type="file"
                        />
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root makeStyles-actions-142 MuiGrid-item"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                      >
                        <img
                          class="makeStyles-emoji-140"
                          src="test-file-stub"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-boot-256 MuiGrid-container"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <span
                    class="MuiTypography-root makeStyles-info-254 MuiTypography-caption"
                  >
                    Initializing community. This may take a few minutes...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('user can copy/paste images to message input', async () => {
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }))
    window.HTMLElement.prototype.scrollTo = jest.fn()
    document.execCommand = jest.fn()
    const mockHandleClipboardFiles = jest.fn()
    const mockUnsupportedModalHandleOpen = jest.fn()

    // preparing image data
    const base64Image =
      'iVBORw0KGgoAAAANSUhEUgAAAAcAAAAICAYAAAA1BOUGAAAAAXNSR0IB2cksfwAAABVJREFUCJljVFBU+c+AAzDhkhh6kgBGDQF0RFVIuQAAAABJRU5ErkJggg=='
    const binaryString = window.atob(base64Image)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const { store } = await prepareStore()
    const factory = await getFactory(store)
    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
      'Identity',
      { nickname: 'alice' }
    )

    const fileContent: FileContent = {
      path: `data:image/jpeg;base64,${base64Image}`,
      name: 'imageName',
      ext: '.png'
    }

    const fileData = {
      ...fileContent,
      arrayBuffer: bytes.buffer // need for test
    }

    renderComponent(
      <ChannelInputComponent
        channelAddress={'channelAddress'}
        channelName={'channelName'}
        inputPlaceholder='#channel as @user'
        onChange={jest.fn()}
        onKeyPress={jest.fn()}
        infoClass={''}
        setInfoClass={jest.fn()}
        inputState={INPUT_STATE.NOT_CONNECTED}
        openFilesDialog={jest.fn()}
        handleClipboardFiles={mockHandleClipboardFiles}
        handleOpenFiles={jest.fn()}
      />,
      store
    )

    const input = screen.getByPlaceholderText('Message #channel as @user')

    // mock onPaste event
    const paste = createEvent.paste(input, {
      clipboardData: {
        getData: () => '',
        files: [
          {
            lastModified: 1654601730013,
            lastModifiedDate: 'Tue Jun 07 2022 13: 35: 30 GMT + 0200',
            name: `${fileData.name}${fileData.ext}`,
            path: '',
            size: 4135,
            type: 'image/png',
            webkitRelativePath: '',
            arrayBuffer: () => fileData.arrayBuffer
          }
        ]
      }
    })

    await fireEvent(input, paste)

    expect(mockHandleClipboardFiles).toHaveBeenCalled()
    expect(mockHandleClipboardFiles).toHaveBeenCalledWith(
      fileData.arrayBuffer,
      fileData.ext,
      fileData.name
    )

    const filesData = {
      1: {
        path: fileData.path,
        name: fileData.name,
        ext: fileData.ext
      }
    }

    const filesDataWithUnsuportedFile = {
      1: {
        path: fileData.path,
        name: fileData.name,
        ext: '.unsupported'
      }
    }

    renderComponent(
      <UploadFilesPreviewsComponent filesData={filesData} removeFile={jest.fn()} />,
      store
    )

    // image with data from onPaste event appear
    const image: HTMLImageElement = screen.getByAltText(fileData.name)
    expect(image.src).toBe(fileData.path)

    // unsupported file modal did not appear with supported file ext
    expect(mockUnsupportedModalHandleOpen).not.toHaveBeenCalled()

    renderComponent(
      <UploadFilesPreviewsComponent
        filesData={filesDataWithUnsuportedFile}
        removeFile={jest.fn()}
      />,
      store
    )

    // unsupported file modal appear with unsupported file ext
    expect(mockUnsupportedModalHandleOpen).toHaveBeenCalled()
  })
})
