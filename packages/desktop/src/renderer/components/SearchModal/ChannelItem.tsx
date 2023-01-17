import React, { useEffect, useRef, useState } from 'react'
import { Typography } from '@mui/material'
import classNames from 'classnames'

const ChannelItem = ({
  item,
  focused,
  className,
  classNameSelected,
  onClickHandler,
  onKeyPressHandler
}) => {
  const [setted, isSetted] = useState(false)
  const ref = useRef<HTMLDivElement>()

  useEffect(() => {
    if (focused) {
      isSetted(true)
      ref.current.focus()
    }
  }, [focused, setted])

  return (
    <div
      key={item.name}
      className={classNames(className, {
        [classNameSelected]: focused
      })}
      tabIndex={0}
      ref={ref}
      onClick={() => onClickHandler(item.address)}
      onKeyPress={e => onKeyPressHandler(e, item.address)}>
      <Typography variant='body2'>{`# ${item.name}`}</Typography>
    </div>
  )
}

export default ChannelItem
