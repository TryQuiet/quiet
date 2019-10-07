import React from 'react'
import PropTypes from 'prop-types'

export const Icon = ({ className, src }) => <img className={className} src={src} />

Icon.propTypes = {
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  src: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
}

export default React.memo(Icon)
