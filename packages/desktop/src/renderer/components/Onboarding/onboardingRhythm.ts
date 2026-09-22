import { tokens } from '../../design-system/tokens'

/**
 * The onboarding stages' vertical rhythm, read off the Figma frames.
 *
 * Every full-screen onboarding stage in the prototype is a 375-wide frame with a
 * 60-tall bar zone at the top, and puts the first content element — the
 * illustration where there is one, otherwise the heading — 24 below that zone:
 *
 *   Get started      2811:2550  logo box        y 84  = 60 + 24
 *   Link devices     2811:2575  heading box     y 84  = 60 + 24
 *   Recover account  2811:2535  key glyph box   y 84  = 60 + 24
 *   Open invite link 2811:2455  illustration    y 84  = 60 + 24
 *   Create community 2811:2451  heading box     y 84  = 60 + 24
 *   Choose username  2811:2371  heading box     y 84  = 60 + 24
 *   Paste a link     3190:10892 heading box     y 84  = 60 + 24   (WIP frame)
 *
 * One frame deviates: Join community (2811:2562) draws its heart-chat graphic
 * flush under the bar zone at y 60. Seven frames against one, and that single
 * deviation is what made moving between Get started and Join community jump, so
 * the class standard wins and the graphic takes the same 24 as the rest.
 *
 * Sheets are a separate class: they carry a titled bar with a hairline and sit
 * their content 16 below it (2811:2601, 2811:2587, 2932:3707).
 *
 * The bar zone is reserved on every stage, including the ones whose bar carries
 * no title and no glyph (Get started). Hiding the title is what "no bar title on
 * full-screen h1 stages" asks for; dropping the 60 as well is what moved Get
 * started's whole block 60 up from every screen it leads to.
 */

/** The library's `Title bar` zone (5825:29938 → 6002:27130): 60 tall on every stage. */
export const ONBOARDING_BAR_ZONE_HEIGHT = 60

/** First content element to the bottom of the bar zone, on every full-screen stage. */
export const ONBOARDING_STAGE_INSET = tokens.semantic.xl

/** Illustration → heading → block, and block → block, on every full-screen stage. */
export const ONBOARDING_BLOCK_GAP = tokens.semantic.xl

/** The same measure on a sheet, whose bar is titled and ruled (2811:2601, 2811:2587). */
export const ONBOARDING_SHEET_INSET = tokens.semantic.lg
