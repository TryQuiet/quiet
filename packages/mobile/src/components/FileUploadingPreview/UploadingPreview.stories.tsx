import { storiesOf } from '@storybook/react-native'
import React from 'react'
import UploadingPreview from './UploadingPreview.component'
import { FilePreviewData } from '@quiet/types'
const pickedFiles: FilePreviewData = {
    '12345': {
        path: 'file://data/0/myFile.jpg',
        name: 'myFile.jpg',
        ext: '.jpg',
    },
    '54321': {
        path: 'file://data/0/otherfile.txt',
        name: 'otherfile.txt',
        ext: '.txt',
    },
    '11111': {
        path: 'file://data/0/somefile.png',
        name: 'somefile.png',
        ext: '.png',
    },
    '22222': {
        path: 'file://data/0/otherfiledoc.pdf',
        name: 'otherfiledoc.pdf',
        ext: '.pdf',
    },
}
storiesOf('File UploadingPreview', module).add('Default', () => (
    <UploadingPreview
        filesData={pickedFiles}
        removeFile={function (id: string): void {
            console.log(`removeFile ${id}`)
        }}
    />
))
