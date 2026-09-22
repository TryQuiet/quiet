import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

import { styled, ThemeProvider, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

import { createLogger } from '../../../logger'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'
import _ from 'lodash'
import {
  Autocomplete,
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  AutocompleteRenderOptionState,
  autocompleteClasses,
  createTheme,
  IconButton,
  InputBase,
  Paper,
  TextField,
  Theme,
} from '@mui/material'
import { Box } from '../../ui'
import { SelectableListOption, UserSearchProps } from './UserSearch.types'
import RecipientPill, { PILL_ROW_GAP } from './RecipientPill'
import { DROPDOWN_ROW_HEIGHT, DROPDOWN_ROW_INSET, dropdownSurfaceStyles } from '../../ui/Dropdown/DropdownSurface'

/**
 * The recipient results list (Figma tXuRsUfP6VnSv99dox00C1, d-search-results 847:16073 and
 * d-suggestion-results 840:20065). The panel is the shared dropdown surface — the same one the
 * emoji suggestions sit on — and the rows follow the design's 56-tall row with a #F0F0F0 rule.
 */

/** A result row's avatar is 32 in the design; the app's "small" avatar is 24. */
const DROPDOWN_AVATAR_SIZE = 32
/** Panel height from the design: 254, against 56-tall rows. */
const DROPDOWN_MAX_HEIGHT = 254

const PREFIX = 'UserSearchAutocomplete'

const classes = {
  root: `${PREFIX}root`,
  title: `${PREFIX}title`,
  subtitle: `${PREFIX}subtitle`,
  subtitleSmall: `${PREFIX}subtitleSmall`,
  spendButton: `${PREFIX}spendButton`,
  actions: `${PREFIX}actions`,
  switch: `${PREFIX}switch`,
  tab: `${PREFIX}tab`,
  tabs: `${PREFIX}tabs`,
  selected: `${PREFIX}selected`,
  indicator: `${PREFIX}indicator`,
  descriptionDiv: `${PREFIX}descriptionDiv`,
  wrapper: `${PREFIX}wrapper`,
  iconDiv: `${PREFIX}iconDiv`,
  iconButton: `${PREFIX}iconButton`,
  bold: `${PREFIX}bold`,
  menu: `${PREFIX}menu`,
  lock: `${PREFIX}lock`,
  avatar: `${PREFIX}avatar`,
  username: `${PREFIX}username`,
  autocompleteBox: `${PREFIX}autocompleteBox`,
  autocompleteBoxSelected: `${PREFIX}autocompleteBoxSelected`,
}

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.root}`]: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 20,
    paddingRight: 24,
    borderBottom: `1px solid ${theme.palette.colors.border01}`,
    minHeight: 55,
  },

  // "To:" is a label, not content: #7F7F7F at 14/20 (Figma tXuRsUfP6VnSv99dox00C1, the search
  // container's salutation). It had been gray70 (#4C4C4C) at 16px, which read as a third recipient
  // rather than as a prompt.
  [`& .${classes.title}`]: {
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 400,
    color: theme.palette.colors.gray50,
  },

  [`& .${classes.subtitle}`]: {
    fontSize: '0.8rem',
  },

  [`& .${classes.subtitleSmall}`]: {
    fontSize: '0.7rem',
    lineHeight: '0.9',
  },

  [`& .${classes.spendButton}`]: {
    fontSize: 13,
  },

  [`& .${classes.actions}`]: {},

  [`& .${classes.switch}`]: {
    maxWidth: 138,
    marginRight: 18,
    borderRadius: 4,
    borderStyle: 'solid',
    borderColor: theme.palette.colors.gray03,
  },

  [`& .${classes.tab}`]: {
    fontSize: 12,
    minHeight: 22,
    width: 65,
    minWidth: 0,
    lineHeight: '18px',
    padding: 0,
    textTransform: 'none',
    backgroundColor: theme.palette.colors.gray03,
    color: theme.palette.colors.gray40,
    fontWeight: 'normal',
  },

  [`& .${classes.tabs}`]: {
    minHeight: 0,
  },

  [`& .${classes.indicator}`]: {
    maxHeight: 0,
  },

  [`& .${classes.descriptionDiv}`]: {
    top: 75,
    padding: '12px 25px 12px 20px',
    backgroundColor: theme.palette.background.default,
    boxShadow: theme.shadows[2],
  },

  [`&.${classes.wrapper}`]: {},

  [`& .${classes.iconDiv}`]: {
    marginLeft: 12,
  },

  [`& .${classes.iconButton}`]: {
    padding: 0,
  },

  [`& .${classes.bold}`]: {
    fontWeight: 500,
  },

  [`& .${classes.menu}`]: {
    padding: '20px',
    cursor: 'pointer',
  },

  [`& .${classes.lock}`]: {
    marginRight: -2,
    marginLeft: -2,
  },

  [`& .${classes.avatar}`]: {
    width: DROPDOWN_AVATAR_SIZE,
    height: DROPDOWN_AVATAR_SIZE,
    marginRight: 0,
    paddingBottom: 0,
    borderRadius: 4,
    background: theme.palette.background.paper,
    marginBottom: 0,
    fontSize: '1rem',
    lineHeight: '1.68',
  },

  // A name in the results list: #222222 at 16/26, weight 500 (d-search-results 847:16073).
  [`& .${classes.username}`]: {
    fontWeight: 500,
    paddingLeft: 0,
    paddingRight: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 150,
    fontSize: 16,
    whiteSpace: 'nowrap',
    lineHeight: '26px',
    // The design's near-black is the dark theme's background, so this follows the theme instead of
    // naming a colour: #222222 text on a #222222 panel is invisible.
    color: theme.palette.text.primary,
  },

  // A result row: full-bleed, 56 tall, divided by a #F0F0F0 hairline — not an inset capsule. The
  // rows are flush so the panel's own radius 16 is the only rounding (d-search-results 847:16073).
  [`& .${classes.autocompleteBox}`]: {
    borderRadius: 0,
    margin: 0,
    [`&.${autocompleteClasses.option}`]: {
      minHeight: DROPDOWN_ROW_HEIGHT,
      padding: `0 ${DROPDOWN_ROW_INSET}px`,
      borderBottom: `1px solid ${theme.palette.colors.border01}`,
    },
    '&:last-of-type': {
      borderBottom: 'none',
    },
  },

  // The design has no purple row. Highlight is the design system's row hover, #F0F0F0 (Quiet
  // Design Library, Panel row 2989:185) — the same wash the pills and panel rows use. darkPurple
  // was not from any design, and it put #222222 text on a near-black ground.
  [`& .${classes.autocompleteBoxSelected}`]: {
    backgroundColor: theme.palette.colors.border01,
  },
}))

const logger = createLogger('widgets:UserSearchAutocomplete')

export const UserSearchAutocomplete: React.FC<UserSearchProps> = ({
  userProfiles,
  placeholderText,
  handleInputChange,
  initialMemberIds,
}) => {
  const theme = useTheme()
  const debounce = (fn: () => void, ms: number) => {
    let timer: ReturnType<typeof setTimeout> | null
    return (_: any) => {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        timer = null
        fn.apply(this)
      }, ms)
    }
  }

  const [wrapperWidth, setWrapperWidth] = React.useState(0)

  React.useEffect(() => {
    setWrapperWidth(window.innerWidth - 300)
  })

  React.useEffect((): any => {
    const handleResize = debounce(function handleResize() {
      setWrapperWidth(window.innerWidth - 300)
    }, 200)

    window.addEventListener('resize', handleResize)

    return window.removeEventListener('resize', handleResize)
  })

  const [selectedMembers, setSelectedMembers] = useState<SelectableListOption[]>([])
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<SelectableListOption[]>([])
  const [initialized, setInitialized] = useState<boolean>(false)
  const [currentPlaceholderText, setCurrentPlaceholderText] = useState<string>(placeholderText)

  const _updateAutoCompleteOptions = () => {
    const updatedOptions: SelectableListOption[] = []
    const preselected: SelectableListOption[] = []
    let index = 0
    for (const user of Object.values(userProfiles)) {
      // Opened from a profile's Message button, the composer starts with that person chosen.
      const selected = initialMemberIds?.includes(user.userId) ?? false
      const option = { label: user.nickname, id: user.userId, selected, mutable: true, hide: false, index }
      updatedOptions.push(option)
      if (selected) preselected.push(option)
      index++
    }
    setAutoCompleteOptions(updatedOptions)
    if (preselected.length > 0) setSelectedMembers(preselected)
    setInitialized(true)
  }

  useEffect(() => {
    if (!initialized) {
      _updateAutoCompleteOptions()
    } else if (!open) {
      setAutoCompleteOptions([])
      setInitialized(false)
    }
  }, [open])

  useEffect(() => {
    handleInputChange(selectedMembers.map(member => userProfiles[member.id]))
  }, [selectedMembers])

  // Built on top of the outer theme rather than from scratch: the options and the recipient pills
  // rendered inside it read app tokens (theme.palette.colors), which a bare createTheme drops.
  const customTheme = (outerTheme: Theme) =>
    createTheme(outerTheme, {
      palette: {
        mode: outerTheme.palette.mode,
      },
      components: {
        MuiAutocomplete: {
          styleOverrides: {
            // One definition of the panel, shared with the emoji suggestions.
            paper: dropdownSurfaceStyles(outerTheme.palette.mode === 'dark'),
            // Rows run edge to edge, so the list adds no padding of its own.
            listbox: {
              padding: 0,
              // The design's panel is 254 tall against 56-tall rows — four and a half of them, so
              // the list reads as scrollable. MUI otherwise runs it to 40% of the window height.
              maxHeight: DROPDOWN_MAX_HEIGHT,
            },
          },
          defaultProps: {
            renderOption: (
              props: React.HTMLAttributes<HTMLLIElement>,
              option: SelectableListOption,
              state: AutocompleteRenderOptionState
            ) => {
              const { key, ...optionProps } = props as any
              const userProfile = userProfiles[option.id]
              return (
                <Box
                  key={option.id}
                  classes={classNames(classes.autocompleteBox, {
                    [classes.autocompleteBoxSelected]: state.selected,
                  })}
                  component='li'
                  selected={state.selected}
                  data-testid={`new-message-add-members-autocomplete-option-${option.label}`}
                  {...optionProps}
                >
                  <Grid container item alignItems='center' direction='row' display='flex' gap='5px' padding='0px 0px'>
                    <ProfilePhoto
                      style={{
                        paddingBottom: 0,
                        padding: 0,
                        marginLeft: 0,
                        marginRight: 0,
                        marginBottom: 0,
                        fontSize: '1rem',
                        lineHeight: '1.68',
                        borderRadius: 4,
                      }}
                      className={classes.avatar}
                      userProfile={userProfile}
                      userId={userProfile.userId}
                      size={DROPDOWN_AVATAR_SIZE}
                      data-testid={`new-message-add-members-autocomplete-${option.label}-profilePhoto`}
                    />
                    <Typography
                      variant='body2'
                      className={classes.username}
                      data-testid={`new-message-add-members-autocomplete-${option.label}`}
                    >
                      {option.label}
                    </Typography>
                  </Grid>
                </Box>
              )
            },
          },
        },
      },
    })

  const handleAutoCompleteChange = (
    event: React.SyntheticEvent,
    selected: SelectableListOption[],
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<SelectableListOption>
  ) => {
    setSelectedMembers(selected.map(option => ({ ...option, selected: true })))
    if (reason === 'selectOption') {
      autoCompleteOptions[details!.option.index].selected = true
    } else if (reason === 'removeOption') {
      autoCompleteOptions[details!.option.index].selected = false
    }
    setAutoCompleteOptions(autoCompleteOptions)
  }

  useEffect(() => {
    if (selectedMembers.length > 0) {
      setCurrentPlaceholderText('')
    } else {
      setCurrentPlaceholderText(placeholderText)
    }
  }, [selectedMembers])

  return (
    <Root className={classes.wrapper}>
      <Grid
        container
        item
        className={classes.root}
        justifyContent='flex-start'
        alignItems='center'
        alignContent='center'
        direction='row'
        gap='2px'
      >
        <Grid item flex={1} alignItems='center'>
          <Typography
            noWrap
            variant='subtitle2'
            className={classNames({
              [classes.title]: true,
            })}
            data-testid={'user-search-autocomplete-to'}
          >
            To:
          </Typography>
        </Grid>
        <Grid item alignItems='center' flex={12}>
          <ThemeProvider theme={customTheme(theme)}>
            <Autocomplete
              multiple
              autoHighlight
              options={autoCompleteOptions}
              value={selectedMembers}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              // Recipients are drawn as design pills rather than MUI's default Chip, which is a
              // pill-shaped grey capsule with no avatar. See RecipientPill for the spec.
              renderTags={(value: SelectableListOption[], getTagProps) =>
                value.map((option, index) => {
                  const { key, onDelete } = getTagProps({ index })
                  return (
                    <RecipientPill
                      key={key}
                      userProfile={userProfiles[option.id]}
                      userId={option.id}
                      label={option.label}
                      onDelete={onDelete}
                    />
                  )
                })
              }
              sx={{
                [`& .${autocompleteClasses.inputRoot}`]: {
                  flexWrap: 'wrap',
                  gap: `${PILL_ROW_GAP}px`,
                  padding: 0,
                },
              }}
              renderInput={params => {
                const { InputLabelProps, InputProps, ...rest } = params
                return (
                  <InputBase
                    {...params.InputProps}
                    {...rest}
                    placeholder={currentPlaceholderText}
                    // Opening a new message puts you here with nothing else to do first, so the
                    // field takes the caret and you can simply start typing a name.
                    autoFocus
                    sx={{ ml: 0, alignItems: 'center', alignContent: 'center' }}
                  />
                )
              }}
              onChange={handleAutoCompleteChange}
              data-testid={`new-message-add-members-autocomplete`}
            />
          </ThemeProvider>
        </Grid>
      </Grid>
    </Root>
  )
}

export default UserSearchAutocomplete
