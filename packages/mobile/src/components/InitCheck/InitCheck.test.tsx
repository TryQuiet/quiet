import React from 'react';

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent';
import { InitCheck } from './InitCheck.component';

describe('InitCheck component', () => {
  it('should match inline snapshot', () => {
    const { toJSON } = renderComponent(
      <InitCheck event={'websocket connected'} passed={true} />,
    );

    expect(toJSON()).toMatchInlineSnapshot(`
      <View
        style={
          Object {
            "flexDirection": "row",
            "justifyContent": "center",
          }
        }
      >
        <Image
          source={
            Object {
              "testUri": "../../../assets/icons/check_circle_green.png",
            }
          }
          style={
            Object {
              "height": 14,
              "margin": 5,
              "resizeMode": "cover",
              "width": 14,
            }
          }
        />
        <Text
          color="greyDark"
          fontSize={12}
          horizontalTextAlign="left"
          style={
            Array [
              Object {
                "color": "#999999",
                "fontFamily": "Rubik-Regular",
                "fontSize": 12,
                "textAlign": "left",
                "textAlignVertical": "center",
              },
            ]
          }
          verticalTextAlign="center"
        >
          websocket connected
        </Text>
      </View>
    `);
  });
});
