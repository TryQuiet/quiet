import React from 'react'
import { DateTime } from 'luxon'
import { Formik, Form } from 'formik'
import { Typography } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'

import Modal from '../../ui/Modal/Modal'
import { AutocompleteField } from '../../ui/Autocomplete/Autocomplete'
import LoadindButton from '../../ui/LoadingButton/LoadingButton'

import { User } from '@zbayapp/nectar/lib/sagas/users/users.slice'
import { IChannelInfo } from '@zbayapp/nectar/lib/sagas/publicChannels/publicChannels.types'
import { Dictionary } from '@reduxjs/toolkit'

const useStyles = makeStyles(theme => ({
  root: {
    padding: 32,
    height: '100%',
    width: '100%'
  },
  fullContainer: {
    width: '100%',
    height: '100%'
  },
  input: {
    marginBottom: 0,
    marginTop: 0,
    width: '100%'
  },
  button: {
    width: 151,
    height: 60,
    fontSize: 16,
    backgroundColor: theme.palette.colors.zbayBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.zbayBlue
    }
  },
  title: {
    marginBottom: 24
  },
  info: {
    marginTop: 8,
    lineHeight: '18px',
    color: theme.palette.colors.darkGray,
    letterSpacing: '0.4px'
  },
  channelTitle: {
    lineHeight: '26px',
    fontSize: 16
  },
  channelInfo: {
    lineHeight: '18px',
    color: theme.palette.colors.darkGray,
    letterSpacing: '0.4px'
  },
  option: {},
  materialOption: {
    height: 68
  },
  timeInfo: {
    marginTop: -16,
    lineHeight: '18px',
    color: theme.palette.colors.darkGray,
    letterSpacing: '0.4px',
    marginBottom: 16
  },
  description: {
    fontSize: 14,
    lineHeight: '24px'
  },
  informationBox: {
    backgroundColor: theme.palette.colors.gray03,
    borderRadius: 4,
    height: 42,
    color: theme.palette.colors.trueBlack,
    letterSpacing: '0.4px',
    lineHeight: '18px',
    fontSize: 12,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: 24,
    marginTop: 16
  }
}))

interface JoinChannelModalProps {
  open: boolean
  handleClose: () => void
  joinChannel: (channel: IChannelInfo) => void
  publicChannels: IChannelInfo[]
  users: Dictionary<User>
}

export const JoinChannelModal: React.FC<JoinChannelModalProps> = ({
  open,
  handleClose,
  joinChannel,
  publicChannels,
  users
}) => {
  const classes = useStyles({})
  const channelsArray = Array.from(Object.values(publicChannels))
  const [step, setStep] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  return (
    <Modal
      open={open}
      handleClose={() => {
        handleClose()
        setStep(0)
      }}
      title=''
      fullPage>
      <Grid className={classes.root}>
        <Formik
          initialValues={{
            channel: {
              name: '',
              owner: '',
              timestamp: '',
              description: ''
            }
          }}
          onSubmit={async (values, { resetForm }) => {
            const ch = channelsArray.find(channel => channel.name === values.channel.name)
            if (ch) {
              setLoading(true)
              joinChannel(ch)
              setLoading(false)
              setStep(0)
              handleClose()
              resetForm()
            }
          }}>
          {({ values, setFieldValue }) => {
            return (
              <Form className={classes.fullContainer}>
                <Grid
                  container
                  justify='flex-start'
                  direction='column'
                  className={classes.fullContainer}>
                  <Typography variant='h3' className={classes.title}>
                    {step === 0 ? 'Search for Channels' : `#${values.channel.name}`}
                  </Typography>
                  {step !== 0 && (
                    <Typography variant='caption' className={classes.timeInfo}>
                      {`Created by @${users[values.channel.owner]
                          ? users[values.channel.owner].username
                          : 'Unnamed'
                        } on ${DateTime.fromSeconds(parseInt(values.channel.timestamp)).toFormat(
                          'LLL d, y'
                        )} `}
                    </Typography>
                  )}
                  {step === 0 ? (
                    <AutocompleteField
                      name={'channel'}
                      classes={{ option: classes.materialOption }}
                      options={channelsArray}
                      renderOption={option => {
                        const time = DateTime.fromSeconds(parseInt(option.timestamp))
                        return (
                          <Grid container direction='column' className={classes.option}>
                            <Typography variant='body1' className={classes.channelTitle}>
                              {`#${option.name}`}
                            </Typography>
                            <Typography variant='caption' className={classes.channelInfo}>
                              {`Created by @${users[option.owner] ? users[option.owner].username : 'Unnamed'
                                } on ${time.toFormat('LLL d, y')} `}
                            </Typography>
                          </Grid>
                        )
                      }}
                      value={values.channel}
                      onChange={(_e, v) => {
                        setFieldValue('channel', v)
                        setStep(1)
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          className={classes.input}
                          variant='outlined'
                          placeholder={'Search'}
                          margin='normal'
                        />
                      )}
                    />
                  ) : (
                    <>
                      <Typography variant='body2' className={classes.description}>
                        {`${values.channel.description}`}
                      </Typography>
                      <Grid container alignItems='center' className={classes.informationBox}>
                          After joining, it may take some time for messages to fully load.
                      </Grid>
                    </>
                  )}

                  {step !== 0 ? (
                    <LoadindButton
                      variant='contained'
                      color='primary'
                      size='large'
                      type='submit'
                      text='Join Channel'
                      classes={{ button: classes.button }}
                      inProgress={loading}
                      disabled={loading}
                    />
                  ) : (
                    <Typography variant='caption' className={classes.info}>
                        If you have an invite link, open it in a browser
                    </Typography>
                  )}
                </Grid>
              </Form>
            )
          }}
        </Formik>
      </Grid>
    </Modal>
  )
}

export default JoinChannelModal
