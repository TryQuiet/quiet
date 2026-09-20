import React, { useState } from 'react'
import { Image, ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import { FileContent, FilePreviewData, imagesExtensions } from '@quiet/types'
import { icons } from '../../assets'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'

/** The smallest comfortable finger target; every guideline puts it at 44. */
const TOUCH_TARGET = 44
/** The design's corner control: a 22 circle holding a 10 glyph, hung 10 off the preview's corner. */
const BADGE_SIZE = 22
const BADGE_GLYPH = 10
const BADGE_OVERHANG = 10

export interface FilePreviewComponentProps {
  fileData: FileContent
  onClick: () => void
}

const FilePreviewComponent: React.FC<FilePreviewComponentProps> = ({ fileData, onClick }) => {
  const imageType = imagesExtensions.includes(fileData.ext)
  const removePreviewIcon = icons.icon_close
  const fileIcon = icons.file_document

  return (
    <View
      style={{
        flexWrap: 'nowrap',
        alignItems: 'flex-start',
      }}
    >
      <TouchableWithoutFeedback
        onPress={onClick}
        accessibilityRole='button'
        accessibilityLabel={`Remove ${fileData.name}`}
        testID={`remove_file_${fileData.name}`}
      >
        {/* The target is 44 and runs down and left, into the thumbnail, which has no tap of its
            own. hitSlop would not serve here: the badge sits in this wrapper's corner, so slop
            going up or right lands outside the parent, and Android drops a touch on a child drawn
            outside its parent's bounds. The overhang is a margin on the thumbnail below rather
            than padding here, so the badge's `top: 0, right: 0` is measured against a box with no
            padding to disagree about. */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: TOUCH_TARGET,
            height: TOUCH_TARGET,
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            zIndex: 1000,
          }}
        >
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: defaultTheme.palette.typography.white,
              borderColor: defaultTheme.palette.typography.grayLight,
              borderWidth: 1,
              borderRadius: BADGE_SIZE / 2,
              width: BADGE_SIZE,
              height: BADGE_SIZE,
            }}
          >
            <Image
              source={removePreviewIcon}
              style={{
                width: BADGE_GLYPH,
                height: BADGE_GLYPH,
              }}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
      <View
        style={{
          height: 64,
          // The badge hangs off this corner. Holding the offset here keeps the wrapper's padding
          // at zero and the row's footprint what it was when these were the wrapper's margins.
          marginTop: BADGE_OVERHANG,
          marginRight: BADGE_OVERHANG,
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
        <FilePreviewComponent key={fileData[0]} fileData={fileData[1]} onClick={() => removeFile(fileData[0])} />
      ))}
    </ScrollView>
  )
}

export default UploadFilesPreviewsComponent
