import { MessageType } from '@quiet/state-manager'
import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Message } from './Message.component'

describe('Message component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <Message
        data={[
          {
            id: 'id',
            type: MessageType.Basic,
            message:
              'Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.',
            createdAt: 0,
            date: '1:30pm',
            nickname: 'holmes'
          }
        ]}
        pendingMessages={{}}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Object {
            "flex": 1,
          }
        }
      >
        <View
          style={
            Object {
              "flexDirection": "row",
              "paddingBottom": 30,
            }
          }
        >
          <View
            style={
              Object {
                "alignItems": "center",
                "flex": 1,
                "paddingRight": 15,
              }
            }
          >
            <View
              style={
                Object {
                  "width": 37,
                }
              }
            >
              <RNSVGSvgView
                align="xMidYMid"
                bbHeight="37"
                bbWidth="37"
                focusable={false}
                height={37}
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
                      "height": 37,
                      "width": 37,
                    },
                  ]
                }
                vbHeight={37}
                vbWidth={37}
                width={37}
                xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#4c4c4c\\" d=\\"M12.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M19.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M19.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M12.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 14.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 14.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 21.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 21.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0\\"/><path fill=\\"#e5e5e5\\" d=\\"M5.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0\\"/><path fill=\\"#ccc566\\" d=\\"M11 11L18 11L18 18L11 18ZM15.6 17.3L17.3 13.8L13.8 13.8ZM25 11L25 18L18 18L18 11ZM18.7 15.6L22.2 17.3L22.2 13.8ZM25 25L18 25L18 18L25 18ZM20.5 18.7L18.7 22.2L22.2 22.2ZM11 25L11 18L18 18L18 25ZM17.3 20.5L13.8 18.7L13.8 22.2Z\\"/></svg>"
                xmlns="http://www.w3.org/2000/svg"
              >
                <RNSVGGroup
                  fill={
                    Object {
                      "payload": 4278190080,
                      "type": 0,
                    }
                  }
                >
                  <RNSVGPath
                    d="M12.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M19.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M19.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M12.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 14.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 14.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 21.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 21.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0"
                    fill={
                      Object {
                        "payload": 4283190348,
                        "type": 0,
                      }
                    }
                    propList={
                      Array [
                        "fill",
                      ]
                    }
                  />
                  <RNSVGPath
                    d="M5.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 7.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M26.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0M5.2 28.5a2.3,2.3 0 1,1 4.7,0a2.3,2.3 0 1,1 -4.7,0"
                    fill={
                      Object {
                        "payload": 4293256677,
                        "type": 0,
                      }
                    }
                    propList={
                      Array [
                        "fill",
                      ]
                    }
                  />
                  <RNSVGPath
                    d="M11 11L18 11L18 18L11 18ZM15.6 17.3L17.3 13.8L13.8 13.8ZM25 11L25 18L18 18L18 11ZM18.7 15.6L22.2 17.3L22.2 13.8ZM25 25L18 25L18 18L25 18ZM20.5 18.7L18.7 22.2L22.2 22.2ZM11 25L11 18L18 18L18 25ZM17.3 20.5L13.8 18.7L13.8 22.2Z"
                    fill={
                      Object {
                        "payload": 4291609958,
                        "type": 0,
                      }
                    }
                    propList={
                      Array [
                        "fill",
                      ]
                    }
                  />
                </RNSVGGroup>
              </RNSVGSvgView>
            </View>
          </View>
          <View
            style={
              Object {
                "flex": 8,
              }
            }
          >
            <View
              style={
                Object {
                  "flexDirection": "row",
                  "paddingBottom": 3,
                }
              }
            >
              <View
                style={
                  Object {
                    "alignSelf": "flex-start",
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
                  holmes
                </Text>
              </View>
              <View
                style={
                  Object {
                    "alignSelf": "flex-start",
                    "paddingLeft": 8,
                    "paddingTop": 2,
                  }
                }
              >
                <Text
                  color="subtitle"
                  fontSize={14}
                  horizontalTextAlign="left"
                  style={
                    Array [
                      Object {
                        "color": "#999999",
                        "fontFamily": "Rubik-Regular",
                        "fontSize": 14,
                        "textAlign": "left",
                        "textAlignVertical": "center",
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  1:30pm
                </Text>
              </View>
            </View>
            <View
              style={
                Object {
                  "flexShrink": 1,
                }
              }
            >
              <View
                style={
                  Object {
                    "paddingTop": 0,
                  }
                }
              >
                <Text
                  color="main"
                  fontSize={14}
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
                    ]
                  }
                  verticalTextAlign="center"
                >
                  Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    `)
  })

  it('should match inline snapshot for message with mathjax content', () => {
    const { toJSON } = renderComponent(
      <Message
        data={[
          {
            id: 'id',
            type: MessageType.Basic,
            message: 'Hello! Does in-line LaTeX work? $$sum_{i=0}^n i = \frac{n(n+1)}{2}$$',
            createdAt: 0,
            date: '1:30pm',
            nickname: 'somebody'
          }
        ]}
        pendingMessages={{}}
      />
    )

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Object {
            "flex": 1,
          }
        }
      >
        <View
          style={
            Object {
              "flexDirection": "row",
              "paddingBottom": 30,
            }
          }
        >
          <View
            style={
              Object {
                "alignItems": "center",
                "flex": 1,
                "paddingRight": 15,
              }
            }
          >
            <View
              style={
                Object {
                  "width": 37,
                }
              }
            >
              <RNSVGSvgView
                align="xMidYMid"
                bbHeight="37"
                bbWidth="37"
                focusable={false}
                height={37}
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
                      "height": 37,
                      "width": 37,
                    },
                  ]
                }
                vbHeight={37}
                vbWidth={37}
                width={37}
                xml="<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"37\\" height=\\"37\\" viewBox=\\"0 0 37 37\\"><path fill=\\"#e5e5e5\\" d=\\"M11 11L11 4L14.5 4ZM18 4L25 4L25 7.5ZM25 25L25 32L21.5 32ZM18 32L11 32L11 28.5ZM4 18L4 11L7.5 11ZM25 11L32 11L32 14.5ZM32 18L32 25L28.5 25ZM11 25L4 25L4 21.5Z\\"/><path fill=\\"#cc9966\\" d=\\"M4 4L11 4L11 11ZM32 4L32 11L25 11ZM32 32L25 32L25 25ZM4 32L4 25L11 25Z\\"/><path fill=\\"#996632\\" d=\\"M13 13L17 13L17 17L13 17ZM23 13L23 17L19 17L19 13ZM23 23L19 23L19 19L23 19ZM13 23L13 19L17 19L17 23Z\\"/></svg>"
                xmlns="http://www.w3.org/2000/svg"
              >
                <RNSVGGroup
                  fill={
                    Object {
                      "payload": 4278190080,
                      "type": 0,
                    }
                  }
                >
                  <RNSVGPath
                    d="M11 11L11 4L14.5 4ZM18 4L25 4L25 7.5ZM25 25L25 32L21.5 32ZM18 32L11 32L11 28.5ZM4 18L4 11L7.5 11ZM25 11L32 11L32 14.5ZM32 18L32 25L28.5 25ZM11 25L4 25L4 21.5Z"
                    fill={
                      Object {
                        "payload": 4293256677,
                        "type": 0,
                      }
                    }
                    propList={
                      Array [
                        "fill",
                      ]
                    }
                  />
                  <RNSVGPath
                    d="M4 4L11 4L11 11ZM32 4L32 11L25 11ZM32 32L25 32L25 25ZM4 32L4 25L11 25Z"
                    fill={
                      Object {
                        "payload": 4291598694,
                        "type": 0,
                      }
                    }
                    propList={
                      Array [
                        "fill",
                      ]
                    }
                  />
                  <RNSVGPath
                    d="M13 13L17 13L17 17L13 17ZM23 13L23 17L19 17L19 13ZM23 23L19 23L19 19L23 19ZM13 23L13 19L17 19L17 23Z"
                    fill={
                      Object {
                        "payload": 4288243250,
                        "type": 0,
                      }
                    }
                    propList={
                      Array [
                        "fill",
                      ]
                    }
                  />
                </RNSVGGroup>
              </RNSVGSvgView>
            </View>
          </View>
          <View
            style={
              Object {
                "flex": 8,
              }
            }
          >
            <View
              style={
                Object {
                  "flexDirection": "row",
                  "paddingBottom": 3,
                }
              }
            >
              <View
                style={
                  Object {
                    "alignSelf": "flex-start",
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
                  somebody
                </Text>
              </View>
              <View
                style={
                  Object {
                    "alignSelf": "flex-start",
                    "paddingLeft": 8,
                    "paddingTop": 2,
                  }
                }
              >
                <Text
                  color="subtitle"
                  fontSize={14}
                  horizontalTextAlign="left"
                  style={
                    Array [
                      Object {
                        "color": "#999999",
                        "fontFamily": "Rubik-Regular",
                        "fontSize": 14,
                        "textAlign": "left",
                        "textAlignVertical": "center",
                      },
                    ]
                  }
                  verticalTextAlign="center"
                >
                  1:30pm
                </Text>
              </View>
            </View>
            <View
              style={
                Object {
                  "flexShrink": 1,
                }
              }
            >
              <View
                style={
                  Object {
                    "paddingTop": 0,
                  }
                }
              >
                <View
                  style={
                    Object {
                      "flexDirection": "row",
                      "flexShrink": 1,
                      "flexWrap": "wrap",
                    }
                  }
                >
                  <Text
                    style={
                      Object {
                        "color": "#000000",
                        "fontSize": 14,
                      }
                    }
                  >
                    Hello! Does in-line LaTeX work? 
                  </Text>
                  <RNSVGSvgView
                    align="xMidYMid"
                    bbHeight="16.709ex"
                    bbWidth="174.34199999999998ex"
                    focusable={false}
                    height="16.709ex"
                    meetOrSlice={0}
                    minX={0}
                    minY={-750}
                    role="img"
                    style={
                      Array [
                        Object {
                          "backgroundColor": "transparent",
                          "borderWidth": 0,
                        },
                        Object {
                          "verticalAlign": "-0.69ex",
                        },
                        Object {
                          "flex": 0,
                          "height": 16,
                          "width": 174,
                        },
                      ]
                    }
                    vbHeight={1055}
                    vbWidth={11008.6}
                    width="174.34199999999998ex"
                    xml="<svg style=\\"vertical-align: -0.69ex\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"174.34199999999998ex\\" height=\\"16.709ex\\" role=\\"img\\" focusable=\\"false\\" viewBox=\\"0 -750 11008.6 1055\\" xmlns:xlink=\\"http://www.w3.org/1999/xlink\\"><defs><path id=\\"MJX-1-TEX-I-1D460\\" d=\\"M131 289Q131 321 147 354T203 415T300 442Q362 442 390 415T419 355Q419 323 402 308T364 292Q351 292 340 300T328 326Q328 342 337 354T354 372T367 378Q368 378 368 379Q368 382 361 388T336 399T297 405Q249 405 227 379T204 326Q204 301 223 291T278 274T330 259Q396 230 396 163Q396 135 385 107T352 51T289 7T195 -10Q118 -10 86 19T53 87Q53 126 74 143T118 160Q133 160 146 151T160 120Q160 94 142 76T111 58Q109 57 108 57T107 55Q108 52 115 47T146 34T201 27Q237 27 263 38T301 66T318 97T323 122Q323 150 302 164T254 181T195 196T148 231Q131 256 131 289Z\\"></path><path id=\\"MJX-1-TEX-I-1D462\\" d=\\"M21 287Q21 295 30 318T55 370T99 420T158 442Q204 442 227 417T250 358Q250 340 216 246T182 105Q182 62 196 45T238 27T291 44T328 78L339 95Q341 99 377 247Q407 367 413 387T427 416Q444 431 463 431Q480 431 488 421T496 402L420 84Q419 79 419 68Q419 43 426 35T447 26Q469 29 482 57T512 145Q514 153 532 153Q551 153 551 144Q550 139 549 130T540 98T523 55T498 17T462 -8Q454 -10 438 -10Q372 -10 347 46Q345 45 336 36T318 21T296 6T267 -6T233 -11Q189 -11 155 7Q103 38 103 113Q103 170 138 262T173 379Q173 380 173 381Q173 390 173 393T169 400T158 404H154Q131 404 112 385T82 344T65 302T57 280Q55 278 41 278H27Q21 284 21 287Z\\"></path><path id=\\"MJX-1-TEX-I-1D45A\\" d=\\"M21 287Q22 293 24 303T36 341T56 388T88 425T132 442T175 435T205 417T221 395T229 376L231 369Q231 367 232 367L243 378Q303 442 384 442Q401 442 415 440T441 433T460 423T475 411T485 398T493 385T497 373T500 364T502 357L510 367Q573 442 659 442Q713 442 746 415T780 336Q780 285 742 178T704 50Q705 36 709 31T724 26Q752 26 776 56T815 138Q818 149 821 151T837 153Q857 153 857 145Q857 144 853 130Q845 101 831 73T785 17T716 -10Q669 -10 648 17T627 73Q627 92 663 193T700 345Q700 404 656 404H651Q565 404 506 303L499 291L466 157Q433 26 428 16Q415 -11 385 -11Q372 -11 364 -4T353 8T350 18Q350 29 384 161L420 307Q423 322 423 345Q423 404 379 404H374Q288 404 229 303L222 291L189 157Q156 26 151 16Q138 -11 108 -11Q95 -11 87 -5T76 7T74 17Q74 30 112 181Q151 335 151 342Q154 357 154 369Q154 405 129 405Q107 405 92 377T69 316T57 280Q55 278 41 278H27Q21 284 21 287Z\\"></path><path id=\\"MJX-1-TEX-I-1D45B\\" d=\\"M21 287Q22 293 24 303T36 341T56 388T89 425T135 442Q171 442 195 424T225 390T231 369Q231 367 232 367L243 378Q304 442 382 442Q436 442 469 415T503 336T465 179T427 52Q427 26 444 26Q450 26 453 27Q482 32 505 65T540 145Q542 153 560 153Q580 153 580 145Q580 144 576 130Q568 101 554 73T508 17T439 -10Q392 -10 371 17T350 73Q350 92 386 193T423 345Q423 404 379 404H374Q288 404 229 303L222 291L189 157Q156 26 151 16Q138 -11 108 -11Q95 -11 87 -5T76 7T74 17Q74 30 112 180T152 343Q153 348 153 366Q153 405 129 405Q91 405 66 305Q60 285 60 284Q58 278 41 278H27Q21 284 21 287Z\\"></path><path id=\\"MJX-1-TEX-I-1D456\\" d=\\"M184 600Q184 624 203 642T247 661Q265 661 277 649T290 619Q290 596 270 577T226 557Q211 557 198 567T184 600ZM21 287Q21 295 30 318T54 369T98 420T158 442Q197 442 223 419T250 357Q250 340 236 301T196 196T154 83Q149 61 149 51Q149 26 166 26Q175 26 185 29T208 43T235 78T260 137Q263 149 265 151T282 153Q302 153 302 143Q302 135 293 112T268 61T223 11T161 -11Q129 -11 102 10T74 74Q74 91 79 106T122 220Q160 321 166 341T173 380Q173 404 156 404H154Q124 404 99 371T61 287Q60 286 59 284T58 281T56 279T53 278T49 278T41 278H27Q21 284 21 287Z\\"></path><path id=\\"MJX-1-TEX-N-3D\\" d=\\"M56 347Q56 360 70 367H707Q722 359 722 347Q722 336 708 328L390 327H72Q56 332 56 347ZM56 153Q56 168 72 173H708Q722 163 722 153Q722 140 707 133H70Q56 140 56 153Z\\"></path><path id=\\"MJX-1-TEX-N-30\\" d=\\"M96 585Q152 666 249 666Q297 666 345 640T423 548Q460 465 460 320Q460 165 417 83Q397 41 362 16T301 -15T250 -22Q224 -22 198 -16T137 16T82 83Q39 165 39 320Q39 494 96 585ZM321 597Q291 629 250 629Q208 629 178 597Q153 571 145 525T137 333Q137 175 145 125T181 46Q209 16 250 16Q290 16 318 46Q347 76 354 130T362 333Q362 478 354 524T321 597Z\\"></path><path id=\\"MJX-1-TEX-I-1D45F\\" d=\\"M21 287Q22 290 23 295T28 317T38 348T53 381T73 411T99 433T132 442Q161 442 183 430T214 408T225 388Q227 382 228 382T236 389Q284 441 347 441H350Q398 441 422 400Q430 381 430 363Q430 333 417 315T391 292T366 288Q346 288 334 299T322 328Q322 376 378 392Q356 405 342 405Q286 405 239 331Q229 315 224 298T190 165Q156 25 151 16Q138 -11 108 -11Q95 -11 87 -5T76 7T74 17Q74 30 114 189T154 366Q154 405 128 405Q107 405 92 377T68 316T57 280Q55 278 41 278H27Q21 284 21 287Z\\"></path><path id=\\"MJX-1-TEX-I-1D44E\\" d=\\"M33 157Q33 258 109 349T280 441Q331 441 370 392Q386 422 416 422Q429 422 439 414T449 394Q449 381 412 234T374 68Q374 43 381 35T402 26Q411 27 422 35Q443 55 463 131Q469 151 473 152Q475 153 483 153H487Q506 153 506 144Q506 138 501 117T481 63T449 13Q436 0 417 -8Q409 -10 393 -10Q359 -10 336 5T306 36L300 51Q299 52 296 50Q294 48 292 46Q233 -10 172 -10Q117 -10 75 30T33 157ZM351 328Q351 334 346 350T323 385T277 405Q242 405 210 374T160 293Q131 214 119 129Q119 126 119 118T118 106Q118 61 136 44T179 26Q217 26 254 59T298 110Q300 114 325 217T351 328Z\\"></path><path id=\\"MJX-1-TEX-I-1D450\\" d=\\"M34 159Q34 268 120 355T306 442Q362 442 394 418T427 355Q427 326 408 306T360 285Q341 285 330 295T319 325T330 359T352 380T366 386H367Q367 388 361 392T340 400T306 404Q276 404 249 390Q228 381 206 359Q162 315 142 235T121 119Q121 73 147 50Q169 26 205 26H209Q321 26 394 111Q403 121 406 121Q410 121 419 112T429 98T420 83T391 55T346 25T282 0T202 -11Q127 -11 81 37T34 159Z\\"></path><path id=\\"MJX-1-TEX-N-28\\" d=\\"M94 250Q94 319 104 381T127 488T164 576T202 643T244 695T277 729T302 750H315H319Q333 750 333 741Q333 738 316 720T275 667T226 581T184 443T167 250T184 58T225 -81T274 -167T316 -220T333 -241Q333 -250 318 -250H315H302L274 -226Q180 -141 137 -14T94 250Z\\"></path><path id=\\"MJX-1-TEX-N-2B\\" d=\\"M56 237T56 250T70 270H369V420L370 570Q380 583 389 583Q402 583 409 568V270H707Q722 262 722 250T707 230H409V-68Q401 -82 391 -82H389H387Q375 -82 369 -68V230H70Q56 237 56 250Z\\"></path><path id=\\"MJX-1-TEX-N-31\\" d=\\"M213 578L200 573Q186 568 160 563T102 556H83V602H102Q149 604 189 617T245 641T273 663Q275 666 285 666Q294 666 302 660V361L303 61Q310 54 315 52T339 48T401 46H427V0H416Q395 3 257 3Q121 3 100 0H88V46H114Q136 46 152 46T177 47T193 50T201 52T207 57T213 61V578Z\\"></path><path id=\\"MJX-1-TEX-N-29\\" d=\\"M60 749L64 750Q69 750 74 750H86L114 726Q208 641 251 514T294 250Q294 182 284 119T261 12T224 -76T186 -143T145 -194T113 -227T90 -246Q87 -249 86 -250H74Q66 -250 63 -250T58 -247T55 -238Q56 -237 66 -225Q221 -64 221 250T66 725Q56 737 55 738Q55 746 60 749Z\\"></path><path id=\\"MJX-1-TEX-N-32\\" d=\\"M109 429Q82 429 66 447T50 491Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z\\"></path></defs><g stroke=\\"#000000\\" fill=\\"#000000\\" stroke-width=\\"0\\" transform=\\"matrix(1 0 0 -1 0 0)\\"><g data-mml-node=\\"math\\"><g data-mml-node=\\"mi\\"><use xlink:href=\\"#MJX-1-TEX-I-1D460\\"></use></g><g data-mml-node=\\"mi\\" transform=\\"translate(469, 0)\\"><use xlink:href=\\"#MJX-1-TEX-I-1D462\\"></use></g><g data-mml-node=\\"msubsup\\" transform=\\"translate(1041, 0)\\"><g data-mml-node=\\"mi\\"><use xlink:href=\\"#MJX-1-TEX-I-1D45A\\"></use></g><g data-mml-node=\\"mi\\" transform=\\"translate(878, 413) scale(0.707)\\"><use xlink:href=\\"#MJX-1-TEX-I-1D45B\\"></use></g><g data-mml-node=\\"TeXAtom\\" transform=\\"translate(878, -247) scale(0.707)\\" data-mjx-texclass=\\"ORD\\"><g data-mml-node=\\"mi\\"><use xlink:href=\\"#MJX-1-TEX-I-1D456\\"></use></g><g data-mml-node=\\"mo\\" transform=\\"translate(345, 0)\\"><use xlink:href=\\"#MJX-1-TEX-N-3D\\"></use></g><g data-mml-node=\\"mn\\" transform=\\"translate(1123, 0)\\"><use xlink:href=\\"#MJX-1-TEX-N-30\\"></use></g></g></g><g data-mml-node=\\"mi\\" transform=\\"translate(3116.6, 0)\\"><use xlink:href=\\"#MJX-1-TEX-I-1D456\\"></use></g><g data-mml-node=\\"mo\\" transform=\\"translate(3739.4, 0)\\"><use xlink:href=\\"#MJX-1-TEX-N-3D\\"></use><text data-variant=\\"normal\\" transform=\\"translate(778, 0) matrix(1 0 0 -1 0 0)\\" font-size=\\"884px\\" ></text></g><g data-mml-node=\\"mi\\" transform=\\"translate(5395.2, 0)\\"><use xlink:href=\\"#MJX-1-TEX-I-1D45F\\"></use></g><g data-mml-node=\\"mi\\" transform=\\"translate(5846.2, 0)\\"><use xlink:href=\\"#MJX-1-TEX-I-1D44E\\"></use></g><g data-mml-node=\\"mi\\" transform=\\"translate(6375.2, 0)\\"><use xlink:href=\\"#MJX-1-TEX-I-1D450\\"></use></g><g data-mml-node=\\"TeXAtom\\" data-mjx-texclass=\\"ORD\\" transform=\\"translate(6808.2, 0)\\"><g data-mml-node=\\"mi\\"><use xlink:href=\\"#MJX-1-TEX-I-1D45B\\"></use></g><g data-mml-node=\\"mo\\" transform=\\"translate(600, 0)\\"><use xlink:href=\\"#MJX-1-TEX-N-28\\"></use></g><g data-mml-node=\\"mi\\" transform=\\"translate(989, 0)\\"><use xlink:href=\\"#MJX-1-TEX-I-1D45B\\"></use></g><g data-mml-node=\\"mo\\" transform=\\"translate(1811.2, 0)\\"><use xlink:href=\\"#MJX-1-TEX-N-2B\\"></use></g><g data-mml-node=\\"mn\\" transform=\\"translate(2811.4, 0)\\"><use xlink:href=\\"#MJX-1-TEX-N-31\\"></use></g><g data-mml-node=\\"mo\\" transform=\\"translate(3311.4, 0)\\"><use xlink:href=\\"#MJX-1-TEX-N-29\\"></use></g></g><g data-mml-node=\\"TeXAtom\\" data-mjx-texclass=\\"ORD\\" transform=\\"translate(10508.6, 0)\\"><g data-mml-node=\\"mn\\"><use xlink:href=\\"#MJX-1-TEX-N-32\\"></use></g></g></g></g></svg>"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
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
                        <RNSVGPath
                          d="M131 289Q131 321 147 354T203 415T300 442Q362 442 390 415T419 355Q419 323 402 308T364 292Q351 292 340 300T328 326Q328 342 337 354T354 372T367 378Q368 378 368 379Q368 382 361 388T336 399T297 405Q249 405 227 379T204 326Q204 301 223 291T278 274T330 259Q396 230 396 163Q396 135 385 107T352 51T289 7T195 -10Q118 -10 86 19T53 87Q53 126 74 143T118 160Q133 160 146 151T160 120Q160 94 142 76T111 58Q109 57 108 57T107 55Q108 52 115 47T146 34T201 27Q237 27 263 38T301 66T318 97T323 122Q323 150 302 164T254 181T195 196T148 231Q131 256 131 289Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-I-1D460"
                        />
                        <RNSVGPath
                          d="M21 287Q21 295 30 318T55 370T99 420T158 442Q204 442 227 417T250 358Q250 340 216 246T182 105Q182 62 196 45T238 27T291 44T328 78L339 95Q341 99 377 247Q407 367 413 387T427 416Q444 431 463 431Q480 431 488 421T496 402L420 84Q419 79 419 68Q419 43 426 35T447 26Q469 29 482 57T512 145Q514 153 532 153Q551 153 551 144Q550 139 549 130T540 98T523 55T498 17T462 -8Q454 -10 438 -10Q372 -10 347 46Q345 45 336 36T318 21T296 6T267 -6T233 -11Q189 -11 155 7Q103 38 103 113Q103 170 138 262T173 379Q173 380 173 381Q173 390 173 393T169 400T158 404H154Q131 404 112 385T82 344T65 302T57 280Q55 278 41 278H27Q21 284 21 287Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-I-1D462"
                        />
                        <RNSVGPath
                          d="M21 287Q22 293 24 303T36 341T56 388T88 425T132 442T175 435T205 417T221 395T229 376L231 369Q231 367 232 367L243 378Q303 442 384 442Q401 442 415 440T441 433T460 423T475 411T485 398T493 385T497 373T500 364T502 357L510 367Q573 442 659 442Q713 442 746 415T780 336Q780 285 742 178T704 50Q705 36 709 31T724 26Q752 26 776 56T815 138Q818 149 821 151T837 153Q857 153 857 145Q857 144 853 130Q845 101 831 73T785 17T716 -10Q669 -10 648 17T627 73Q627 92 663 193T700 345Q700 404 656 404H651Q565 404 506 303L499 291L466 157Q433 26 428 16Q415 -11 385 -11Q372 -11 364 -4T353 8T350 18Q350 29 384 161L420 307Q423 322 423 345Q423 404 379 404H374Q288 404 229 303L222 291L189 157Q156 26 151 16Q138 -11 108 -11Q95 -11 87 -5T76 7T74 17Q74 30 112 181Q151 335 151 342Q154 357 154 369Q154 405 129 405Q107 405 92 377T69 316T57 280Q55 278 41 278H27Q21 284 21 287Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-I-1D45A"
                        />
                        <RNSVGPath
                          d="M21 287Q22 293 24 303T36 341T56 388T89 425T135 442Q171 442 195 424T225 390T231 369Q231 367 232 367L243 378Q304 442 382 442Q436 442 469 415T503 336T465 179T427 52Q427 26 444 26Q450 26 453 27Q482 32 505 65T540 145Q542 153 560 153Q580 153 580 145Q580 144 576 130Q568 101 554 73T508 17T439 -10Q392 -10 371 17T350 73Q350 92 386 193T423 345Q423 404 379 404H374Q288 404 229 303L222 291L189 157Q156 26 151 16Q138 -11 108 -11Q95 -11 87 -5T76 7T74 17Q74 30 112 180T152 343Q153 348 153 366Q153 405 129 405Q91 405 66 305Q60 285 60 284Q58 278 41 278H27Q21 284 21 287Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-I-1D45B"
                        />
                        <RNSVGPath
                          d="M184 600Q184 624 203 642T247 661Q265 661 277 649T290 619Q290 596 270 577T226 557Q211 557 198 567T184 600ZM21 287Q21 295 30 318T54 369T98 420T158 442Q197 442 223 419T250 357Q250 340 236 301T196 196T154 83Q149 61 149 51Q149 26 166 26Q175 26 185 29T208 43T235 78T260 137Q263 149 265 151T282 153Q302 153 302 143Q302 135 293 112T268 61T223 11T161 -11Q129 -11 102 10T74 74Q74 91 79 106T122 220Q160 321 166 341T173 380Q173 404 156 404H154Q124 404 99 371T61 287Q60 286 59 284T58 281T56 279T53 278T49 278T41 278H27Q21 284 21 287Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-I-1D456"
                        />
                        <RNSVGPath
                          d="M56 347Q56 360 70 367H707Q722 359 722 347Q722 336 708 328L390 327H72Q56 332 56 347ZM56 153Q56 168 72 173H708Q722 163 722 153Q722 140 707 133H70Q56 140 56 153Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-N-3D"
                        />
                        <RNSVGPath
                          d="M96 585Q152 666 249 666Q297 666 345 640T423 548Q460 465 460 320Q460 165 417 83Q397 41 362 16T301 -15T250 -22Q224 -22 198 -16T137 16T82 83Q39 165 39 320Q39 494 96 585ZM321 597Q291 629 250 629Q208 629 178 597Q153 571 145 525T137 333Q137 175 145 125T181 46Q209 16 250 16Q290 16 318 46Q347 76 354 130T362 333Q362 478 354 524T321 597Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-N-30"
                        />
                        <RNSVGPath
                          d="M21 287Q22 290 23 295T28 317T38 348T53 381T73 411T99 433T132 442Q161 442 183 430T214 408T225 388Q227 382 228 382T236 389Q284 441 347 441H350Q398 441 422 400Q430 381 430 363Q430 333 417 315T391 292T366 288Q346 288 334 299T322 328Q322 376 378 392Q356 405 342 405Q286 405 239 331Q229 315 224 298T190 165Q156 25 151 16Q138 -11 108 -11Q95 -11 87 -5T76 7T74 17Q74 30 114 189T154 366Q154 405 128 405Q107 405 92 377T68 316T57 280Q55 278 41 278H27Q21 284 21 287Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-I-1D45F"
                        />
                        <RNSVGPath
                          d="M33 157Q33 258 109 349T280 441Q331 441 370 392Q386 422 416 422Q429 422 439 414T449 394Q449 381 412 234T374 68Q374 43 381 35T402 26Q411 27 422 35Q443 55 463 131Q469 151 473 152Q475 153 483 153H487Q506 153 506 144Q506 138 501 117T481 63T449 13Q436 0 417 -8Q409 -10 393 -10Q359 -10 336 5T306 36L300 51Q299 52 296 50Q294 48 292 46Q233 -10 172 -10Q117 -10 75 30T33 157ZM351 328Q351 334 346 350T323 385T277 405Q242 405 210 374T160 293Q131 214 119 129Q119 126 119 118T118 106Q118 61 136 44T179 26Q217 26 254 59T298 110Q300 114 325 217T351 328Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-I-1D44E"
                        />
                        <RNSVGPath
                          d="M34 159Q34 268 120 355T306 442Q362 442 394 418T427 355Q427 326 408 306T360 285Q341 285 330 295T319 325T330 359T352 380T366 386H367Q367 388 361 392T340 400T306 404Q276 404 249 390Q228 381 206 359Q162 315 142 235T121 119Q121 73 147 50Q169 26 205 26H209Q321 26 394 111Q403 121 406 121Q410 121 419 112T429 98T420 83T391 55T346 25T282 0T202 -11Q127 -11 81 37T34 159Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-I-1D450"
                        />
                        <RNSVGPath
                          d="M94 250Q94 319 104 381T127 488T164 576T202 643T244 695T277 729T302 750H315H319Q333 750 333 741Q333 738 316 720T275 667T226 581T184 443T167 250T184 58T225 -81T274 -167T316 -220T333 -241Q333 -250 318 -250H315H302L274 -226Q180 -141 137 -14T94 250Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-N-28"
                        />
                        <RNSVGPath
                          d="M56 237T56 250T70 270H369V420L370 570Q380 583 389 583Q402 583 409 568V270H707Q722 262 722 250T707 230H409V-68Q401 -82 391 -82H389H387Q375 -82 369 -68V230H70Q56 237 56 250Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-N-2B"
                        />
                        <RNSVGPath
                          d="M213 578L200 573Q186 568 160 563T102 556H83V602H102Q149 604 189 617T245 641T273 663Q275 666 285 666Q294 666 302 660V361L303 61Q310 54 315 52T339 48T401 46H427V0H416Q395 3 257 3Q121 3 100 0H88V46H114Q136 46 152 46T177 47T193 50T201 52T207 57T213 61V578Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-N-31"
                        />
                        <RNSVGPath
                          d="M60 749L64 750Q69 750 74 750H86L114 726Q208 641 251 514T294 250Q294 182 284 119T261 12T224 -76T186 -143T145 -194T113 -227T90 -246Q87 -249 86 -250H74Q66 -250 63 -250T58 -247T55 -238Q56 -237 66 -225Q221 -64 221 250T66 725Q56 737 55 738Q55 746 60 749Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-N-29"
                        />
                        <RNSVGPath
                          d="M109 429Q82 429 66 447T50 491Q50 562 103 614T235 666Q326 666 387 610T449 465Q449 422 429 383T381 315T301 241Q265 210 201 149L142 93L218 92Q375 92 385 97Q392 99 409 186V189H449V186Q448 183 436 95T421 3V0H50V19V31Q50 38 56 46T86 81Q115 113 136 137Q145 147 170 174T204 211T233 244T261 278T284 308T305 340T320 369T333 401T340 431T343 464Q343 527 309 573T212 619Q179 619 154 602T119 569T109 550Q109 549 114 549Q132 549 151 535T170 489Q170 464 154 447T109 429Z"
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                          name="MJX-1-TEX-N-32"
                        />
                      </RNSVGDefs>
                      <RNSVGGroup
                        fill={
                          Object {
                            "payload": 4278190080,
                            "type": 0,
                          }
                        }
                        matrix={
                          Array [
                            1,
                            0,
                            0,
                            -1,
                            0,
                            0,
                          ]
                        }
                        propList={
                          Array [
                            "fill",
                            "stroke",
                            "strokeWidth",
                          ]
                        }
                        stroke={
                          Object {
                            "payload": 4278190080,
                            "type": 0,
                          }
                        }
                        strokeWidth="0"
                      >
                        <RNSVGGroup
                          fill={
                            Object {
                              "payload": 4278190080,
                              "type": 0,
                            }
                          }
                        >
                          <RNSVGGroup
                            fill={
                              Object {
                                "payload": 4278190080,
                                "type": 0,
                              }
                            }
                          >
                            <RNSVGUse
                              fill={
                                Object {
                                  "payload": 4278190080,
                                  "type": 0,
                                }
                              }
                              height="0"
                              href="MJX-1-TEX-I-1D460"
                              width="0"
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
                            matrix={
                              Array [
                                1,
                                0,
                                0,
                                1,
                                469,
                                0,
                              ]
                            }
                          >
                            <RNSVGUse
                              fill={
                                Object {
                                  "payload": 4278190080,
                                  "type": 0,
                                }
                              }
                              height="0"
                              href="MJX-1-TEX-I-1D462"
                              width="0"
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
                            matrix={
                              Array [
                                1,
                                0,
                                0,
                                1,
                                1041,
                                0,
                              ]
                            }
                          >
                            <RNSVGGroup
                              fill={
                                Object {
                                  "payload": 4278190080,
                                  "type": 0,
                                }
                              }
                            >
                              <RNSVGUse
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                                height="0"
                                href="MJX-1-TEX-I-1D45A"
                                width="0"
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
                              matrix={
                                Array [
                                  0.707,
                                  0,
                                  0,
                                  0.707,
                                  878,
                                  413,
                                ]
                              }
                            >
                              <RNSVGUse
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                                height="0"
                                href="MJX-1-TEX-I-1D45B"
                                width="0"
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
                              matrix={
                                Array [
                                  0.707,
                                  0,
                                  0,
                                  0.707,
                                  878,
                                  -247,
                                ]
                              }
                            >
                              <RNSVGGroup
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                              >
                                <RNSVGUse
                                  fill={
                                    Object {
                                      "payload": 4278190080,
                                      "type": 0,
                                    }
                                  }
                                  height="0"
                                  href="MJX-1-TEX-I-1D456"
                                  width="0"
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
                                matrix={
                                  Array [
                                    1,
                                    0,
                                    0,
                                    1,
                                    345,
                                    0,
                                  ]
                                }
                              >
                                <RNSVGUse
                                  fill={
                                    Object {
                                      "payload": 4278190080,
                                      "type": 0,
                                    }
                                  }
                                  height="0"
                                  href="MJX-1-TEX-N-3D"
                                  width="0"
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
                                matrix={
                                  Array [
                                    1,
                                    0,
                                    0,
                                    1,
                                    1123,
                                    0,
                                  ]
                                }
                              >
                                <RNSVGUse
                                  fill={
                                    Object {
                                      "payload": 4278190080,
                                      "type": 0,
                                    }
                                  }
                                  height="0"
                                  href="MJX-1-TEX-N-30"
                                  width="0"
                                  x="0"
                                  y="0"
                                />
                              </RNSVGGroup>
                            </RNSVGGroup>
                          </RNSVGGroup>
                          <RNSVGGroup
                            fill={
                              Object {
                                "payload": 4278190080,
                                "type": 0,
                              }
                            }
                            matrix={
                              Array [
                                1,
                                0,
                                0,
                                1,
                                3116.6,
                                0,
                              ]
                            }
                          >
                            <RNSVGUse
                              fill={
                                Object {
                                  "payload": 4278190080,
                                  "type": 0,
                                }
                              }
                              height="0"
                              href="MJX-1-TEX-I-1D456"
                              width="0"
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
                            matrix={
                              Array [
                                1,
                                0,
                                0,
                                1,
                                3739.4,
                                0,
                              ]
                            }
                          >
                            <RNSVGUse
                              fill={
                                Object {
                                  "payload": 4278190080,
                                  "type": 0,
                                }
                              }
                              height="0"
                              href="MJX-1-TEX-N-3D"
                              width="0"
                              x="0"
                              y="0"
                            />
                            <RNSVGText
                              content={null}
                              dx={Array []}
                              dy={Array []}
                              fill={
                                Object {
                                  "payload": 4278190080,
                                  "type": 0,
                                }
                              }
                              font={
                                Object {
                                  "fontSize": "884px",
                                }
                              }
                              matrix={
                                Array [
                                  1,
                                  0,
                                  0,
                                  -1,
                                  778,
                                  0,
                                ]
                              }
                              rotate={Array []}
                              x={Array []}
                              y={Array []}
                            />
                          </RNSVGGroup>
                          <RNSVGGroup
                            fill={
                              Object {
                                "payload": 4278190080,
                                "type": 0,
                              }
                            }
                            matrix={
                              Array [
                                1,
                                0,
                                0,
                                1,
                                5395.2,
                                0,
                              ]
                            }
                          >
                            <RNSVGUse
                              fill={
                                Object {
                                  "payload": 4278190080,
                                  "type": 0,
                                }
                              }
                              height="0"
                              href="MJX-1-TEX-I-1D45F"
                              width="0"
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
                            matrix={
                              Array [
                                1,
                                0,
                                0,
                                1,
                                5846.2,
                                0,
                              ]
                            }
                          >
                            <RNSVGUse
                              fill={
                                Object {
                                  "payload": 4278190080,
                                  "type": 0,
                                }
                              }
                              height="0"
                              href="MJX-1-TEX-I-1D44E"
                              width="0"
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
                            matrix={
                              Array [
                                1,
                                0,
                                0,
                                1,
                                6375.2,
                                0,
                              ]
                            }
                          >
                            <RNSVGUse
                              fill={
                                Object {
                                  "payload": 4278190080,
                                  "type": 0,
                                }
                              }
                              height="0"
                              href="MJX-1-TEX-I-1D450"
                              width="0"
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
                            matrix={
                              Array [
                                1,
                                0,
                                0,
                                1,
                                6808.2,
                                0,
                              ]
                            }
                          >
                            <RNSVGGroup
                              fill={
                                Object {
                                  "payload": 4278190080,
                                  "type": 0,
                                }
                              }
                            >
                              <RNSVGUse
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                                height="0"
                                href="MJX-1-TEX-I-1D45B"
                                width="0"
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
                              matrix={
                                Array [
                                  1,
                                  0,
                                  0,
                                  1,
                                  600,
                                  0,
                                ]
                              }
                            >
                              <RNSVGUse
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                                height="0"
                                href="MJX-1-TEX-N-28"
                                width="0"
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
                              matrix={
                                Array [
                                  1,
                                  0,
                                  0,
                                  1,
                                  989,
                                  0,
                                ]
                              }
                            >
                              <RNSVGUse
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                                height="0"
                                href="MJX-1-TEX-I-1D45B"
                                width="0"
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
                              matrix={
                                Array [
                                  1,
                                  0,
                                  0,
                                  1,
                                  1811.2,
                                  0,
                                ]
                              }
                            >
                              <RNSVGUse
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                                height="0"
                                href="MJX-1-TEX-N-2B"
                                width="0"
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
                              matrix={
                                Array [
                                  1,
                                  0,
                                  0,
                                  1,
                                  2811.4,
                                  0,
                                ]
                              }
                            >
                              <RNSVGUse
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                                height="0"
                                href="MJX-1-TEX-N-31"
                                width="0"
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
                              matrix={
                                Array [
                                  1,
                                  0,
                                  0,
                                  1,
                                  3311.4,
                                  0,
                                ]
                              }
                            >
                              <RNSVGUse
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                                height="0"
                                href="MJX-1-TEX-N-29"
                                width="0"
                                x="0"
                                y="0"
                              />
                            </RNSVGGroup>
                          </RNSVGGroup>
                          <RNSVGGroup
                            fill={
                              Object {
                                "payload": 4278190080,
                                "type": 0,
                              }
                            }
                            matrix={
                              Array [
                                1,
                                0,
                                0,
                                1,
                                10508.6,
                                0,
                              ]
                            }
                          >
                            <RNSVGGroup
                              fill={
                                Object {
                                  "payload": 4278190080,
                                  "type": 0,
                                }
                              }
                            >
                              <RNSVGUse
                                fill={
                                  Object {
                                    "payload": 4278190080,
                                    "type": 0,
                                  }
                                }
                                height="0"
                                href="MJX-1-TEX-N-32"
                                width="0"
                                x="0"
                                y="0"
                              />
                            </RNSVGGroup>
                          </RNSVGGroup>
                        </RNSVGGroup>
                      </RNSVGGroup>
                    </RNSVGGroup>
                  </RNSVGSvgView>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    `)
  })
})
