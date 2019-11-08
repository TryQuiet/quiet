import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Formik } from 'formik'
import * as Yup from 'yup'

import { withStyles } from '@material-ui/core/styles'

import SendFundsModal from './SendFundsModal'

const styles = theme => ({})

export const formSchema = Yup.object().shape(
  {
    zec: Yup.number().required('You must enter an amount'),
    usd: Yup.number().required('You must enter an amount')
  },
  ['zec', 'usd']
)

export const SendFundsForm = ({ classes, handleSendTransfer, handleClose, initialValues, payload, history, ...props }) => {
  return (
    <Formik
      enableReinitialize
      validationSchema={formSchema}
      initialValues={initialValues}
      onSubmit={async (values, { resetForm }) => {
        handleSendTransfer({ values, payload, history })
        resetForm()
        handleClose()
      }}
    >
      {({ values, isValid, submitForm, resetForm, setFieldValue, errors, touched }) => {
        return (
          <SendFundsModal
            {...props}
            payload={payload}
            isValid={isValid}
            values={values}
            setFieldValue={setFieldValue}
            errors={errors}
            touched={touched}
            submitForm={submitForm}
            handleClose={handleClose}
          />
        )
      }}
    </Formik>
  )
}

SendFundsForm.propTypes = {
  classes: PropTypes.object.isRequired,
  initialValues: PropTypes.shape({
    zec: PropTypes.string.isRequired,
    usd: PropTypes.string.isRequired,
    shippingInfo: PropTypes.bool.isRequired,
    shippingData: PropTypes.object
  }).isRequired,
  handleSend: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired
}

SendFundsForm.defaultProps = {
  initialValues: {
    zec: '',
    usd: '',
    shippingInfo: false,
    shippingData: {}
  }
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(SendFundsForm)
