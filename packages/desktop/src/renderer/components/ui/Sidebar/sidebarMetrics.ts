/**
 * Geometry and state overlays for the desktop sidebar, measured from the Quiet
 * Design Library (Figma file `0j7Nna9zWmfOSNmRmQK1Uh`, page "Structure & Nav",
 * section "Desktop and mobile sidebar and titlebar" `6107:21330`):
 *
 *   Desktop sidebar V1       `6218:16416`  Mode=Desktop sidebar - V1 release
 *   Team                     `4233:12959`  the community header row
 *   List title               `3797:16103`  Default / Hover
 *   List item                `3797:16113`  Default / Hover / Selected
 *   List item--people        `4606:16448`  Single / Group, Default / Hover / Selected
 *   Profile summary          `4716:7702`   the own-user row at the bottom
 *   controls--mac            `3797:15261`  the window-controls space
 *
 * Numbers are read off those nodes, not invented. They sit on the 4px grid
 * apart from the two the library itself sets off it: the 3px vertical row
 * padding, and the row heights it produces (20px line-height + 2 x 3 = 26,
 * and 24px avatar + 2 x 3 = 30).
 *
 * V1 is the purple column only. The library's Mode=Dark variant (`5439:58627`)
 * is out of scope — the designer's V1 note (`6222:13638`) says "No dark mode
 * yet" — so nothing here varies by theme, and the app's dark theme keeps
 * today's `sidebarBackground` until a dark sidebar is designed.
 */
export const sidebarMetrics = {
  /** Column width: every row is this wide so selected and hover fills span it. */
  width: 220,

  /** "Team and search": vertical, 16px gap, 8px bottom padding. */
  header: {
    /** The macOS window-control strip the sidebar leaves clear (`3797:15261`, 76 x 36). */
    windowControlsHeight: 36,
    gap: 16,
    paddingBottom: 8,
    /** Side padding of the community row (`4233:12959`, 0/16). */
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
    /** Quiet's brand red, `theme.palette.secondary.main` (`#E42656`). */
    radius: 100,
    /** Quiet has no unread *counts*, so the badge degenerates to a dot. */
    dot: 8,
  },

  /** "Profile summary" (`4716:7702`) — the own-user row pinned to the bottom. */
  profile: {
    height: 48,
    paddingY: 12,
    paddingX: 16,
    gap: 8,
    avatar: 24,
    avatarRadius: 4,
    /** The library separates it from the list with a white 10% hairline. */
    border: 'rgba(255, 255, 255, 0.10)',
    /** The whole row is drawn at 90%, in every variant of the set. */
    opacity: 0.9,
  },

  /**
   * The overlays the library paints on an interactive row, annotated by the
   * designer beside each primitive: "Hover / White 5% opacity" (`5573:9585`)
   * and "Selected / White 10% opacity" (`5573:9597`) on List item, and
   * "Hover / White 10% opacity" (`5573:9602`) on Profile summary. Default is
   * no overlay at all.
   *
   * These are the library's exact values. `theme.palette.colors.sidebarHover`
   * and `sidebarSelected` carry the same two overlays to within one hex step
   * (`#FFFFFF0C` is 4.7%, `#FFFFFF19` is 9.8%) and are identical in both
   * themes; the sidebar uses the library's numbers directly so it does not
   * depend on `theme.ts`, which another branch in this stack is editing.
   */
  overlay: {
    /** `List item` / `List item--people` State=Hover. */
    hover: 'rgba(255, 255, 255, 0.05)',
    /** `List item` / `List item--people` State=Selected, and `Profile summary` Hover=True. */
    selected: 'rgba(255, 255, 255, 0.10)',
    /** No Pressed variant exists in the library; pressing reuses the Selected overlay. */
    pressed: 'rgba(255, 255, 255, 0.10)',
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
    /** The (+) in a section header — 1 on hover, per List title State=Hover. */
    titleAction: 0.6,
    communityName: 0.8,
    caret: 0.6,
    /** Raised to this on hover for anything interactive. */
    hover: 1,
    disabled: 0.3,
  },
} as const

export default sidebarMetrics
