import React from 'react'
import PropTypes from 'prop-types'

export const Icon = ({ className, src, ...props }) => (
  <img className={className} src={src} {...props} />
)

Icon.propTypes = {
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  src: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
}

export default React.memo(Icon)
