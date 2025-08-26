import React from 'react'
import { JoiningOptInComponent } from './JoiningOptIn.component'
import { useDispatch, useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'

const JoiningOptInModal = () => {
  const dispatch = useDispatch()
  const waitingForOptIn = useSelector(communities.selectors.qssOptInRequested)
  const invitationCodes = useSelector(communities.selectors.invitationCodes)

  const onChoose = (useServer: boolean) => {
    dispatch(communities.actions.setQssOptInResponse(useServer))
  }

  return <JoiningOptInComponent open={waitingForOptIn} onChoose={onChoose} />
}

export default JoiningOptInModal
