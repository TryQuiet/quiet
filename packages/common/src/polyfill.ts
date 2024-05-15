import { shouldPolyfill as shouldPolyfillCanon } from '@formatjs/intl-getcanonicallocales/should-polyfill'
import { shouldPolyfill as shouldPolyfillLocale } from '@formatjs/intl-locale/should-polyfill'
import { shouldPolyfill as shouldPolyFillFormat } from '@formatjs/intl-datetimeformat/should-polyfill'

function polyfill() {
  if (shouldPolyfillCanon()) {
    require('@formatjs/intl-getcanonicallocales/polyfill')
  }

  if (shouldPolyfillLocale()) {
    require('@formatjs/intl-locale/polyfill')
  }

  if (shouldPolyFillFormat()) {
    require('@formatjs/intl-datetimeformat/polyfill')
    require('@formatjs/intl-datetimeformat/locale-data/en')
  }
}

polyfill()
