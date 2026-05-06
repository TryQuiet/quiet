import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { TextWithLink } from './TextWithLink.component'
import { createLogger } from '../../utils/logger'

const logger = createLogger('textWithLink:test')

describe('Spinner component', () => {
  it('renders component', () => {
    const { toJSON } = renderComponent(
      <TextWithLink
        text={'Here is %a text'}
        links={[
          {
            tag: 'a',
            label: 'linked',
            action: () => {
              logger.info('link clicked')
            },
          },
        ]}
      />
    )
    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          {
            "alignItems": "flex-start",
            "display": "flex",
            "flex": 1,
            "flexDirection": "row",
            "flexWrap": "wrap",
            "minHeight": 500,
          }
        }
      >
        <Text
          color="main"
          fontSize={14}
          horizontalTextAlign="left"
          style={
            [
              {
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
          Here
        </Text>
        <Text
          color="main"
          fontSize={14}
          horizontalTextAlign="left"
          style={
            [
              {
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
           
        </Text>
        <Text
          color="main"
          fontSize={14}
          horizontalTextAlign="left"
          style={
            [
              {
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
          is
        </Text>
        <Text
          color="main"
          fontSize={14}
          horizontalTextAlign="left"
          style={
            [
              {
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
           
        </Text>
        <Text
          color="main"
          fontSize={14}
          horizontalTextAlign="left"
          style={
            [
              {
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
          <Text
            color="link"
            fontSize={14}
            horizontalTextAlign="left"
            onPress={[Function]}
            style={
              [
                {
                  "color": "#67BFD3",
                  "fontFamily": "Rubik-Regular",
                  "fontSize": 14,
                  "textAlign": "left",
                  "textAlignVertical": "center",
                },
              ]
            }
            verticalTextAlign="center"
          >
            linked
          </Text>
        </Text>
        <Text
          color="main"
          fontSize={14}
          horizontalTextAlign="left"
          style={
            [
              {
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
           
        </Text>
        <Text
          color="main"
          fontSize={14}
          horizontalTextAlign="left"
          style={
            [
              {
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
          text
        </Text>
      </View>
    `)
  })
})
