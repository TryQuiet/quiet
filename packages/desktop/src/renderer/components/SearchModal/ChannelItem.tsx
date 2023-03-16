import React from 'react'
import { Typography } from '@mui/material'
import classNames from 'classnames'
import { useEnterPress } from '../../containers/hooks'

const ChannelItem = ({ item, focused, className, classNameSelected, onClickHandler }) => {
  useEnterPress(() => {
    if (focused) {
      onClickHandler(item.address)
    }
  }, focused)

  return (
    <div
      key={item.name}
      className={classNames(className, {
        [classNameSelected]: focused
      })}
      tabIndex={0}
      onClick={() => {
        onClickHandler(item.address)
      }}>
      <Typography variant='body2'>{`# ${item.name}`}</Typography>
    </div>
  )
}

export default ChannelItem
