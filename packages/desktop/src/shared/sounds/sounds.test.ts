import { soundTypeToAudio } from '.'

describe('sounds', () => {
  it('have proper source', () => {
    for (const sound of Object.values(soundTypeToAudio)) {
      expect(sound.src).toEqual('http://localhost/test-file-stub')
    }
  })
})
