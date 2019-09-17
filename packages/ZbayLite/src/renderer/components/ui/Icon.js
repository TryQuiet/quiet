import React from 'react'
import PropTypes from 'prop-types'

export const Icon = ({ className, src }) => <img className={className} src={src} />

Icon.propTypes = {
  className: PropTypes.object.isRequired,
  src: PropTypes.string.isRequired
}

export default React.memo(Icon)
