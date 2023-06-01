import React, { useEffect, useState } from 'react'
import { Typography } from '@mui/material'
import classNames from 'classnames'
import { useEnterPress } from '../../containers/hooks'

const ChannelItem = ({
  item,
  focused,
  className,
  classNameSelected,
  onClickHandler,
  channelInput
}) => {
  const [initialRender, setInitialRender] = useState(false)

  useEffect(() => {
    setInitialRender(true)
  }, [])

  useEnterPress(() => {
    if (focused) {
      onClickHandler(item.id)
    }
  }, [focused, channelInput])

  return (
    <div
      key={item.name}
      className={classNames(className, {
        [classNameSelected]: focused
      })}
      tabIndex={0}
      onClick={() => {
        onClickHandler(item.id)
      }}>
      <Typography variant='body2'>{`# ${item.name}`}</Typography>
    </div>
  )
}

export default ChannelItem
