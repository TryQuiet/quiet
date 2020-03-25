import React, { useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import RegistrationGuideComponent from '../../components/windows/RegistrationGuide'
import text from '../../static/text/registrationGuide'
import electronStore from '../../../shared/electronStore'
import nodeHanlders from '../../../renderer/store/handlers/node'

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      setGuideStatus: nodeHanlders.actions.setGuideStatus
    },
    dispatch
  )
}

export const RegistrationGuide = ({ setGuideStatus }) => {
  const setStoryStatus = () => {
    setGuideStatus(true)
    electronStore.set('storyStatus', true)
  }
  const [currentSlide, setCurrentSlide] = useState(0)
  const nextSlide = () => {
    currentSlide !== 10 ? setCurrentSlide(currentSlide + 1) : setCurrentSlide(currentSlide)
  }
  const prevSlide = () => {
    currentSlide !== 0 ? setCurrentSlide(currentSlide - 1) : setCurrentSlide(currentSlide)
  }
  return <RegistrationGuideComponent setStoryStatus={setStoryStatus} content={text} currentSlide={currentSlide} prevSlide={prevSlide} nextSlide={nextSlide} />
}

export default connect(
  null,
  mapDispatchToProps
)(RegistrationGuide)
