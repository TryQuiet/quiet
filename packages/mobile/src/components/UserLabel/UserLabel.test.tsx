import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import UserLabel from './UserLabel.component'
import { UserLabelType } from './UserLabel.types'

describe('UserLabel component', () => {
    it('UserLabelType.DUPLICATE', () => {
        const { toJSON } = renderComponent(
            <UserLabel
                type={UserLabelType.DUPLICATE}
                username={'johnny'}
                duplicatedUsernameHandleBack={function (): void {}}
                unregisteredUsernameHandleBack={function (username: string): void {}}
            />
        )
        expect(toJSON()).toMatchInlineSnapshot(`
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
            "marginLeft": 8,
          }
        }
        testID="user-label"
      >
        <View
          style={
            {
              "backgroundColor": "#E42656",
              "borderRadius": 8,
              "cursor": "pointer",
              "flexDirection": "row",
              "paddingBottom": 3,
              "paddingLeft": 8,
              "paddingRight": 8,
              "paddingTop": 3,
            }
          }
        >
          <Image
            source={
              {
                "testUri": "../../../assets/icons/warning-icon.png",
              }
            }
            style={
              {
                "height": 12,
                "marginLeft": 4,
                "marginRight": 4,
                "width": 13,
              }
            }
          />
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
                {
                  "color": "white",
                },
              ]
            }
            verticalTextAlign="center"
          >
            Duplicate
          </Text>
        </View>
      </View>
    `)
    })
    it('UserLabelType.UNREGISTERED', () => {
        const { toJSON } = renderComponent(
            <UserLabel
                type={UserLabelType.UNREGISTERED}
                username={'johnny'}
                duplicatedUsernameHandleBack={function (): void {}}
                unregisteredUsernameHandleBack={function (username: string): void {}}
            />
        )
        expect(toJSON()).toMatchInlineSnapshot(`
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
            "marginLeft": 8,
          }
        }
        testID="user-label"
      >
        <View
          style={
            {
              "backgroundColor": "#F0F0F0",
              "borderRadius": 8,
              "cursor": "pointer",
              "paddingBottom": 3,
              "paddingLeft": 8,
              "paddingRight": 8,
              "paddingTop": 3,
            }
          }
        >
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
                {
                  "color": "black",
                },
              ]
            }
            verticalTextAlign="center"
          >
            Unregistered
          </Text>
        </View>
      </View>
    `)
    })
})
