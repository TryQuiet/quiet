import { truncateWords } from './truncateWords'

describe('truncateWords function', () => {
  it('should truncate the whole words', () => {
    const text =
      'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'

    const truncated = truncateWords(text, 11, 100)

    expect(truncated).toEqual(
      'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur...'
    )
  })
  it('should truncate a long uninterrupted string', () => {
    const text =
      'Textfromlatestchatmessage. Loremipsumdolorsitamet, consecteturadipiscingelit. Idmassavenenatisidegetmassacommodoposuerefaucibusaliquam. Atscelerisquenisimaurisfacilisis.'

    const truncated = truncateWords(text, 11, 100)

    expect(truncated).toEqual(
      'Textfromlatestchatmessage. Loremipsumdolorsitamet, consecteturadipiscingelit. Idmassavenenatisideget...'
    )
  })
})
