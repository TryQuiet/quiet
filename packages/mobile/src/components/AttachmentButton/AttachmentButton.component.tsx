import React, { FC, useCallback } from 'react'
import { TouchableWithoutFeedback, View, Image } from 'react-native'
import { appImages } from '../../assets'
import { AttachmentButtonProps } from './AttachmentButton.types'

export const AttachmentButton: FC<AttachmentButtonProps> = ({ onPress }) => {
    const icon = appImages.paperclip_gray

    return (
        <TouchableWithoutFeedback onPress={onPress} testID={'attach_file_button'}>
            <View
                style={{
                    paddingLeft: 5,
                    paddingRight: 5,
                    justifyContent: 'center',
                }}
            >
                <Image
                    source={icon}
                    style={{
                        alignSelf: 'center',
                        width: 24,
                        height: 24,
                    }}
                />
            </View>
        </TouchableWithoutFeedback>
    )
}
