import { isNotNull } from '@quiet/common'
import { soundTypeToAudio } from '.'

describe('sounds', () => {
  it('have proper source', () => {
    const sounds = Object.values(soundTypeToAudio).filter(isNotNull)
    expect(sounds.length).toEqual(Object.keys(soundTypeToAudio).length - 1)
    for (const sound of sounds) {
      expect(sound.src).toEqual('http://localhost/test-file-stub')
    }
  })
})
