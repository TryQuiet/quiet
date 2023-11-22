import React, { FC } from 'react'
import { View } from 'react-native'
import { Typography } from '../Typography/Typography.component'

import { TextWithLinkProps } from './TextWithLink.types'

export const TextWithLink: FC<TextWithLinkProps> = ({ text, tagPrefix = '%', links, ...props }) => {
    const format = (action: () => void, label: string) => {
        return (
            <Typography
                fontSize={14}
                color={'link'}
                onPress={() => {
                    action()
                }}
                {...props}
            >
                {label}
            </Typography>
        )
    }

    const parts: Array<string | JSX.Element> = text.split(/(\s+)/)

    links.map(link => {
        for (let i = 1; i < parts.length; i++) {
            if (`${tagPrefix + link.tag}` === parts[i]) {
                parts[i] = format(link.action, link.label)
            }
        }
    })

    return (
        <View
            style={{
                display: 'flex',
                flex: 1,
                alignItems: 'flex-start',
                flexDirection: 'row',
                flexWrap: 'wrap',
                minHeight: 500, // The contents of this View is being generated dynamically so minimal height has to be set in order to make it visible
            }}
        >
            {parts.map((part, index) => {
                return (
                    <Typography fontSize={14} key={index}>
                        {part}
                    </Typography>
                )
            })}
        </View>
    )
}
