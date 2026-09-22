import React, { MouseEvent } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'
import Jdenticon from '../../../Jdenticon/Jdenticon'

import { Grid, Typography } from '@mui/material'

const PREFIX = 'MentionElement'

const classes = {
  root: `${PREFIX}root`,
  avatarDiv: `${PREFIX}avatarDiv`,
  alignAvatar: `${PREFIX}alignAvatar`,
  data: `${PREFIX}data`,
  highlight: `${PREFIX}highlight`,
  name: `${PREFIX}name`,
  caption: `${PREFIX}caption`,
  captionHighlight: `${PREFIX}captionHighlight`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  // Rows follow 'Button row' (library 5578:43515): 12/16 padding; the selected row is 'Search result / Selected' (3799:12466).
  [`&.${classes.root}`]: {
    paddingTop: theme.space.md,
    paddingLeft: theme.space.lg,
  },

  [`& .${classes.avatarDiv}`]: {
    maxHeight: 18,
    maxWidth: 18,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
  },

  [`& .${classes.alignAvatar}`]: {
    width: 17,
    height: 17,
    marginLeft: 1,
    marginTop: 1,
  },

  [`& .${classes.data}`]: {
    marginLeft: theme.space.sm,
  },

  [`&.${classes.highlight}`]: {
    backgroundColor: theme.palette.colors.linkBlue,
    color: theme.palette.colors.white,
  },

  [`& .${classes.name}`]: {
    marginTop: -4,
  },

  [`& .${classes.caption}`]: {
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.lineHeight,
    color: theme.palette.text.secondary,
  },

  [`& .${classes.captionHighlight}`]: {
    color: 'rgba(255,255,255,0.6)',
  },
}))

export interface MentionElementProps {
  name: string
  channelName: string
  participant?: boolean
  highlight?: boolean
  onMouseEnter: () => void
  onClick: (e: MouseEvent) => void
}

export const MentionElement: React.FC<MentionElementProps> = ({
  name,
  channelName,
  participant = false,
  highlight = false,
  onMouseEnter,
  onClick,
}) => {
  return (
    <StyledGrid
      container
      className={classNames({
        [classes.root]: true,
        [classes.highlight]: highlight,
      })}
      onMouseEnter={onMouseEnter}
      onClick={e => onClick(e)}
    >
      <Grid item className={classes.avatarDiv}>
        <div className={classes.alignAvatar}>
          <Jdenticon size='17' value={name} />
        </div>
      </Grid>
      <Grid item xs className={classes.data}>
        <Typography variant='h5' className={classes.name}>
          {name}
        </Typography>
        {participant && (
          <Typography
            variant='body2'
            className={classNames({
              [classes.caption]: true,
              [classes.captionHighlight]: highlight,
            })}
          >{`Participant in ${channelName}`}</Typography>
        )}
      </Grid>
    </StyledGrid>
  )
}

export default MentionElement
