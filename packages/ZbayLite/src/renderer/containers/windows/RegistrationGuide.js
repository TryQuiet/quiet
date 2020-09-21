import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'

import RegistrationGuideComponent from '../../components/windows/RegistrationGuide'
import { withModal } from '../../store/handlers/modals'
import text from '../../static/text/registrationGuide'
import electronStore from '../../../shared/electronStore'
import nodeHandlers from '../../../renderer/store/handlers/node'
import nodeSelector from '../../../renderer/store/selectors/node'

export const mapStateToProps = state => ({
  getCurrentSlide: nodeSelector.currentSlide(state)
})

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      setGuideStatus: nodeHandlers.actions.setGuideStatus,
      setNextSlide: nodeHandlers.actions.setNextSlide,
      setPrevSlide: nodeHandlers.actions.setPrevSlide
    },
    dispatch
  )
}

export const RegistrationGuide = ({ setGuideStatus, getCurrentSlide, setNextSlide, setPrevSlide, open, handleClose }) => {
  const setStoryStatus = () => {
    setGuideStatus(true)
    electronStore.set('storyStatus', true)
    handleClose()
  }
  return <RegistrationGuideComponent setStoryStatus={setStoryStatus} content={text} currentSlide={getCurrentSlide} prevSlide={setPrevSlide} nextSlide={setNextSlide} open={open} handleClose={handleClose} />
}

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withModal('registrationGuide')
)(RegistrationGuide)
