
import React from 'react'
import PropTypes from 'prop-types'
import * as jdenticon from 'jdenticon'

// Copied from react-jdenticon because its peer dependency clashes with react 18
const Jdenticon = ({ value = 'test', size = '100%' }) => {
  const icon = React.useRef(null)
  React.useEffect(() => {
    jdenticon.update(icon.current, value)
  }, [value])

  return (
    <div>
      <svg data-jdenticon-value={value} height={size} ref={icon} width={size} />
    </div>
  )
}

Jdenticon.propTypes = {
  size: PropTypes.string,
  value: PropTypes.string.isRequired
}

export default Jdenticon
