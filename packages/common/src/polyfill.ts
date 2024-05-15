/**
 * Polyfills for mobile and more
 *
 * TODO: Is this the right place to put this?
 */

import { shouldPolyfill as shouldPolyfillCanon } from '@formatjs/intl-getcanonicallocales/should-polyfill'
import { shouldPolyfill as shouldPolyfillLocale } from '@formatjs/intl-locale/should-polyfill'
import { shouldPolyfill as shouldPolyFillFormat } from '@formatjs/intl-datetimeformat/should-polyfill'

/**
 * Polyfill packages that are missing
 */
function polyfill() {
  /**
   * Locale/intl related polyfills for mobile (at least android)
   *
   * NOTE: I thought this was taken care of by `def jscFlavor = 'org.webkit:android-jsc-intl:+'` in the build.gradle file
   * but it didn't work for me.  I also tried polyfilling in various places in the mobile package and none of it worked. This
   * is where I landed :shrug:
   */

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

/**
 * Perform the polyfills
 */
polyfill()
