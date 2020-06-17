import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import CreateChannelFormComponent from '../../../components/widgets/channels/CreateChannelForm'
import CreateChannelFromFinish from '../../../components/widgets/channels/CreateChannelFormFinish'
import channelsHandlers from '../../../store/handlers/channels'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSubmit: channelsHandlers.epics.createChannel
    },
    dispatch
  )
const stepToComponent = {
  0: CreateChannelFormComponent,
  1: CreateChannelFromFinish
}
export const CreateChannelForm = ({ ...props }) => {
  const [step, setStep] = React.useState(0)
  const Component = stepToComponent[step]
  return <Component {...props} setStep={setStep} />
}

export default connect(null, mapDispatchToProps)(CreateChannelForm)
