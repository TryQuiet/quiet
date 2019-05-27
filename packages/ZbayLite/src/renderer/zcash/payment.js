import Joi from 'joi'

// TODO: remove joi and use yup since joi doesn't support browsers
const amountsSchema = Joi.array().items(
  Joi.object().keys({
    address: Joi.string().required(),
    amount: Joi.string().required(),
    memo: Joi.string().required()
  }).required()
)

export default (zcashClient) => {
  const received = async (address) => zcashClient.request.z_listreceivedbyaddress(address)

  const send = async ({ from, amounts, minConfirmations = 1, fee = 0.0001 }) => {
    const { error, value } = Joi.validate(amounts, amountsSchema, { abortEarly: false })
    if (error) {
      throw Error(error)
    }
    return zcashClient.request.z_sendmany(from, value, minConfirmations, fee)
  }

  return {
    received,
    send
  }
}
