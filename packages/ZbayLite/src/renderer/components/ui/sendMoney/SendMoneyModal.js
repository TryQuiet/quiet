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
import { MESSAGE_SIZE } from '../../../zbay/transit'
import { networkFee } from '../../../../shared/static'

const styles = theme => ({})

export const formSchema = users => {
  return Yup.object().shape(
    {
      recipient: Yup.mixed()
        .test(
          'match',
          'Wrong address format or username does not exist',
          function (string) {
            const isAddressValid = /^t1[a-zA-Z0-9]{33}$|^ztestsapling1[a-z0-9]{75}$|^zs1[a-z0-9]{75}$|[A-Za-z0-9]{35}/.test(
              string
            )
            const includesNickname = users
              .toList()
              .filter(obj => obj.get('nickname') === string)
              .first()
            return includesNickname || isAddressValid
          }
        )
        .required('Required'),
      amountZec: Yup.number()
        .min(0.0, 'Please insert amount to send')
        .required('Required'),
      amountUsd: Yup.number().required('Required'),
      memo: Yup.string().max(MESSAGE_SIZE, 'Your messsage is too long'),
      shippingInfo: Yup.bool().required('Required')
    },
    ['recipient', 'amountZec', 'amoundUsd', 'memo']
  )
}

export const validateForm = ({ balanceZec, shippingData }) => values => {
  let errors = {}
  if (balanceZec.isLessThan(values.amountZec)) {
    errors['amountZec'] = `You can't send more than ${balanceZec} ZEC`
  }
  if (
    values.shippingInfo === true &&
    values.memo.length > MESSAGE_SIZE - JSON.stringify(shippingData).length - 40 // TODO decide max size of shippingData
  ) {
    errors['memo'] = `Your messsage and shipping informations are too long`
  }
  return errors
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
  feeZec = networkFee,
  feeUsd = rateUsd.times(feeZec).toNumber(),
  userData,
  sendMessageHandler,
  shippingData,
  targetRecipientAddress,
  openShippingTab,
  openSettingsModal,
  users
}) => {
  const StepComponent = stepToComponent[step]
  return (
    <Formik
      enableReinitialize
      onSubmit={(values, { resetForm }) => {
        const { recipient, ...rest } = values
        const includesNickname =
          users
            .toList()
            .filter(obj => obj.get('nickname') === recipient)
            .first() ||
          users
            .toList()
            .filter(obj => obj.get('address') === recipient)
            .first()
        if (includesNickname) {
          const messageToTransfer = createTransfer({
            recipient: includesNickname.get('address'),
            recipientUsername: includesNickname.get('nickname'),
            ...rest,
            shippingData,
            sender: {
              address: userData.address,
              name: userData.name
            }
          })
          sendMessageHandler(messageToTransfer.toJS())
        } else {
          const messageToTransfer = createTransfer({
            recipient,
            ...rest,
            shippingData,
            sender: {
              address: userData.address,
              name: userData.name
            }
          })
          sendMessageHandler(messageToTransfer.toJS())
        }
      }}
      validationSchema={formSchema(users)}
      initialValues={{
        ...initialValues,
        recipient: targetRecipientAddress || ''
      }}
      validate={validateForm({ balanceZec, shippingData })}
    >
      {({
        values,
        isValid,
        submitForm,
        resetForm,
        errors,
        touched,
        setFieldValue
      }) => {
        const stepToTitle = {
          1: '',
          2: `Send Money to ${
            open ? initialValues.recipient.substring(0, 32) : null
          }...`,
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
            handleClose={() =>
              handleCloseForm({ handleClose, setStep, step, resetForm })
            }
          >
            <StepComponent
              handleClose={handleClose}
              step={step}
              setFieldValue={setFieldValue}
              errors={errors}
              touched={touched}
              setStep={setStep}
              amountUsd={values.amountUsd}
              amountZec={values.amountZec}
              feeZec={feeZec}
              feeUsd={feeUsd}
              sent={sent}
              values={values}
              memo={values.memo}
              recipient={targetRecipientAddress || values.recipient}
              balanceZec={balanceZec}
              isValid={isValid}
              rateZec={rateZec}
              rateUsd={rateUsd}
              submitForm={submitForm}
              resetForm={resetForm}
              shippingData={shippingData}
              openShippingTab={openShippingTab}
              openSettingsModal={openSettingsModal}
              users={users}
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
  rateZec: PropTypes.number.isRequired,
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

export default R.compose(React.memo, withStyles(styles))(SendMoneyModal)
