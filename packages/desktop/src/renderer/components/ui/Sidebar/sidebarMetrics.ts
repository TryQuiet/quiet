/**
 * Geometry of the desktop sidebar, measured from the Quiet Design Library
 * (Figma file `0j7Nna9zWmfOSNmRmQK1Uh`, page "Structure & Nav"):
 *
 *   Desktop sidebar          `5439:58626`  Mode=Dark `5439:58627` / Mode=Light `5439:58760`
 *   Desktop sidebar V1       `6218:16416`  Content=For V1 2025
 *   List item                `3797:16113`  Default / Hover / Selected
 *   List title               `3797:16103`
 *   List item--people        `4606:16448`
 *   Search input             `5446:61649`
 *   Community icon top-level `5196:15387`
 *
 * Numbers are read off those nodes, not invented. They sit on the 4px grid
 * apart from the two the library itself sets off it: the 3px vertical row
 * padding, and the row heights it produces (20px line-height + 2 x 3 = 26,
 * and 24px avatar + 2 x 3 = 30).
 *
 * The colours are not here: the sidebar's background, hover and selected fills
 * are already in `theme.palette.colors` as `sidebarBackground` / `sidebarHover`
 * / `sidebarSelected`, and they already carry the library's values in both
 * modes (light `#511974`, dark `#2F193D`; hover white at 5%, selected at 10%).
 */
export const sidebarMetrics = {
  /** Column width: every row is this wide so selected and hover fills span it. */
  width: 220,

  /** "Team and search": vertical, 16px gap, 8px bottom padding. */
  header: {
    /** The macOS window-control strip the sidebar leaves clear (76 x 36). */
    windowControlsHeight: 36,
    gap: 16,
    paddingBottom: 8,
    /** Side padding shared by the community row and the search field. */
    paddingX: 16,
    /** The community row itself. */
    teamRowHeight: 28,
    teamGap: 8,
    /** Community letter avatar. */
    communityIcon: 28,
    communityIconRadius: 4,
    /** Gap between the community name and its caret. */
    nameCaretGap: 4,
    caret: 16,
  },

  /** The scrolling area between the header and the profile summary. */
  content: {
    paddingTop: 16,
    paddingBottom: 40,
    /** Gap between "Add members", "Channels" and "Users". */
    sectionGap: 32,
  },

  /** "List item" — the channel and prominent-action rows. */
  row: {
    height: 26,
    paddingY: 3,
    paddingX: 16,
    gap: 4,
    /** Every row glyph (#, lock, person-add) is drawn in a 12px box. */
    glyph: 12,
  },

  /** "List item--people" — the member rows. */
  peopleRow: {
    height: 30,
    paddingY: 3,
    paddingX: 16,
    gap: 8,
    avatar: 24,
    avatarRadius: 4,
  },

  /** "List title" — the "Channels" / "Users" section headers. */
  title: {
    height: 26,
    paddingY: 3,
    paddingX: 16,
    gap: 8,
    /** The (+) at the header's right. */
    action: 16,
  },

  /** "badge2" — the unread marker at a row's right edge. */
  badge: {
    size: 16,
    /** Quiet's brand red, `theme.palette.secondary.main`. */
    radius: 100,
    /** Quiet has no unread *counts*, so the badge degenerates to a dot. */
    dot: 8,
  },

  /** "Search input". */
  search: {
    height: 32,
    radius: 8,
    padding: 8,
    gap: 5,
    glyph: 16,
  },

  /** "Profile summary" — the own-user row pinned to the bottom. */
  profile: {
    height: 48,
    paddingY: 12,
    paddingX: 16,
    gap: 8,
    avatar: 24,
    avatarRadius: 4,
  },

  /**
   * Opacities the library sets on individual layers. White text and glyphs on
   * the purple column are dimmed rather than given their own colours, so these
   * are part of the spec, not styling slack.
   */
  opacity: {
    /** Row labels, section titles and the profile name. */
    label: 0.7,
    /** Row glyphs (#, lock, person-add). */
    glyph: 0.5,
    /** The (+) in a section header. */
    titleAction: 0.6,
    communityName: 0.8,
    caret: 0.6,
    searchGlyph: 0.4,
    searchLabel: 0.5,
    /** Raised to this on hover for anything interactive. */
    hover: 1,
    disabled: 0.3,
  },
} as const

export default sidebarMetrics
