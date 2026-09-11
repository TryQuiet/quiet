import React from 'react'
import PropTypes from 'prop-types'
import * as jdenticon from 'jdenticon/browser'
import { lightTheme } from '../../theme'

// Identicons are always drawn on this fixed light background, regardless of the
// active app theme (see #2959 — a dark mode background made icons unreadable).
const BACK_COLOR = lightTheme.palette.background.paper

// Copied from react-jdenticon because its peer dependency clashes with react 18
const Jdenticon = ({ value = 'test', size = '100%', style = {} }) => {
  const icon = React.useRef(null)
  React.useEffect(() => {
    if (!icon.current) return
    jdenticon.update(icon.current, value, { backColor: BACK_COLOR })
  }, [value])

  return (
    <div style={style}>
      <svg data-jdenticon-value={value} height={size} ref={icon} width={size} />
    </div>
  )
}

Jdenticon.propTypes = {
  size: PropTypes.string,
  value: PropTypes.string.isRequired,
}

export default Jdenticon
