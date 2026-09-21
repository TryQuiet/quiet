import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

import { styled, ThemeProvider, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Fuse from 'fuse.js'

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
import { SelectableListOption, UserSearchFuzzyProps, UserSearchProps } from './UserSearch.types'

const PREFIX = 'UserSearchFuzzy'

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

const logger = createLogger('widgets:UserSearchFuzzy')

export const UserSearchFuzzy: React.FC<UserSearchFuzzyProps> = ({
  placeholderText,
  options,
  setOptions,
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

  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set())
  const [initialized, setInitialized] = useState<boolean>(false)
  const [currentPlaceholderText, setCurrentPlaceholderText] = useState<string>(placeholderText)
  const [fuzzySearch, setFuzzySearch] = useState<Fuse<SelectableListOption> | undefined>(undefined)
  const [membershipSearchInput, setMembershipSearchInput] = useState<string | undefined>(undefined)

  const _initialize = () => {
    setVisibleIndices(_getAllOptionsVisible())
    setFuzzySearch(
      new Fuse(options, {
        keys: ['label'],
        minMatchCharLength: 1,
        ignoreDiacritics: true,
        threshold: 0.3,
      })
    )
  }

  useEffect(() => {
    _initialize()
  }, [options])

  const _getAllOptionsVisible = (): Set<number> => {
    logger.warn('options length', options.length)
    if (options == null) return new Set()
    return new Set(options.filter(option => !option.hide).map(option => option.index))
  }

  const _parseFilterText = (rawFilterText: string): string => {
    if (rawFilterText === '@') {
      return ''
    }
    if (rawFilterText.startsWith('@')) {
      return rawFilterText.slice(1)
    }
    return rawFilterText
  }

  const _fuzzyFilterUsers = (filterText: string): Set<number> => {
    if (fuzzySearch == null || options == null) {
      return _getAllOptionsVisible()
    }
    const searchResults = fuzzySearch.search(filterText)
    return new Set(searchResults.map(result => result.item.index))
  }

  const onChangeText = (value?: string) => {
    logger.warn(value)
    setMembershipSearchInput(value)
    let newVisibleIndices: Set<number>
    if (value === '' || value == null) {
      logger.warn('setting all visible')
      newVisibleIndices = _getAllOptionsVisible()
      setCurrentPlaceholderText(placeholderText)
      logger.warn(visibleIndices.size)
    } else {
      setCurrentPlaceholderText('')
      newVisibleIndices = _fuzzyFilterUsers(_parseFilterText(value))
    }
    setVisibleIndices(newVisibleIndices)
    handleInputChange(options.filter(option => newVisibleIndices.has(option.index)))
  }

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
      >
        <Grid item alignItems='center' flex={12}>
          <InputBase
            onChange={event => onChangeText(event.currentTarget.value)}
            placeholder={currentPlaceholderText}
            sx={{ ml: 0, alignItems: 'center', alignContent: 'center', width: 375 }}
          />
        </Grid>
      </Grid>
    </Root>
  )
}

export default UserSearchFuzzy
