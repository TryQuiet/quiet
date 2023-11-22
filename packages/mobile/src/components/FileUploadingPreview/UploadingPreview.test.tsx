import React from 'react'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import UploadingPreview from './UploadingPreview.component'
import { FilePreviewData } from '@quiet/types'

describe('UploadingPreview component', () => {
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
            <UploadingPreview
                filesData={pickedFiles}
                removeFile={function (id: string): void {
                    console.log(`removeFile ${id}`)
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
                "marginRight": 10,
                "marginTop": 10,
              }
            }
          >
            <View
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
                  "backgroundColor": "#ffffff",
                  "borderColor": "#B8B8B8",
                  "borderRadius": 100,
                  "borderWidth": 1,
                  "height": 22,
                  "justifyContent": "center",
                  "marginLeft": 0,
                  "padding": 0,
                  "position": "absolute",
                  "right": -10,
                  "top": -10,
                  "width": 22,
                  "zIndex": 1000,
                }
              }
            >
              <Image
                source={
                  {
                    "testUri": "../../../assets/icons/icon_close.png",
                  }
                }
                style={
                  {
                    "alignSelf": "center",
                    "height": 10,
                    "position": "relative",
                    "width": 10,
                  }
                }
              />
            </View>
            <View
              style={
                {
                  "height": 64,
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
                "marginRight": 10,
                "marginTop": 10,
              }
            }
          >
            <View
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
                  "backgroundColor": "#ffffff",
                  "borderColor": "#B8B8B8",
                  "borderRadius": 100,
                  "borderWidth": 1,
                  "height": 22,
                  "justifyContent": "center",
                  "marginLeft": 0,
                  "padding": 0,
                  "position": "absolute",
                  "right": -10,
                  "top": -10,
                  "width": 22,
                  "zIndex": 1000,
                }
              }
            >
              <Image
                source={
                  {
                    "testUri": "../../../assets/icons/icon_close.png",
                  }
                }
                style={
                  {
                    "alignSelf": "center",
                    "height": 10,
                    "position": "relative",
                    "width": 10,
                  }
                }
              />
            </View>
            <View
              style={
                {
                  "height": 64,
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
                        "testUri": "../../../assets/icons/file_document.png",
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
