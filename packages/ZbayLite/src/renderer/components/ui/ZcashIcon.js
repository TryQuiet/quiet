import React from 'react'
import PropTypes from 'prop-types'

export const ZcashIcon = ({ size, className }) => (
  <svg
    id='Layer_1'
    data-name='Layer 1'
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 493.33 490.18'
    className={className}
    style={{ width: size, height: size }}
  >
    <path d='M245.4,20C121.11,20,20,121.11,20,245.39s101.11,225.4,225.4,225.4,225.39-101.11,225.39-225.4S369.68,20,245.4,20Zm0,413.58c-103.77,0-188.19-84.42-188.19-188.19S141.63,57.21,245.4,57.21s188.18,84.42,188.18,188.18S349.16,433.58,245.4,433.58Z' />
    <polygon points='325.78 175.13 325.78 140.75 264.28 140.75 264.28 103.02 226.51 103.02 226.51 140.75 165.02 140.75 165.02 186.29 260.35 186.29 182.39 293.58 165.02 315.66 165.02 350.04 226.51 350.04 226.51 387.65 231.04 387.65 231.04 387.81 259.75 387.81 259.75 387.65 264.28 387.65 264.28 350.04 325.78 350.04 325.78 304.5 230.44 304.5 308.4 197.21 325.78 175.13' />
  </svg>
)

ZcashIcon.propTypes = {
  size: PropTypes.number.isRequired
}

ZcashIcon.defaultProps = {
  size: 16
}

export default React.memo(ZcashIcon)
