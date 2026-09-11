import contextMenu from 'electron-context-menu'

export const setupContextMenu = () =>
  contextMenu({
    showInspectElement: false,
    showSaveLinkAs: true,
    showCopyLink: true,
    showSaveImage: true,
    showCopyImage: true,
    showSaveImageAs: true,
  })
