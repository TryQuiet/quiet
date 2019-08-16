import React from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import * as R from 'ramda'
import { Formik } from 'formik'
import BigNumber from 'bignumber.js'
import { withStyles } from '@material-ui/core/styles'

import Modal from '../Modal'
import SendMoneyForm from './SendMoneyForm'
import SendMoneyTransactionDetails from './SendMoneyTransactionDetails'
import SendMoneySending from './SendMoneySending'
import { createTransfer } from '../../../zbay/messages'

const styles = theme => ({})

export const formSchema = Yup.object().shape(
  {
    recipient: Yup.string()
      .matches(/^(?:.{35}|.{78}|.{88})$/, 'Please insert correct address')
      .required('Required'),
    amountZec: Yup.number()
      .min(0.00000001, 'Please insert amount to send')
      .required('Required'),
    amountUsd: Yup.number()
      .required('Required'),
    memo: Yup.string().max(300, 'Your messsage is too long'),
    shippingInfo: Yup.bool().required('Required')
  },
  ['recipient', 'amountZec', 'amountUsd', 'memo', 'shippingInfo']
)

export const validateForm = balanceZec => values => {
  return (
    balanceZec.isLessThan(values.amountZec) && {
      amountZec: `You can't send more than ${balanceZec}`
    }
  )
}
const handleCloseForm = ({ step, handleClose, resetForm, setStep }) => {
  handleClose()
  if (step === 4 || step === 3) {
    resetForm()
    setStep(1)
  }
}
export const SendMoneyModal = ({
  classes,
  initialValues,
  step,
  setStep,
  balanceZec,
  handleClose,
  sent = true, // TODO get confirmation from node
  open,
  rateUsd,
  rateZec,
  feeZec = 0.001,
  feeUsd = rateUsd.times(feeZec).toNumber(),
  userData,
  sendMessageHandler
}) => {
  const StepComponent = stepToComponent[step]
  return (
    <Formik
      onSubmit={(values, { resetForm }) => {
        const messageToTransfer = createTransfer({
          ...values,
          sender: {
            address: userData.address,
            name: userData.name
          }
        })
        sendMessageHandler(messageToTransfer.toJS())
      }}
      validationSchema={formSchema}
      initialValues={initialValues}
      validate={validateForm(balanceZec)}
    >
      {({ values, isValid, submitForm, resetForm }) => {
        const stepToTitle = {
          1: 'Send Money',
          2: `Send Money to ${values.recipient.substring(0, 32)}...`,
          3: 'Send Complete',
          4: 'Transaction Details'
        }
        return (
          <Modal
            title={stepToTitle[step]}
            step={step}
            setStep={setStep}
            open={open}
            canGoBack={step === 2}
            handleClose={() => handleCloseForm({ handleClose, setStep, step, resetForm })}
          >
            <StepComponent
              step={step}
              setStep={setStep}
              amountUsd={values.amountUsd}
              amountZec={values.amountZec}
              feeZec={feeZec}
              feeUsd={feeUsd}
              sent={sent}
              values={values}
              memo={values.memo}
              recipient={values.recipient}
              balanceZec={balanceZec}
              isValid={isValid}
              rateZec={rateZec}
              rateUsd={rateUsd}
              submitForm={submitForm}
              resetForm={resetForm}
            />
          </Modal>
        )
      }}
    </Formik>
  )
}
const stepToComponent = {
  1: SendMoneyForm,
  2: SendMoneyTransactionDetails,
  3: SendMoneySending,
  4: SendMoneyTransactionDetails
}

SendMoneyModal.propTypes = {
  classes: PropTypes.object.isRequired,
  initialValues: PropTypes.shape({
    recipient: PropTypes.string.isRequired,
    amountZec: PropTypes.string.isRequired,
    amountUsd: PropTypes.string.isRequired,
    memo: PropTypes.string.isRequired,
    shippingInfo: PropTypes.bool.isRequired
  }).isRequired,
  step: PropTypes.number.isRequired,
  setStep: PropTypes.func.isRequired,
  balanceZec: PropTypes.instanceOf(BigNumber).isRequired,
  rateUsd: PropTypes.instanceOf(BigNumber).isRequired,
  rateZec: PropTypes.instanceOf(BigNumber).isRequired,
  feeZec: PropTypes.number,
  feeUsd: PropTypes.number,
  handleClose: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
  sendMessageHandler: PropTypes.func.isRequired
}

SendMoneyModal.defaultProps = {
  initialValues: {
    recipient: '',
    amountZec: '',
    amountUsd: '',
    memo: '',
    shippingInfo: false
  }
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(SendMoneyModal)
