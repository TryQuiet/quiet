/**
 * A remark (mdast) plugin that turns `#some-channel` mentions into links.
 *
 * It runs on the parsed markdown tree rather than on the raw message string so that
 * markdown's own rules are respected for free:
 *  - `#general` inside `` `code` `` or a fenced block is never touched, because those are
 *    `inlineCode`/`code` nodes and carry their content on the node itself, not in a `text` child
 *  - `#general` inside an existing link (including a GFM autolinked URL such as
 *    `https://example.com/#general`) is skipped, because we do not descend into `link` nodes
 *  - `# general` at the start of a line is a heading, so there is no `#` left in the text to match
 *
 * Only mentions that resolve to a channel the user can currently see become links. Everything
 * else - unknown names, private channels the user has no access to - stays plain text.
 */

/** Minimal structural view of an mdast node; avoids depending on `@types/mdast` / `unist`. */
interface MdastNode {
  type: string
  value?: string
  url?: string
  title?: string | null
  children?: MdastNode[]
}

export interface RemarkChannelLinksOptions {
  /** lowercased channel name -> channel id, for every channel the user can currently see */
  channels: Map<string, string>
}

/**
 * Href prefix for channel links. It deliberately starts with `#` so that react-markdown's default
 * `uriTransformer` passes it through untouched - any custom scheme (`quiet://…`) is rewritten to
 * `javascript:void(0)` by that sanitizer.
 */
export const CHANNEL_LINK_HREF_PREFIX = '#channel/'

export const channelLinkHref = (channelId: string): string =>
  `${CHANNEL_LINK_HREF_PREFIX}${encodeURIComponent(channelId)}`

/** Returns the channel id encoded in `href`, or null when `href` is not a channel link. */
export const parseChannelLinkHref = (href?: string): string | null => {
  if (!href || !href.startsWith(CHANNEL_LINK_HREF_PREFIX)) return null
  const encoded = href.slice(CHANNEL_LINK_HREF_PREFIX.length)
  if (!encoded) return null
  try {
    return decodeURIComponent(encoded)
  } catch {
    return null
  }
}

/**
 * Channel names are normalized by `parseName` in @quiet/common to `[\w._-]` lowercase, so a mention
 * candidate is a word character followed by more of that same set. Requiring a word character first
 * keeps `#-` / `#.` / `##general` from being treated as mentions.
 */
const CHANNEL_MENTION_REGEX = /#(\w[\w.-]{0,63})/g

/**
 * A mention must start at the beginning of a text node or right after whitespace or an opening
 * bracket/quote. This is what keeps `foo#general` and `example.com/#general` plain text.
 */
const ALLOWED_CHARACTER_BEFORE_MENTION = /[\s([{<"'‘“]/

/** Trailing punctuation that is legal inside a channel name but usually belongs to the sentence. */
const TRIMMABLE_TRAILING_CHARACTER = /[._-]$/

/** Node types whose subtree must not be rewritten - they are already links, or already resolved. */
const SKIPPED_NODE_TYPES = new Set(['link', 'linkReference', 'definition', 'image', 'imageReference'])

/**
 * Resolves a mention candidate to a channel, giving back the matched name so the rendered link text
 * keeps only the part that is really a channel. `#general.` at the end of a sentence resolves to
 * `general` and leaves the full stop outside the link; `#generalize` resolves to nothing.
 */
const resolveChannel = (candidate: string, channels: Map<string, string>): { id: string; name: string } | null => {
  let name = candidate
  while (name.length > 0) {
    const id = channels.get(name.toLowerCase())
    if (id !== undefined) return { id, name }
    if (!TRIMMABLE_TRAILING_CHARACTER.test(name)) return null
    name = name.slice(0, -1)
  }
  return null
}

/** Splits one text node into text/link nodes, or returns null when it holds no channel mention. */
const splitTextNode = (value: string, channels: Map<string, string>): MdastNode[] | null => {
  const nodes: MdastNode[] = []
  let cursor = 0
  let match: RegExpExecArray | null

  CHANNEL_MENTION_REGEX.lastIndex = 0
  while ((match = CHANNEL_MENTION_REGEX.exec(value)) !== null) {
    const start = match.index
    const characterBefore = start === 0 ? undefined : value[start - 1]
    if (characterBefore !== undefined && !ALLOWED_CHARACTER_BEFORE_MENTION.test(characterBefore)) continue

    const channel = resolveChannel(match[1], channels)
    if (!channel) continue

    if (start > cursor) nodes.push({ type: 'text', value: value.slice(cursor, start) })
    nodes.push({
      type: 'link',
      url: channelLinkHref(channel.id),
      title: null,
      children: [{ type: 'text', value: `#${channel.name}` }],
    })

    cursor = start + 1 + channel.name.length
    CHANNEL_MENTION_REGEX.lastIndex = cursor
  }

  if (nodes.length === 0) return null
  if (cursor < value.length) nodes.push({ type: 'text', value: value.slice(cursor) })
  return nodes
}

/** Depth-first walk. Deliberately small so we do not need `unist-util-visit` as a new dependency. */
const transformNode = (node: MdastNode, channels: Map<string, string>): void => {
  const children = node.children
  if (!children) return

  for (let index = 0; index < children.length; index++) {
    const child = children[index]
    if (SKIPPED_NODE_TYPES.has(child.type)) continue

    if (child.type === 'text' && typeof child.value === 'string') {
      const replacement = splitTextNode(child.value, channels)
      if (replacement) {
        children.splice(index, 1, ...replacement)
        index += replacement.length - 1
      }
      continue
    }

    transformNode(child, channels)
  }
}

export const remarkChannelLinks = (options?: RemarkChannelLinksOptions) => {
  const channels = options?.channels
  return (tree: MdastNode): void => {
    if (!channels || channels.size === 0) return
    transformNode(tree, channels)
  }
}

export default remarkChannelLinks
