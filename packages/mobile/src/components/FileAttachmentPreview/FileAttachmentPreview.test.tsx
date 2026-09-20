import React from 'react'
import { StyleSheet } from 'react-native'
import { fireEvent } from '@testing-library/react-native'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import FileAttachmentPreview from './FileAttachmentPreview.component'
import { FilePreviewData } from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('attachingPreview:test')

describe('FileAttachmentPreview component', () => {
  it('renders properly for image and document', () => {
    const pickedFiles: FilePreviewData = {
      '12345': {
        path: 'file://data/0/myFile.jpg',
        name: 'myFile.jpg',
        ext: '.jpg',
      },
      '54321': {
        path: 'file://data/0/otherfile.txt',
        name: 'otherfile.txt',
        ext: '.txt',
      },
    }
    const { toJSON } = renderComponent(
      <FileAttachmentPreview
        filesData={pickedFiles}
        removeFile={function (id: string): void {
          logger.info(`removeFile ${id}`)
        }}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <RCTScrollView
        contentContainerStyle={
          {
            "flexDirection": "row",
            "flexWrap": "wrap",
            "justifyContent": "flex-start",
            "marginTop": 15,
          }
        }
        horizontal={true}
      >
        <View>
          <View
            style={
              {
                "alignItems": "flex-start",
                "flexWrap": "nowrap",
              }
            }
          >
            <View
              accessibilityLabel="Remove myFile.jpg"
              accessibilityRole="button"
              accessibilityState={
                {
                  "busy": undefined,
                  "checked": undefined,
                  "disabled": undefined,
                  "expanded": undefined,
                  "selected": undefined,
                }
              }
              accessible={true}
              focusable={true}
              onClick={[Function]}
              onResponderGrant={[Function]}
              onResponderMove={[Function]}
              onResponderRelease={[Function]}
              onResponderTerminate={[Function]}
              onResponderTerminationRequest={[Function]}
              onStartShouldSetResponder={[Function]}
              style={
                {
                  "alignItems": "flex-end",
                  "height": 44,
                  "justifyContent": "flex-start",
                  "position": "absolute",
                  "right": 0,
                  "top": 0,
                  "width": 44,
                  "zIndex": 1000,
                }
              }
              testID="remove_file_myFile.jpg"
            >
              <View
                style={
                  {
                    "alignItems": "center",
                    "backgroundColor": "#ffffff",
                    "borderColor": "#B8B8B8",
                    "borderRadius": 11,
                    "borderWidth": 1,
                    "height": 22,
                    "justifyContent": "center",
                    "width": 22,
                  }
                }
              >
                <Image
                  source={
                    {
                      "testUri": "../../../src/assets/icons/png/icon_close.png",
                    }
                  }
                  style={
                    {
                      "height": 10,
                      "width": 10,
                    }
                  }
                />
              </View>
            </View>
            <View
              style={
                {
                  "height": 64,
                  "marginRight": 10,
                  "marginTop": 10,
                }
              }
            >
              <Image
                alt="myFile.jpg"
                source={
                  {
                    "uri": "file://data/0/myFile.jpg",
                  }
                }
                style={
                  {
                    "borderRadius": 15,
                    "height": 64,
                    "width": 64,
                  }
                }
              />
            </View>
          </View>
          <View
            style={
              {
                "alignItems": "flex-start",
                "flexWrap": "nowrap",
              }
            }
          >
            <View
              accessibilityLabel="Remove otherfile.txt"
              accessibilityRole="button"
              accessibilityState={
                {
                  "busy": undefined,
                  "checked": undefined,
                  "disabled": undefined,
                  "expanded": undefined,
                  "selected": undefined,
                }
              }
              accessible={true}
              focusable={true}
              onClick={[Function]}
              onResponderGrant={[Function]}
              onResponderMove={[Function]}
              onResponderRelease={[Function]}
              onResponderTerminate={[Function]}
              onResponderTerminationRequest={[Function]}
              onStartShouldSetResponder={[Function]}
              style={
                {
                  "alignItems": "flex-end",
                  "height": 44,
                  "justifyContent": "flex-start",
                  "position": "absolute",
                  "right": 0,
                  "top": 0,
                  "width": 44,
                  "zIndex": 1000,
                }
              }
              testID="remove_file_otherfile.txt"
            >
              <View
                style={
                  {
                    "alignItems": "center",
                    "backgroundColor": "#ffffff",
                    "borderColor": "#B8B8B8",
                    "borderRadius": 11,
                    "borderWidth": 1,
                    "height": 22,
                    "justifyContent": "center",
                    "width": 22,
                  }
                }
              >
                <Image
                  source={
                    {
                      "testUri": "../../../src/assets/icons/png/icon_close.png",
                    }
                  }
                  style={
                    {
                      "height": 10,
                      "width": 10,
                    }
                  }
                />
              </View>
            </View>
            <View
              style={
                {
                  "height": 64,
                  "marginRight": 10,
                  "marginTop": 10,
                }
              }
            >
              <View
                style={
                  {
                    "alignItems": "center",
                    "borderColor": "#F0F0F0",
                    "borderRadius": 15,
                    "borderStyle": "solid",
                    "borderWidth": 1,
                    "display": "flex",
                    "height": 64,
                    "justifyContent": "center",
                  }
                }
              >
                <View
                  style={
                    {
                      "flexDirection": "row",
                    }
                  }
                >
                  <Image
                    source={
                      {
                        "testUri": "../../../src/assets/icons/png/file_document.png",
                      }
                    }
                    style={
                      {
                        "height": 40,
                        "marginLeft": 5,
                        "marginRight": 5,
                        "width": 32,
                      }
                    }
                  />
                  <View
                    style={
                      {
                        "marginRight": 5,
                        "maxWidth": 100,
                      }
                    }
                  >
                    <Text
                      color="main"
                      fontSize={12}
                      horizontalTextAlign="left"
                      numberOfLines={1}
                      style={
                        [
                          {
                            "color": "#000000",
                            "fontFamily": "Rubik-Regular",
                            "fontSize": 12,
                            "textAlign": "left",
                            "textAlignVertical": "center",
                          },
                          {
                            "fontWeight": "bold",
                          },
                        ]
                      }
                      verticalTextAlign="center"
                    >
                      otherfile.txt
                    </Text>
                    <Text
                      color="main"
                      fontSize={12}
                      horizontalTextAlign="left"
                      style={
                        [
                          {
                            "color": "#000000",
                            "fontFamily": "Rubik-Regular",
                            "fontSize": 12,
                            "textAlign": "left",
                            "textAlignVertical": "center",
                          },
                        ]
                      }
                      verticalTextAlign="center"
                    >
                      .txt
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </RCTScrollView>
    `)
  })
})

describe('remove-attachment control', () => {
  const oneFile: FilePreviewData = {
    '12345': { path: 'file://data/0/myFile.jpg', name: 'myFile.jpg', ext: '.jpg' },
  }

  it('is at least 44x44, the only way to drop a file picked by mistake', () => {
    const { getByTestId } = renderComponent(<FileAttachmentPreview filesData={oneFile} removeFile={jest.fn()} />)

    const style = StyleSheet.flatten(getByTestId('remove_file_myFile.jpg').props.style)
    expect(style.width).toBeGreaterThanOrEqual(44)
    expect(style.height).toBeGreaterThanOrEqual(44)
  })

  it('keeps the whole target inside its parent, which is what Android needs to deliver the touch', () => {
    const { getByTestId } = renderComponent(<FileAttachmentPreview filesData={oneFile} removeFile={jest.fn()} />)

    // Negative insets put the control outside the parent's bounds, where Android drops touches on
    // it. The overhang belongs to the thumbnail's margin instead, so these stay at zero.
    const style = StyleSheet.flatten(getByTestId('remove_file_myFile.jpg').props.style)
    expect(style.top).toBe(0)
    expect(style.right).toBe(0)
  })

  it('removes the file it names when tapped', () => {
    const removeFile = jest.fn()
    const { getByTestId } = renderComponent(<FileAttachmentPreview filesData={oneFile} removeFile={removeFile} />)

    fireEvent.press(getByTestId('remove_file_myFile.jpg'))
    expect(removeFile).toHaveBeenCalledWith('12345')
  })

  it('announces which file it removes, since the glyph is a bare x', () => {
    const { getByLabelText } = renderComponent(<FileAttachmentPreview filesData={oneFile} removeFile={jest.fn()} />)

    expect(getByLabelText('Remove myFile.jpg')).toBeTruthy()
  })
})
