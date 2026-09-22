export const TITLE_BAR_DRAG_HEIGHT = 25

export const windowDragRegion = (platform: NodeJS.Platform) => ({
  WebkitAppRegion: 'no-drag',
  ...(platform !== 'darwin'
    ? {}
    : {
        '&::before': {
          content: '""',
          position: 'fixed',
          inset: '0 0 auto',
          height: TITLE_BAR_DRAG_HEIGHT,
          WebkitAppRegion: 'drag',
        },
      }),
})
