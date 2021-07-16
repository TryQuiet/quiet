import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router'

import modalsSelectos from '../../store/selectors/modals'

export const mapStateToProps = state => ({
  openedModal: modalsSelectos.open('topUp')(state)
})

export const Loading = () => {
  return <Redirect to='/vault' />
}

export default connect(
  mapStateToProps
)(Loading)
