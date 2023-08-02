import React from 'react'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { AttachmentButton } from './AttachmentButton.component'

describe('Attachment button component', () => {
  it('renders properly', () => {
    const onPressMock = jest.fn()
    const { toJSON } = renderComponent(<AttachmentButton onPress={onPressMock} />)

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
            "justifyContent": "center",
            "paddingLeft": 5,
            "paddingRight": 5,
          }
        }
        testID="attach_file_button"
      >
        <Image
          source={
            {
              "testUri": "../../../assets/icons/paperclip_black.png",
            }
          }
          style={
            {
              "alignSelf": "center",
              "height": 20,
              "width": 20,
            }
          }
        />
      </View>
    `)
  })
})
