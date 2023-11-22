import { MessagesDailyGroups } from '@quiet/types'
import { dialog, BrowserWindow } from '@electron/remote'
import fs from 'fs'

export const exportChats = async (channelName: string, channelMessages: MessagesDailyGroups) => {
  dialog
    .showSaveDialog(BrowserWindow.getAllWindows()[0], {
      title: 'Save file',
      defaultPath: `${channelName}.txt`,
      buttonLabel: 'Save',

      filters: [
        { name: 'txt', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    .then(({ filePath }) => {
      if (filePath) {
        fs.writeFile(filePath, channelMessagesToText(channelMessages), err => {
          if (err) {
            console.log(err)
          }
        })
      }
    })
}

const channelMessagesToText = (channelMessages: MessagesDailyGroups) => {
  return Object.keys(channelMessages)
    .map(day => {
      return channelMessages[day]
        .map(messages => messages.map(message => `[${message.nickname} ${message.date}]\n${message.message}`))
        .join('\n\n')
    })
    .join('\n\n\n')
}
