import React from 'react'
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import classNames from 'classnames'
import WarnIcon from '../../../static/images/warning-icon.svg'

const PREFIX = 'UserLabel-'

const classes = {
  messageCard: `${PREFIX}messageCard`,
  textWhite: `${PREFIX}textWhite`,
  textBlack: `${PREFIX}textBlack`,
  wrapper: `${PREFIX}wrapper`,
  wrapperRed: `${PREFIX}wrapperRed`,
  wrapperGray: `${PREFIX}wrapperGray`,
  image: `${PREFIX}image`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  margin: '-4px 8px 0 4px',
  [`& .${classes.wrapper}`]: {
    padding: '1px 6px',
    borderRadius: '8px',
  },
  [`& .${classes.wrapperGray}`]: {
    backgroundColor: theme.palette.colors.gray03,
  },
  [`& .${classes.wrapperRed}`]: {
    backgroundColor: theme.palette.colors.error,
  },
  [`& .${classes.textWhite}`]: {
    color: 'white',
  },
  [`& .${classes.textBlack}`]: {
    color: 'black',
  },
  [`& .${classes.image}`]: {
    width: '12px',
    height: '12px',
    marginLeft: '4px',
  },
}))

export type UserLabelProps = {
  type: UserLabelType
}

export enum UserLabelType {
  DUPLICATE = 'Duplicate',
  UNREGISTERED = 'Unregistered',
}

const UserLabel: React.FC<UserLabelProps> = ({ type }) => {
  return (
    <StyledGrid>
      <Grid
        container
        item
        alignItems='center'
        justifyContent='space-between'
        className={classNames(classes.wrapper, {
          [classes.wrapperGray]: type === UserLabelType.UNREGISTERED,
          [classes.wrapperRed]: type === UserLabelType.DUPLICATE,
        })}
      >
        {type === UserLabelType.DUPLICATE && <img className={classes.image} src={WarnIcon} />}
        <Typography
          className={classNames(classes.wrapper, {
            [classes.textBlack]: type === UserLabelType.UNREGISTERED,
            [classes.textWhite]: type === UserLabelType.DUPLICATE,
          })}
          variant='caption'
        >
          {type}
        </Typography>
      </Grid>
    </StyledGrid>
  )
}

export default UserLabel
