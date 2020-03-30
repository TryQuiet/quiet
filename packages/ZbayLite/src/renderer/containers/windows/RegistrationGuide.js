import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import RegistrationGuideComponent from '../../components/windows/RegistrationGuide'
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

export const RegistrationGuide = ({ setGuideStatus, getCurrentSlide, setNextSlide, setPrevSlide }) => {
  const setStoryStatus = () => {
    setGuideStatus(true)
    electronStore.set('storyStatus', true)
  }
  return <RegistrationGuideComponent setStoryStatus={setStoryStatus} content={text} currentSlide={getCurrentSlide} prevSlide={setPrevSlide} nextSlide={setNextSlide} />
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RegistrationGuide)
