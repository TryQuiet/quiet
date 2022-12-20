import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Spinner } from './Spinner.component'

describe('Spinner component', () => {
  it('renders component', () => {
    const { toJSON } = renderComponent(<Spinner description='Connecting to peers' />)
    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Object {
            "alignItems": "center",
            "backgroundColor": "#ffffff",
            "flex": 1,
            "justifyContent": "center",
          }
        }
      >
        <ActivityIndicator
          color="#67BFD3"
          size="large"
        />
        <Text
          color="main"
          fontSize={14}
          horizontalTextAlign="center"
          style={
            Array [
              Object {
                "color": "#000000",
                "fontFamily": "Rubik-Regular",
                "fontSize": 14,
                "textAlign": "center",
                "textAlignVertical": "center",
              },
              Object {
                "margin": 10,
                "maxWidth": 200,
              },
            ]
          }
          verticalTextAlign="center"
        >
          Connecting to peers
        </Text>
      </View>
    `)
  })
})
