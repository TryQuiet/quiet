import React, { useState } from 'react'
import { Image, ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import { imagesExtensions } from '@quiet/state-manager'
import { FileContent, FilePreviewData } from '@quiet/types'
import { appImages } from '../../assets'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'

export interface FilePreviewComponentProps {
    fileData: FileContent
    onClick: () => void
}

const FilePreviewComponent: React.FC<FilePreviewComponentProps> = ({ fileData, onClick }) => {
    const imageType = imagesExtensions.includes(fileData.ext)
    const removePreviewIcon = appImages.icon_close
    const fileIcon = appImages.file_document

    return (
        <View
            style={{
                flexWrap: 'nowrap',
                alignItems: 'flex-start',
                marginRight: 10,
                marginTop: 10,
            }}
        >
            <TouchableWithoutFeedback onPress={onClick}>
                <View
                    style={{
                        position: 'absolute',
                        justifyContent: 'center',
                        marginLeft: 0,
                        padding: 0,
                        backgroundColor: defaultTheme.palette.typography.white,
                        borderColor: defaultTheme.palette.typography.grayLight,
                        borderWidth: 1,
                        borderRadius: 100,
                        width: 22,
                        height: 22,
                        right: -10,
                        top: -10,
                        zIndex: 1000,
                    }}
                >
                    <Image
                        source={removePreviewIcon}
                        style={{
                            position: 'relative',
                            alignSelf: 'center',
                            width: 10,
                            height: 10,
                        }}
                    />
                </View>
            </TouchableWithoutFeedback>
            <View
                style={{
                    height: 64,
                }}
            >
                {imageType && fileData.path ? (
                    <Image
                        source={{ uri: fileData.path }}
                        alt={fileData.name}
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 15,
                        }}
                    />
                ) : (
                    <View
                        style={{
                            height: 64,
                            borderRadius: 15,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderColor: defaultTheme.palette.typography.veryLightGray,
                            borderStyle: 'solid',
                            borderWidth: 1,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                            }}
                        >
                            <Image
                                source={fileIcon}
                                style={{
                                    width: 32,
                                    height: 40,
                                    marginLeft: 5,
                                    marginRight: 5,
                                }}
                            />
                            <View
                                style={{
                                    marginRight: 5,
                                    maxWidth: 100,
                                }}
                            >
                                <Typography
                                    fontSize={12}
                                    numberOfLines={1}
                                    style={{
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {fileData.name}
                                </Typography>
                                <Typography fontSize={12}>{fileData.ext}</Typography>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </View>
    )
}

export interface UploadFilesPreviewsProps {
    filesData: FilePreviewData
    removeFile: (id: string) => void
}

const UploadFilesPreviewsComponent: React.FC<UploadFilesPreviewsProps> = ({ filesData, removeFile }) => {
    return (
        <ScrollView
            horizontal
            contentContainerStyle={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
                marginTop: 15,
            }}
        >
            {Object.entries(filesData).map(fileData => (
                <FilePreviewComponent
                    key={fileData[0]}
                    fileData={fileData[1]}
                    onClick={() => removeFile(fileData[0])}
                />
            ))}
        </ScrollView>
    )
}

export default UploadFilesPreviewsComponent
