import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Formik } from 'formik'
import * as Yup from 'yup'

import { withStyles } from '@material-ui/core/styles'

import SendFundsModal from './SendFundsModal'

const styles = theme => ({})

export const formSchema = (provideShipping = false) =>
  Yup.object().shape(
    {
      zec: Yup.number().required('You must enter an amount'),
      usd: Yup.number().required('You must enter an amount'),
      shippingInfo: provideShipping
        ? Yup.bool().equals([true], 'You have to provide shipping information')
        : Yup.bool().equals([true, false], '')
    },
    ['zec', 'usd', 'shippingInfo']
  )

export const SendFundsForm = ({
  classes,
  handleSendTransfer,
  handleClose,
  payload,
  history,
  ...props
}) => {
  const initialValues = {
    zec: payload ? parseFloat(payload.priceZcash).toFixed(4) : 0.0,
    usd: payload ? parseFloat(payload.priceUSD).toFixed(2) : 0.0,
    shippingInfo: false
  }
  return (
    <Formik
      enableReinitialize
      validateOnMount
      isInitialValid={!payload.provideShipping}
      validationSchema={formSchema(payload.provideShipping)}
      initialValues={initialValues}
      onSubmit={async (values, { resetForm }) => {
        handleSendTransfer({ values, payload, history })
        resetForm()
        handleClose()
      }}
    >
      {({
        values,
        isValid,
        submitForm,
        resetForm,
        setFieldValue,
        errors,
        touched
      }) => {
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

  handleSendTransfer: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired
}

SendFundsForm.defaultProps = {
  payload: {
    provideShipping: false
  }
}

export default R.compose(React.memo, withStyles(styles))(SendFundsForm)
