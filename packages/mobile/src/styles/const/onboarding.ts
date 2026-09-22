import { spacing } from './spacing'

/**
 * The onboarding stages' vertical rhythm, read off the Figma frames. Mirrors
 * packages/desktop/src/renderer/components/Onboarding/onboardingRhythm.ts — the
 * prototype is one 375-wide design and both apps draw it.
 *
 * Every full-screen stage is a 375-wide frame with a 60-tall bar zone at the top
 * and puts its first content element — the illustration where there is one,
 * otherwise the heading — 24 below that zone:
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
 * flush under the bar zone at y 60. Seven frames against one, and that lone
 * deviation is half of what made moving between Get started and Join community
 * jump, so the class standard wins.
 *
 * Sheets are a separate class: a titled bar with a hairline, content 16 below it
 * (2811:2601, 2811:2587, 2932:3707).
 */

/** The library's `Title bar` zone: 60 tall on every stage, glyph or no glyph. */
export const ONBOARDING_BAR_ZONE_HEIGHT = 60

/** First content element to the bottom of the bar zone, on every full-screen stage. */
export const ONBOARDING_STAGE_INSET = spacing.xl

/** Illustration → heading → block, and block → block, on every full-screen stage. */
export const ONBOARDING_BLOCK_GAP = spacing.xl

/** The same measure on a sheet, whose bar is titled and ruled. */
export const ONBOARDING_SHEET_INSET = spacing.lg

/**
 * The content column of a full-screen onboarding stage. Every stage uses this and
 * none sets its own top padding or block gap — that is what keeps the block in the
 * same place as you move between them. Screens that need a ScrollView or a
 * KeyboardAvoidingView spread this into their content container style.
 */
export const onboardingStageBody = {
  flex: 1,
  paddingTop: ONBOARDING_STAGE_INSET,
  paddingHorizontal: spacing.lg,
  gap: ONBOARDING_BLOCK_GAP,
} as const
