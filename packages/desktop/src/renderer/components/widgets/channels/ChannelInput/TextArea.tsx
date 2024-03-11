import React, {
  ChangeEvent,
  KeyboardEvent,
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { List, ListItem, ListItemText, ListSubheader, Paper, Popper, Typography } from '@mui/material'
import Emojis from './emojis.json'

const emojis: any = []
Object.keys(Emojis).forEach(key => {
  const values: any = (Emojis as any)[key]
  values.forEach((value: any) => {
    const shortnames = value['n']?.slice(0, value['n'].length - 1) as string[]
    const name = value['n']?.[value['n'].length - 1]
    shortnames.forEach((shortname: string) => {
      emojis.push({
        char: String.fromCodePoint(parseInt(value['u'], 16)),
        name,
        shortname: `:${shortname.replace(/\s+/g, '-')}:`,
        unicode: value['u'],
      })
    })
  })
})

const selectorLimit = 5

const replaceBetweenIndex = (fullStr: string, insertStr: string, from: number, to: number) => {
  let newStr = fullStr.substring(0, from) + insertStr + fullStr.substring(to)
  return newStr
}

// @ts-ignore
const updateRef = (ref, innerRef) => {
  if (!ref) return
  if (typeof ref === 'function') {
    ref(innerRef.current)
  } else {
    ref.current = innerRef.current
  }
}

export const useForwardedRef = <T extends HTMLElement>(ref: React.ForwardedRef<T>) => {
  const innerRef = useRef<T>(null)
  useLayoutEffect(() => updateRef(ref, innerRef))
  useEffect(() => updateRef(ref, innerRef))
  return innerRef
}

type TextAreaProps = {} & React.HTMLProps<HTMLTextAreaElement>

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ onChange, onKeyDown, value, ...textAreaProps }, ref) => {
    const [textValue, setTextValue] = useState<any>('')
    const [caretPosition, setCaretPosition] = useState(0)
    const [emojiSelected, setEmojiSelected] = useState(0)
    const [propositions, setPropositions] = useState([])
    const [keyword, setKeyword] = useState('')

    const _ref = useForwardedRef<HTMLTextAreaElement>(ref)

    useEffect(() => {
      if (!value) {
        setTextValue('')
      }
    }, [value])

    const transformValue = useCallback(
      (newValue: string, caretPos: number) => {
        let _propositions: any = []
        let selection = emojiSelected

        let lastColonIndex = newValue.lastIndexOf(':', caretPos)
        let previousColonIndex = newValue.lastIndexOf(':', lastColonIndex - 1)

        let spaceIndex = newValue.lastIndexOf(' ', caretPos - 1)

        let autoReplace = spaceIndex < previousColonIndex && previousColonIndex < lastColonIndex

        let from = (autoReplace ? previousColonIndex : lastColonIndex) + 1
        let to = autoReplace ? caretPos - 1 : caretPos
        let shortname = newValue.substring(from, to)

        if (spaceIndex < lastColonIndex && shortname.length) {
          if (autoReplace) {
            let emoji = emojis.find((emoji: any) => emoji.shortname === `:${shortname}:`)
            if (emoji !== undefined) {
              newValue = replaceBetweenIndex(newValue, emoji.char, previousColonIndex, lastColonIndex + 1)
              // when we replace, put selection value to 0
              selection = 0
            }
          } else {
            // filter the potentials emoji choice
            let count = 0
            _propositions = emojis.filter((emoji: any) => {
              let keep = emoji.shortname.includes(shortname) && count < selectorLimit
              count += keep ? 1 : 0
              return keep
            }, this)
            if (propositions.length !== _propositions.length) {
              selection = 0
            }
          }
        }

        setTextValue(newValue)
        setCaretPosition(caretPos)
        setPropositions(_propositions)
        setEmojiSelected(selection)

        if (_propositions.length > 0) {
          setKeyword(shortname)
        }

        return newValue
      },
      [emojiSelected, propositions]
    )

    const onEmojiClicked = useCallback(
      (emojiShortname: string) => {
        let newValue = textValue

        let removeFromIndex = newValue.lastIndexOf(':', caretPosition)
        newValue = replaceBetweenIndex(newValue, emojiShortname, removeFromIndex, caretPosition)
        _ref.current?.focus()
        transformValue(newValue, removeFromIndex + emojiShortname.length)
      },
      [caretPosition, textValue, transformValue]
    )

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(event)
        let newValue = event.target.value
        let caretPos = event.target.selectionStart
        transformValue(newValue, caretPos)
      },
      [transformValue]
    )

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLTextAreaElement>) => {
        let maxIndex = propositions.length
        if (maxIndex) {
          let selected = emojiSelected
          let deleteEvent = true
          let validate = false
          let clearPropositions = false
          switch (event.keyCode) {
            case 38: // up arrow
              selected--
              break
            case 40: // down arrow
              selected++
              break
            case 13: // enter
              validate = true
              break
            case 27: // escape
              clearPropositions = true
              deleteEvent = false
              break
            default:
              deleteEvent = false
              break
          }
          if (selected < 0) selected = 0
          if (selected > maxIndex - 1) selected = maxIndex - 1

          if (deleteEvent) {
            event.preventDefault()
            if (validate) {
              // @ts-ignore
              onEmojiClicked(propositions[selected].shortname)
            } else {
              setEmojiSelected(selected)
            }
          } else {
            if (clearPropositions) {
              setPropositions([])
              setEmojiSelected(0)
            }
          }
        } else {
          onKeyDown?.(event)
        }
      },
      [propositions, emojiSelected, onEmojiClicked]
    )

    return (
      <>
        <textarea
          {...textAreaProps}
          ref={_ref}
          className='ChannelInputinput'
          value={textValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <Popper open={propositions.length > 0} anchorEl={_ref.current}>
          <Paper elevation={3}>
            <List
              sx={{ width: _ref.current?.offsetWidth }}
              subheader={
                <ListSubheader
                  component='div'
                  style={{ display: 'flex', flexDirection: 'row', gap: 12 }}
                  id='nested-list-subheader'
                >
                  <Typography fontSize={15} fontWeight='bold'>
                    EMOJI MATCHING
                  </Typography>
                  <Typography fontSize={13} color='textPrimary' fontWeight='bold'>{`:${keyword}`}</Typography>
                </ListSubheader>
              }
            >
              {propositions.map((emoji: any, index) => (
                <ListItem
                  key={emoji.unicode}
                  selected={index === emojiSelected}
                  onClick={() => onEmojiClicked(emoji.shortname)}
                >
                  <ListItemText primary={`${emoji.char} ${emoji.shortname} `} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Popper>
      </>
    )
  }
)

export default TextArea
