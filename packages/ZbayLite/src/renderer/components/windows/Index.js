import React from 'react'
import { Redirect } from 'react-router'
import PropTypes from 'prop-types'

const getRoute = ({ exists, locked }) => {
  if (!exists) {
    return '/vault/create'
  } else if (locked) {
    return '/vault/unlock'
  }
  return '/home'
}

export const Index = (props) => (<Redirect to={getRoute(props)} />)

Index.propTypes = {
  exists: PropTypes.bool.isRequired,
  locked: PropTypes.bool.isRequired
}

Index.defaultProps = {
  exists: false,
  locked: true
}

export default Index
