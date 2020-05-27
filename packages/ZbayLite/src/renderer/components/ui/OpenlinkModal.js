import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import red from '@material-ui/core/colors/red'
import Button from '@material-ui/core/Button'

import electronStore from '../../../shared/electronStore'
import Icon from './Icon'
import exclamationMark from '../../static/images/exclamationMark.svg'
import Modal from './Modal'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormControl from '@material-ui/core/FormControl'
import Radio from '@material-ui/core/Radio'

const styles = theme => ({
  root: {
    padding: theme.spacing(4)
  },
  icon: {
    fontSize: '10rem',
    color: red[500],
    width: 80,
    height: 70
  },
  title: {
    marginTop: 36,
    marginBottom: 24
  },
  message: {
    wordBreak: 'break-word',
    marginTop: 16,
    fontWeight: 500
  },
  bold: {
    fontWeight: 600
  },
  checkboxLabel: {
    fontSize: 14,
    lineHeight: '24px',
    wordBreak: 'break-word',
    marginLeft: -14
  },
  checkboxes: {
    marginTop: 32
  },
  buttonBack: {
    width: 147,
    height: 60,
    backgroundColor: theme.palette.colors.zbayBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.zbayBlue
    }
  },
  buttons: {
    marginTop: 24
  },
  radioIcon: {
    '&$checked': {
      color: theme.palette.colors.zbayBlue
    }
  },
  checked: {}
})

export const OpenlinkModal = ({
  classes,
  open,
  handleClose,
  handleConfirm,
  url,
  addToWhitelist,
  setWhitelistAll,
  isImage
}) => {
  const whitelist = electronStore.get('whitelist')
  const [radioValue, setRadioValue] = React.useState(false)
  React.useEffect(() => {
    setRadioValue(
      whitelist
        ? whitelist.whitelisted.indexOf(url) !== -1
          ? 'setAllowThisLink'
          : false
        : false
    )
    setRadioValue(whitelist ? 'allowAllLink' : false)
  }, [url])
  const uri = new URL(url)
  return (
    <Modal open={open} handleClose={handleClose} title=''>
      <AutoSizer>
        {({ width, height }) => (
          <Scrollbars
            autoHideTimeout={500}
            style={{ width: width, height: height }}
          >
            <Grid
              container
              justify='flex-start'
              direction='column'
              className={classes.root}
            >
              <Grid item container direction='column' alignItems='center'>
                <Icon className={classes.icon} src={exclamationMark} />
                <Typography variant='h2' className={classes.title}>
                  Watch out!
                </Typography>
              </Grid>
              <Grid item container direction='column'>
                <Grid item>
                  <Typography variant='body2'>
                    Opening link posted in Zbay reveals data about you to your
                    goverment, your Internet provider, the site you are visiting
                    and, potentially, to whoever posted the link. Only open
                    links from people you trust. If you are using Zbay to
                    protect your anonymity, never open links.
                  </Typography>
                </Grid>
              </Grid>
              <Grid
                item
                container
                spacing={0}
                direction='column'
                className={classes.checkboxes}
              >
                {' '}
                <FormControl component='fieldset'>
                  <RadioGroup
                    aria-label='gender'
                    name='gender1'
                    value={radioValue}
                    onChange={e => setRadioValue(e.target.value)}
                  >
                    {isImage ? (
                      <>
                        <Grid
                          item
                          container
                          justify='center'
                          alignItems='center'
                        >
                          <Grid item>
                            <FormControlLabel
                              value='allowThisLink'
                              control={
                                <Radio
                                  classes={{
                                    root: classes.radioIcon,
                                    checked: classes.checked
                                  }}
                                />
                              }
                            />
                          </Grid>
                          <Grid item xs className={classes.checkboxLabel}>
                            {`Automatically load images from `}
                            <span className={classes.bold}>{uri.hostname}</span>
                            {`- I trust them with my data and I'm not using Zbay for anonymity protection. `}
                          </Grid>
                        </Grid>
                        <Grid
                          item
                          container
                          justify='center'
                          alignItems='center'
                        >
                          <Grid item>
                            <FormControlLabel
                              value='dontAutoload'
                              control={
                                <Radio
                                  classes={{
                                    root: classes.radioIcon,
                                    checked: classes.checked
                                  }}
                                />
                              }
                            />
                          </Grid>
                          <Grid item xs className={classes.checkboxLabel}>
                            {`Don't warn me about `}
                            <span className={classes.bold}>
                              {uri.hostname}
                            </span>{' '}
                            {`again, but don't auto-load images.`}
                          </Grid>
                        </Grid>
                      </>
                    ) : (
                      <Grid item container justify='center' alignItems='center'>
                        <Grid item>
                          <FormControlLabel
                            value='allowThisLink'
                            control={
                              <Radio
                                classes={{
                                  root: classes.radioIcon,
                                  checked: classes.checked
                                }}
                              />
                            }
                          />
                        </Grid>
                        <Grid item xs className={classes.checkboxLabel}>
                          {`Don't warn me about `}
                          <span className={classes.bold}>
                            {uri.hostname}
                          </span>{' '}
                          {`again`}
                        </Grid>
                      </Grid>
                    )}
                    <Grid item container justify='center' alignItems='center'>
                      <Grid item>
                        <FormControlLabel
                          value='allowAllLinks'
                          control={
                            <Radio
                              classes={{
                                root: classes.radioIcon,
                                checked: classes.checked
                              }}
                            />
                          }
                        />
                      </Grid>
                      <Grid item xs className={classes.checkboxLabel}>
                        {`Never warn me about outbound links on Zbay.`}
                      </Grid>
                    </Grid>
                    <Grid
                      item
                      container
                      spacing={2}
                      alignItems='center'
                      className={classes.buttons}
                    >
                      <Grid item>
                        <Button
                          className={classes.buttonBack}
                          variant='contained'
                          color='primary'
                          size='large'
                          onClick={() => {
                            handleClose()
                          }}
                        >
                          Back to safety
                        </Button>
                      </Grid>
                      <Grid item xs>
                        <a
                          style={{
                            color: '#67BFD3',
                            textDecoration: 'none',
                            wordBreak: 'break-all'
                          }}
                          onClick={e => {
                            e.preventDefault()
                            handleConfirm()
                            if (
                              radioValue === 'allowThisLink' ||
                              radioValue === 'dontAutoload'
                            ) {
                              addToWhitelist(url, radioValue === 'dontAutoload')
                            }
                            setWhitelistAll(radioValue === 'allowAllLink')
                            handleClose()
                          }}
                          href={``}
                        >
                          {isImage
                            ? `Load image from site ${uri.hostname}`
                            : `Continue to ${uri.hostname}`}
                        </a>
                      </Grid>
                    </Grid>
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </Scrollbars>
        )}
      </AutoSizer>
    </Modal>
  )
}

OpenlinkModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  url: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleConfirm: PropTypes.func.isRequired,
  addToWhitelist: PropTypes.func.isRequired,
  setWhitelistAll: PropTypes.func.isRequired,
  isImage: PropTypes.bool.isRequired
}
OpenlinkModal.defaultProps = {
  open: false,
  isImage: false,
  url: 'https://www.zbay.app/'
}

export default R.compose(withStyles(styles))(OpenlinkModal)
