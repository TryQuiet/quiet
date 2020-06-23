import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Formik } from 'formik'
import { withStyles } from '@material-ui/core/styles'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'
import * as Yup from 'yup'
import BigNumber from 'bignumber.js'

import Modal from '../Modal'
import SendMoneyInitial from './SendMoneyInitial'
import { networkFee } from '../../../../shared/static'
import { MESSAGE_SIZE } from '../../../zbay/transit'
import { createTransfer } from '../../../zbay/messages'
import { getBytesSize } from '../../../../shared/helpers'

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
      memo: Yup.string().test('testSize', 'Your message is too long', function (
        value
      ) {
        return getBytesSize(value) <= MESSAGE_SIZE
      })
    },
    ['recipient', 'amountZec', 'amoundUsd', 'memo']
  )
}

export const validateForm = ({ balanceZec, shippingData }) => values => {
  let errors = {}
  if (balanceZec.isLessThan(values.amountZec)) {
    errors['amountZec'] = `You can't send more than ${balanceZec} ZEC`
  }
  if (values.shippingInfo === true && getBytesSize(values.memo) > MESSAGE_SIZE) {
    errors['memo'] = `Your message and shipping information are too long`
  }
  return errors
}

export const SendMoneyMain = ({
  initialValues,
  open,
  users,
  nickname,
  balanceZec,
  rateZec,
  rateUsd,
  userData,
  sendMessageHandler,
  sendPlainTransfer,
  handleClose,
  feeZec = networkFee,
  feeUsd = rateUsd.times(feeZec).toNumber(),
  openSentFundsModal
}) => {
  return (
    <Formik
      enableReinitialize
      onSubmit={(values, { resetForm }) => {
        const { shouldIncludeMeta } = values
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
        if (includesNickname && shouldIncludeMeta === 'yes') {
          const messageToTransfer = createTransfer({
            recipient: includesNickname.get('address'),
            recipientUsername: includesNickname.get('nickname'),
            ...rest,
            sender: {
              address: userData.address,
              name: userData.name
            }
          })
          sendMessageHandler(messageToTransfer.toJS())
        } else {
          const transferData = {
            amount: values.amountZec,
            destination: includesNickname
              ? includesNickname.get('address')
              : values.recipient,
            memo: values.recipient.length !== 35 ? values.memo : null
          }
          sendPlainTransfer(transferData)
        }
        resetForm()
      }}
      validationSchema={formSchema(users)}
      initialValues={{
        ...initialValues
      }}
      validate={validateForm({ balanceZec })}
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
        return (
          <Modal open={open} handleClose={handleClose}>
            <AutoSizer>
              {({ width, height }) => (
                <Scrollbars
                  autoHideTimeout={500}
                  style={{ width: width, height: height }}
                >
                  <SendMoneyInitial
                    setFieldValue={setFieldValue}
                    errors={errors}
                    touched={touched}
                    values={values}
                    memo={values.memo}
                    users={users}
                    nickname={nickname}
                    balanceZec={balanceZec}
                    rateUsd={rateUsd}
                    rateZec={rateZec}
                    isValid={isValid}
                    submitForm={submitForm}
                    resetForm={resetForm}
                    feeUsd={feeUsd}
                    feeZec={feeZec}
                    handleClose={handleClose}
                    amountZec={values.amountZec}
                    amountUsd={values.amountUsd}
                    recipient={values.recipient}
                    openSentFundsModal={openSentFundsModal}
                  />
                </Scrollbars>
              )}
            </AutoSizer>
          </Modal>
        )
      }}
    </Formik>
  )
}

SendMoneyMain.propTypes = {
  classes: PropTypes.object.isRequired,
  initialValues: PropTypes.shape({
    recipient: PropTypes.string.isRequired,
    amountZec: PropTypes.string.isRequired,
    amountUsd: PropTypes.string.isRequired
  }).isRequired,
  balanceZec: PropTypes.instanceOf(BigNumber).isRequired,
  nickname: PropTypes.string.isRequired,
  rateUsd: PropTypes.instanceOf(BigNumber).isRequired,
  rateZec: PropTypes.number.isRequired,
  feeZec: PropTypes.number,
  feeUsd: PropTypes.number,
  handleClose: PropTypes.func.isRequired,
  sendMessageHandler: PropTypes.func.isRequired,
  sendPlainTransfer: PropTypes.func.isRequired,
  openSentFundsModal: PropTypes.func.isRequired
}

SendMoneyMain.defaultProps = {
  initialValues: {
    recipient: '',
    amountZec: '',
    amountUsd: ''
  }
}

export default R.compose(React.memo, withStyles(styles))(SendMoneyMain)
