import React from 'react'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import Button from '@material-ui/core/Button'
import { Formik, Field } from 'formik'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'

import radioChecked from '../../static/images/radioChecked.svg'
import radioUnselected from '../../static/images/radioUnselected.svg'
import Icon from '../ui/Icon/Icon'
import Modal from '../ui/Modal/Modal'
import TextField from '../ui/TextField/TextField'

const useStyles = makeStyles((theme) => ({
  title: {
    marginBottom: 24
  },
  description: {
    fontSize: 14,
    color: theme.palette.colors.trueBlack
  },
  descriptionBox: {
    marginBottom: 40
  },
  subtitleDesc: {
    fontWeight: 500
  },
  subtitleDescBox: {
    marginBottom: 8
  },
  radioContainer: {
    marginTop: 10,
    marginBottom: 42
  },
  radioLabel: {
    fontSize: 14,
    fontHeight: '20px',
    color: theme.palette.colors.trueBlack
  },
  field: {
    width: 600
  },
  label: {
    fontSize: 12,
    fontHeight: '14px',
    color: theme.palette.colors.black30
  },
  serverURL: {
    marginTop: 10
  },
  button: {
    marginBottom: 10,
    height: 60,
    width: 198,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.zbayBlue
  },
  root: {
    padding: '0px 25px'
  }
}))

interface SecurityModalProps {
  open: boolean
  handleClose: () => void
  initialValues: {
    defaultLightWalletServer: string
    lightWalletServerUrl: string
    isTorEnabled: string
  }
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ open, handleClose, initialValues }) => {
  const classes = useStyles({})
  return (
    <Modal
      open={open}
      handleClose={handleClose}
    >
      <AutoSizer>
        {({ width, height }) => (
          <Scrollbars
            autoHideTimeout={500}
            style={{ width: width + 50, height: height }}
          >
            <Formik
              enableReinitialize
              initialValues={initialValues}
              onSubmit={() => console.log('saving info')}
            >
              {({
                values,
                setFieldValue
              }) => {
                return (
                  <Grid className={classes.root} container justify={'center'} alignContent={'flex-start'} alignItems={'flex-start'}>
                    <Grid container item>
                      <Grid className={classes.title} item>
                        <Typography variant='h3'>Network</Typography>
                      </Grid>
                      <Grid className={classes.descriptionBox} item>
                        <Typography className={classes.description} variant='caption'>To save you from downloading massive amounts of blockchain data, Zbay connects to a light wallet server, a kind of "supernode"
                        on the blockchain network. For increased privacy, you can also connect through Tor.
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container item>
                      <Grid className={classes.subtitleDescBox} item>
                        <Typography className={classes.subtitleDesc} variant='subtitle1'>Light wallet server</Typography>
                      </Grid>
                      <Grid item>
                        <Typography variant='caption' className={classes.description}>Choose which light wallet server you want to connect to. If you're not sure, use the default server for the best privacy and security.
                        </Typography>
                      </Grid>
                      <Grid item className={classes.radioContainer}>
                        <Field
                          name='defaultLightWalletServer'
                          render={() => {
                            return (
                              <Grid container direction={'column'} item>
                                <Grid item >
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        name={'radio-yes'}
                                        icon={<Icon src={radioUnselected} />}
                                        checkedIcon={<Icon src={radioChecked} />}
                                        checked={values.defaultLightWalletServer === 'yes'}
                                      />
                                    }
                                    onChange={() =>
                                      setFieldValue('defaultLightWalletServer', 'yes')
                                    }
                                    label={
                                      <label
                                        className={classes.radioLabel}
                                        onClick={() =>
                                          setFieldValue('defaultLightWalletServer', 'yes')
                                        }
                                        htmlFor='yes'
                                      >
                                        Use default server
                                      </label>
                                    }
                                  />{' '}
                                </Grid>
                                <Grid item>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        name={'radio-no'}
                                        icon={<Icon src={radioUnselected} />}
                                        checkedIcon={<Icon src={radioChecked} />}
                                        checked={values.defaultLightWalletServer === 'no'}
                                      />
                                    }
                                    onChange={() =>
                                      setFieldValue('defaultLightWalletServer', 'no')
                                    }
                                    label={
                                      <label
                                        className={classes.radioLabel}
                                        onClick={() =>
                                          setFieldValue('defaultLightWalletServer', 'no')
                                        }
                                        htmlFor='no'
                                      >
                                        Use other server
                                      </label>
                                    }
                                  />{' '}
                                </Grid>
                              </Grid>
                            )
                          }}
                        />
                        {values.defaultLightWalletServer === 'no' ? (
                          <Grid className={classes.serverURL} item xs>
                            <TextField
                              id='lightWalletServerUrl'
                              name='lightWalletServerUrl'
                              className={classes.field}
                              margin='none'
                              variant='outlined'
                              placeholder='Server URL'
                              value={values.lightWalletServerUrl}
                            />
                          </Grid>
                        ) : null}
                      </Grid>
                    </Grid>
                    <Grid container wrap={'wrap'} item>
                      <Grid xs={12} className={classes.subtitleDescBox} item>
                        <Typography className={classes.subtitleDesc} variant='subtitle1'>Connect via Tor?</Typography>
                      </Grid>
                      <Grid xs={12} item>
                        <Typography variant='caption' className={classes.description}>
                          Connecting via the Tor anonymity network can increase your privacy.
                        </Typography>
                      </Grid>
                      <Grid item className={classes.radioContainer}>
                        <Field
                          name='isTorEnabled'
                          render={() => {
                            return (
                              <Grid container direction={'column'} item>
                                <Grid item >
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        name={'radio-yes'}
                                        icon={<Icon src={radioUnselected} />}
                                        checkedIcon={<Icon src={radioChecked} />}
                                        checked={values.isTorEnabled === 'no'}
                                      />
                                    }
                                    onChange={() =>
                                      setFieldValue('isTorEnabled', 'no')
                                    }
                                    label={
                                      <label
                                        className={classes.radioLabel}
                                        onClick={() =>
                                          setFieldValue('isTorEnabled', 'no')
                                        }
                                        htmlFor='no'
                                      >
                                        No, don't use Tor
                                      </label>
                                    }
                                  />{' '}
                                </Grid>
                                <Grid item>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        name={'radio-no'}
                                        icon={<Icon src={radioUnselected} />}
                                        checkedIcon={<Icon src={radioChecked} />}
                                        checked={values.isTorEnabled === 'yes'}
                                      />
                                    }
                                    onChange={() =>
                                      setFieldValue('isTorEnabled', 'yes')
                                    }
                                    label={
                                      <label
                                        className={classes.radioLabel}
                                        onClick={() =>
                                          setFieldValue('isTorEnabled', 'yes')
                                        }
                                        htmlFor='yes'
                                      >
                                        Yes use Tor
                                      </label>
                                    }
                                  />{' '}
                                </Grid>
                                {
                                  values.isTorEnabled === 'yes' ? (
                                    <Grid item className={classes.serverURL} xs>
                                      <Typography className={classes.label} variant='body2'>
                                        Tor proxy URL
                                      </Typography>
                                      <TextField
                                        id='torServerUrl'
                                        name='torServerUrl'
                                        className={classes.field}
                                        margin='none'
                                        variant='outlined'
                                        placeholder='Server URL'
                                        value={values.lightWalletServerUrl}
                                      />
                                    </Grid>
                                  ) : null
                                }
                              </Grid>
                            )
                          }}
                        />
                      </Grid>
                      <Grid container item>
                        <Grid item xs={12}>
                          <Button
                            variant='contained'
                            size='large'
                            color='primary'
                            type='submit'
                            fullWidth
                            className={classes.button}
                          >
                            Save & Connect
                          </Button>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                )
              }}
            </Formik>
          </Scrollbars>
        )}
      </AutoSizer>
    </Modal>
  )
}

export default SecurityModal
