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

  [`& .${classes.title}`]: {
    fontSize: '1rem',
    lineHeight: '1.68',
    color: theme.palette.colors.gray70,
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
    width: theme.componentSizes.avatar.small,
    height: theme.componentSizes.avatar.small,
    marginRight: 0,
    paddingBottom: 0,
    borderRadius: 4,
    background: theme.palette.background.paper,
    marginBottom: 0,
    fontSize: '1rem',
    lineHeight: '1.68',
  },

  [`& .${classes.username}`]: {
    fontWeight: 400,
    paddingLeft: 0,
    paddingRight: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 150,
    fontSize: '1rem',
    whiteSpace: 'nowrap',
    lineHeight: 1.68,
  },

  [`& .${classes.autocompleteBox}`]: {
    borderRadius: '8px',
    margin: '5px',
    [`&.${autocompleteClasses.option}`]: {
      padding: '8px',
    },
  },

  [`& .${classes.autocompleteBoxSelected}`]: {
    backgroundColor: theme.palette.colors.darkPurple,
  },
}))

const logger = createLogger('widgets:UserSearchAutocomplete')

export const UserSearchAutocomplete: React.FC<UserSearchProps> = ({
  userProfiles,
  placeholderText,
  handleInputChange,
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
    let index = 0
    for (const user of Object.values(userProfiles)) {
      updatedOptions.push({ label: user.nickname, id: user.userId, selected: false, mutable: true, hide: false, index })
      index++
    }
    setAutoCompleteOptions(updatedOptions)
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

  const customTheme = (outerTheme: Theme) =>
    createTheme({
      palette: {
        mode: outerTheme.palette.mode,
      },
      components: {
        MuiAutocomplete: {
          defaultProps: {
            renderOption: (props, option, state) => {
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
                      size={theme.componentSizes.avatar.small}
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
              renderInput={params => {
                const { InputLabelProps, InputProps, ...rest } = params
                return (
                  <InputBase
                    {...params.InputProps}
                    {...rest}
                    placeholder={currentPlaceholderText}
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
