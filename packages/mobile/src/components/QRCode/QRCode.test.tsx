import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

import { QRCode } from './QRCode.component'

describe('QRCode component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <QRCode
        value={'https://tryquiet.org/join#'}
        shareCode={jest.fn()}
        handleBackButton={jest.fn()}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Object {
            "backgroundColor": "#ffffff",
            "flex": 1,
          }
        }
      >
        <View
          style={
            Array [
              Object {
                "backgroundColor": "#ffffff",
                "borderBottomColor": "#F0F0F0",
                "borderBottomWidth": 1,
                "flexDirection": "row",
                "flexGrow": 1,
                "maxHeight": 52,
                "minHeight": 52,
              },
            ]
          }
        >
          <View
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
              Object {
                "alignItems": "center",
                "justifyContent": "center",
                "width": 64,
              }
            }
          >
            <Image
              resizeMethod="resize"
              resizeMode="cover"
              source={
                Object {
                  "testUri": "../../../assets/icons/arrow_left.png",
                }
              }
              style={
                Object {
                  "height": 16,
                  "width": 16,
                }
              }
            />
          </View>
          <View
            style={
              Object {
                "alignItems": "center",
                "flexGrow": 1,
                "justifyContent": "center",
              }
            }
          >
            <Text
              color="main"
              fontSize={16}
              fontWeight="medium"
              horizontalTextAlign="left"
              style={
                Array [
                  Object {
                    "color": "#000000",
                    "fontFamily": "Rubik-Medium",
                    "fontSize": 16,
                    "textAlign": "left",
                    "textAlignVertical": "center",
                  },
                ]
              }
              verticalTextAlign="center"
            >
              QR Code
            </Text>
          </View>
          <View
            style={
              Object {
                "width": 64,
              }
            }
          />
        </View>
        <View
          style={
            Object {
              "alignItems": "center",
              "display": "flex",
              "flexDirection": "column",
              "padding": 16,
            }
          }
        >
          <View
            style={
              Object {
                "margin": 16,
              }
            }
          >
            <RNSVGSvgView
              align="xMidYMid"
              bbHeight="172"
              bbWidth="172"
              focusable={false}
              height={172}
              meetOrSlice={0}
              minX={0}
              minY={0}
              style={
                Array [
                  Object {
                    "backgroundColor": "transparent",
                    "borderWidth": 0,
                  },
                  Object {
                    "flex": 0,
                    "height": 172,
                    "width": 172,
                  },
                ]
              }
              vbHeight={172}
              vbWidth={172}
              width={172}
            >
              <RNSVGGroup
                fill={
                  Object {
                    "payload": 4278190080,
                    "type": 0,
                  }
                }
              >
                <RNSVGDefs>
                  <RNSVGLinearGradient
                    gradient={
                      Array [
                        0,
                        -65536,
                        1,
                        -16711681,
                      ]
                    }
                    gradientTransform={null}
                    gradientUnits={0}
                    name="grad"
                    x1="0%"
                    x2="100%"
                    y1="0%"
                    y2="100%"
                  />
                </RNSVGDefs>
                <RNSVGGroup
                  fill={
                    Object {
                      "payload": 4278190080,
                      "type": 0,
                    }
                  }
                >
                  <RNSVGRect
                    fill={
                      Object {
                        "payload": 4294967295,
                        "type": 0,
                      }
                    }
                    height="172"
                    propList={
                      Array [
                        "fill",
                      ]
                    }
                    width="172"
                    x="0"
                    y="0"
                  />
                </RNSVGGroup>
                <RNSVGGroup
                  fill={
                    Object {
                      "payload": 4278190080,
                      "type": 0,
                    }
                  }
                >
                  <RNSVGPath
                    d="M0 3.44 L48.16 3.44 M75.67999999999999 3.44 L96.32 3.44 M110.08 3.44 L116.96 3.44 M123.84 3.44 L172 3.44 M0 10.32 L6.88 10.32 M41.28 10.32 L48.16 10.32 M68.8 10.32 L75.67999999999999 10.32 M89.44 10.32 L110.08 10.32 M123.84 10.32 L130.72 10.32 M165.12 10.32 L172 10.32 M0 17.2 L6.88 17.2 M13.76 17.2 L34.4 17.2 M41.28 17.2 L48.16 17.2 M55.04 17.2 L61.92 17.2 M75.67999999999999 17.2 L82.56 17.2 M96.32 17.2 L103.2 17.2 M110.08 17.2 L116.96 17.2 M123.84 17.2 L130.72 17.2 M137.6 17.2 L158.24 17.2 M165.12 17.2 L172 17.2 M0 24.080000000000002 L6.88 24.080000000000002 M13.76 24.080000000000002 L34.4 24.080000000000002 M41.28 24.080000000000002 L48.16 24.080000000000002 M55.04 24.080000000000002 L82.56 24.080000000000002 M89.44 24.080000000000002 L103.2 24.080000000000002 M123.84 24.080000000000002 L130.72 24.080000000000002 M137.6 24.080000000000002 L158.24 24.080000000000002 M165.12 24.080000000000002 L172 24.080000000000002 M0 30.96 L6.88 30.96 M13.76 30.96 L34.4 30.96 M41.28 30.96 L48.16 30.96 M55.04 30.96 L75.67999999999999 30.96 M82.56 30.96 L89.44 30.96 M96.32 30.96 L103.2 30.96 M123.84 30.96 L130.72 30.96 M137.6 30.96 L158.24 30.96 M165.12 30.96 L172 30.96 M0 37.839999999999996 L6.88 37.839999999999996 M41.28 37.839999999999996 L48.16 37.839999999999996 M55.04 37.839999999999996 L61.92 37.839999999999996 M68.8 37.839999999999996 L75.67999999999999 37.839999999999996 M82.56 37.839999999999996 L96.32 37.839999999999996 M103.2 37.839999999999996 L110.08 37.839999999999996 M123.84 37.839999999999996 L130.72 37.839999999999996 M165.12 37.839999999999996 L172 37.839999999999996 M0 44.72 L48.16 44.72 M55.04 44.72 L61.92 44.72 M68.8 44.72 L75.67999999999999 44.72 M82.56 44.72 L89.44 44.72 M96.32 44.72 L103.2 44.72 M110.08 44.72 L116.96 44.72 M123.84 44.72 L172 44.72 M55.04 51.599999999999994 L61.92 51.599999999999994 M82.56 51.599999999999994 L89.44 51.599999999999994 M103.2 51.599999999999994 L116.96 51.599999999999994 M0 58.48 L6.88 58.48 M13.76 58.48 L48.16 58.48 M61.92 58.48 L68.8 58.48 M75.67999999999999 58.48 L116.96 58.48 M123.84 58.48 L158.24 58.48 M0 65.36 L6.88 65.36 M13.76 65.36 L20.64 65.36 M48.16 65.36 L68.8 65.36 M75.67999999999999 65.36 L89.44 65.36 M110.08 65.36 L123.84 65.36 M130.72 65.36 L137.6 65.36 M158.24 65.36 L165.12 65.36 M0 72.24 L20.64 72.24 M41.28 72.24 L48.16 72.24 M82.56 72.24 L116.96 72.24 M123.84 72.24 L130.72 72.24 M144.48 72.24 L151.35999999999999 72.24 M158.24 72.24 L172 72.24 M0 79.11999999999999 L34.4 79.11999999999999 M55.04 79.11999999999999 L61.92 79.11999999999999 M75.67999999999999 79.11999999999999 L89.44 79.11999999999999 M96.32 79.11999999999999 L116.96 79.11999999999999 M130.72 79.11999999999999 L137.6 79.11999999999999 M165.12 79.11999999999999 L172 79.11999999999999 M0 86 L13.76 86 M20.64 86 L27.52 86 M41.28 86 L55.04 86 M68.8 86 L96.32 86 M103.2 86 L110.08 86 M116.96 86 L144.48 86 M151.35999999999999 86 L172 86 M0 92.88 L13.76 92.88 M82.56 92.88 L96.32 92.88 M110.08 92.88 L123.84 92.88 M130.72 92.88 L137.6 92.88 M144.48 92.88 L151.35999999999999 92.88 M158.24 92.88 L165.12 92.88 M0 99.75999999999999 L6.88 99.75999999999999 M20.64 99.75999999999999 L34.4 99.75999999999999 M41.28 99.75999999999999 L55.04 99.75999999999999 M61.92 99.75999999999999 L68.8 99.75999999999999 M89.44 99.75999999999999 L116.96 99.75999999999999 M130.72 99.75999999999999 L151.35999999999999 99.75999999999999 M158.24 99.75999999999999 L172 99.75999999999999 M0 106.64 L6.88 106.64 M34.4 106.64 L41.28 106.64 M55.04 106.64 L89.44 106.64 M96.32 106.64 L110.08 106.64 M116.96 106.64 L144.48 106.64 M165.12 106.64 L172 106.64 M0 113.52 L6.88 113.52 M13.76 113.52 L27.52 113.52 M34.4 113.52 L48.16 113.52 M55.04 113.52 L75.67999999999999 113.52 M82.56 113.52 L103.2 113.52 M110.08 113.52 L144.48 113.52 M151.35999999999999 113.52 L158.24 113.52 M55.04 120.39999999999999 L61.92 120.39999999999999 M68.8 120.39999999999999 L96.32 120.39999999999999 M103.2 120.39999999999999 L116.96 120.39999999999999 M137.6 120.39999999999999 L151.35999999999999 120.39999999999999 M0 127.28 L48.16 127.28 M61.92 127.28 L75.67999999999999 127.28 M82.56 127.28 L96.32 127.28 M110.08 127.28 L116.96 127.28 M123.84 127.28 L130.72 127.28 M137.6 127.28 L144.48 127.28 M151.35999999999999 127.28 L172 127.28 M0 134.16 L6.88 134.16 M41.28 134.16 L48.16 134.16 M55.04 134.16 L61.92 134.16 M68.8 134.16 L82.56 134.16 M110.08 134.16 L116.96 134.16 M137.6 134.16 L151.35999999999999 134.16 M0 141.04 L6.88 141.04 M13.76 141.04 L34.4 141.04 M41.28 141.04 L48.16 141.04 M55.04 141.04 L61.92 141.04 M68.8 141.04 L144.48 141.04 M151.35999999999999 141.04 L158.24 141.04 M0 147.92 L6.88 147.92 M13.76 147.92 L34.4 147.92 M41.28 147.92 L48.16 147.92 M55.04 147.92 L68.8 147.92 M75.67999999999999 147.92 L82.56 147.92 M89.44 147.92 L96.32 147.92 M116.96 147.92 L130.72 147.92 M137.6 147.92 L172 147.92 M0 154.79999999999998 L6.88 154.79999999999998 M13.76 154.79999999999998 L34.4 154.79999999999998 M41.28 154.79999999999998 L48.16 154.79999999999998 M55.04 154.79999999999998 L75.67999999999999 154.79999999999998 M89.44 154.79999999999998 L103.2 154.79999999999998 M116.96 154.79999999999998 L123.84 154.79999999999998 M144.48 154.79999999999998 L158.24 154.79999999999998 M165.12 154.79999999999998 L172 154.79999999999998 M0 161.68 L6.88 161.68 M41.28 161.68 L48.16 161.68 M82.56 161.68 L89.44 161.68 M96.32 161.68 L103.2 161.68 M110.08 161.68 L116.96 161.68 M123.84 161.68 L151.35999999999999 161.68 M165.12 161.68 L172 161.68 M0 168.56 L48.16 168.56 M55.04 168.56 L103.2 168.56 M116.96 168.56 L172 168.56 "
                    fill={
                      Object {
                        "payload": 4278190080,
                        "type": 0,
                      }
                    }
                    propList={
                      Array [
                        "stroke",
                        "strokeWidth",
                        "strokeLinecap",
                      ]
                    }
                    stroke={
                      Object {
                        "payload": 4278190080,
                        "type": 0,
                      }
                    }
                    strokeLinecap={0}
                    strokeWidth="6.88"
                  />
                </RNSVGGroup>
              </RNSVGGroup>
            </RNSVGSvgView>
          </View>
          <View
            style={
              Object {
                "marginTop": 16,
                "width": 340,
              }
            }
          >
            <Text
              color="main"
              fontSize={14}
              fontWeight="normal"
              horizontalTextAlign="left"
              style={
                Array [
                  Object {
                    "color": "#000000",
                    "fontFamily": "Rubik-Regular",
                    "fontSize": 14,
                    "textAlign": "left",
                    "textAlignVertical": "center",
                  },
                  Object {
                    "lineHeight": 20,
                    "textAlign": "center",
                  },
                ]
              }
              verticalTextAlign="center"
            >
              This community QR code is private. If it is shared with someone, they can scan it with their camera to join this community.
            </Text>
          </View>
          <View
            style={
              Object {
                "marginTop": 16,
                "width": 124,
              }
            }
          >
            <View
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
                Object {
                  "alignItems": "center",
                  "backgroundColor": "#521C74",
                  "borderRadius": 5,
                  "justifyContent": "center",
                  "marginVertical": 12,
                  "minHeight": 45,
                  "paddingVertical": 12,
                }
              }
            >
              <Text
                color="white"
                fontSize={14}
                horizontalTextAlign="left"
                style={
                  Array [
                    Object {
                      "color": "#ffffff",
                      "fontFamily": "Rubik-Regular",
                      "fontSize": 14,
                      "textAlign": "left",
                      "textAlignVertical": "center",
                    },
                  ]
                }
                verticalTextAlign="center"
              >
                Share code
              </Text>
            </View>
          </View>
        </View>
      </View>
    `)
  })
})
