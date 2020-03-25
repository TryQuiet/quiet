import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { shell } from 'electron'

import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import { Grid, Button } from '@material-ui/core'

const reqSvgs = require && require.context('../../static/images/registrationGuide/', true, /\.svg$/)

const styles = theme => ({
  root: {
    width: '100%',
    height: '100vh',
    backgroundColor: theme.palette.colors.white
  },
  main: {
    width: 800,
    height: 500
  },
  dot: {
    height: 8,
    width: 8,
    backgroundColor: theme.palette.colors.zbayBlue,
    borderRadius: '50%',
    opacity: 0.2,
    marginLeft: 6,
    display: 'inline-block'
  },
  buttonBack: {
    width: 120,
    height: 60,
    fontSize: 16,
    lineHeight: '19px',
    fontStyle: 'normal',
    fontWeight: 'normal',
    textTransform: 'none',
    border: `1px solid ${theme.palette.colors.zbayBlue}`,
    borderRadius: 4,
    textAlign: 'center',
    color: theme.palette.colors.zbayBlue,
    backgroundColor: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.white
    }
  },
  buttonNext: {
    width: 120,
    height: 60,
    fontSize: 16,
    lineHeight: '19px',
    fontStyle: 'normal',
    fontWeight: 'normal',
    textTransform: 'none',
    border: `1px solid ${theme.palette.colors.zbayBlue}`,
    borderRadius: 4,
    textAlign: 'center',
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.zbayBlue,
    '&:hover': {
      backgroundColor: theme.palette.colors.zbayBlue
    }
  },
  navigationContainer: {
    width: '100%',
    padding: '0px 45px'
  },
  contentContainer: {
    padding: '0px 48px',
    marginBottom: 28
  },
  graphicBox: {
    width: 216,
    height: 356
  },
  textBox: {
    width: 456,
    height: 356
  },
  active: {
    opacity: 1
  },
  sentence: {
    marginTop: 24
  },
  wideButton: {
    width: 237
  },
  alignDots: {
    marginRight: 46
  },
  linkBlue: {
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue
  }
})

const ContentWithRedirect = ({ classes }) => (
  <Fragment>
    <Grid item>
      <Typography variant={'h3'}>And now... some waiting!</Typography>
      <Typography className={classes.sentence} variant={'body2'}>
      Our tour has concluded! Now, we just have to wait for some blockchain files to download. Perhaps leave your computer and go have a sandwich.
      </Typography>
      <Typography className={classes.sentence} variant={'body2'}>
    If you'd like to learn more about the values and vision behind the Zbay project, there's <span onClick={() => shell.openExternal('https://www.zbay.app/#why')} className={classes.linkBlue}>a great (and long) essay on our site.</span>
      </Typography>
      <Typography className={classes.sentence} variant={'body2'}>
    Or you can learn more about <span onClick={() => shell.openExternal('https://zcash.readthedocs.io/en/latest/')} className={classes.linkBlue}>Zcash</span> the technology that Zbay builds on.
      </Typography>
    </Grid>
  </Fragment>
)

export const RegistraionGuide = ({ classes, content, currentSlide, prevSlide, nextSlide, setStoryStatus }) => {
  return (
    <Grid container className={classes.root} justify={'center'} alignItems={'center'} alignContent={'center'}>
      <Grid container item className={classes.main}>
        <Grid container item className={classes.contentContainer} justify={'space-between'}>
          <Grid container item className={classes.graphicBox} alignItems={'center'}>
            <img src={reqSvgs(content[currentSlide].fileName)} />
          </Grid>
          <Grid container item className={classes.textBox} alignItems={'center'}>
            {currentSlide !== 10
              ? <Fragment>
                <Grid item>
                  <Typography variant={'h3'}>{content[currentSlide].title}</Typography>
                  {content[currentSlide].sentences.map(sentence => <Typography className={classes.sentence} variant={'body2'}>{sentence}</Typography>)}
                </Grid>
              </Fragment> : <ContentWithRedirect classes={classes} />}
          </Grid>
        </Grid>
        <Grid container item className={classes.navigationContainer} justify={'center'} alignItems={'center'} wrap={'nowrap'}>
          <Grid item>
            <Button onClick={prevSlide} className={classes.buttonBack}>Back</Button>
          </Grid>
          <Grid container item justify={currentSlide === 10 ? 'flex-end' : 'center'} className={classNames(null, { [classes.alignDots]: currentSlide === 10 })}>
            {content.map((_, index) => <Grid key={index} item><span className={classNames(classes.dot, {
              [classes.active]: index === currentSlide
            })} /></Grid>)}
          </Grid>
          <Grid item>
            <Button onClick={currentSlide !== 10 ? nextSlide : setStoryStatus} className={classNames(classes.buttonNext, { [classes.wideButton]: currentSlide === 10 })}>
              {currentSlide !== 10 ? 'Next' : 'Show download progress'}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

RegistraionGuide.propTypes = {
  classes: PropTypes.object.isRequired,
  content: PropTypes.array.isRequired,
  currentSlide: PropTypes.number.isRequired,
  prevSlide: PropTypes.func.isRequired,
  nextSlide: PropTypes.func.isRequired,
  setStoryStatus: PropTypes.func.isRequired
}

RegistraionGuide.defaultProps = {
}

export default withStyles(styles)(RegistraionGuide)
