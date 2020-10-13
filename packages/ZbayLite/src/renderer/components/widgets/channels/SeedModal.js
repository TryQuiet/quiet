import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { withStyles } from '@material-ui/core/styles'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'

import Modal from '../../ui/Modal'
import Icon from '../../ui/Icon'

import lock from '../../../static/images/lock.svg'
import { Grid, Typography } from '@material-ui/core'
import client from '../../../zcash'

const styles = theme => ({
  root: {
    marginTop: 40,
    paddingLeft: 32,
    paddingRight: 32
  },
  titleDiv: {
    marginTop: 8
  },
  infoDiv: {
    marginTop: 32,
    textAlign: 'center'
  },
  info: {
    lineHeight: '20px',
    color: theme.palette.colors.black30
  },
  seedWord: {
    lineHeight: '20px',
    color: theme.palette.colors.black30,
    textAlign: 'start'
  },
  seedDiv: {}
})
export const SeedModal = ({ classes, open, handleClose }) => {
  const [seedWords, setSeedWords] = React.useState(null)
  React.useEffect(() => {
    const fetchSeed = async () => {
      const seedData = await client.seed()
      setSeedWords(seedData.seed.split(' '))
    }
    if (open === true) {
      fetchSeed()
    }
  }, [open])
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
              direction='column'
              alignItems='center'
              className={classes.root}
            >
              <Grid item>
                <Icon className={classes.lockIcon} src={lock} />
              </Grid>
              <Grid item className={classes.titleDiv}>
                <Typography variant='h2'>Your private recovery key</Typography>
              </Grid>
              <Grid item className={classes.infoDiv}>
                <Typography variant='body2' className={classes.info}>
                  Write the following words on a piece of paper, and store it in
                  a very safe place. You may even want to make two copies and
                  store them separately. If something happens to your computer,
                  you’ll need this paper backup to recover your account and your
                  funds.
                </Typography>
              </Grid>
              <Grid item className={classes.infoDiv}>
                {seedWords && (
                  <Grid
                    container
                    className={classes.seedDiv}
                    justify='space-evenly'
                    spacing={8}
                  >
                    <Grid item>
                      {seedWords.slice(0, 12).map((word, index) => (
                        <Typography
                          variant='body2'
                          className={classes.seedWord}
                        >{`${index + 1}. ${word}`}</Typography>
                      ))}
                    </Grid>
                    <Grid item>
                      {seedWords.slice(12).map((word, index) => (
                        <Typography
                          variant='body2'
                          className={classes.seedWord}
                        >{`${index + 13}. ${word}`}</Typography>
                      ))}
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Scrollbars>
        )}
      </AutoSizer>
    </Modal>
  )
}

SeedModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
}

export default R.compose(React.memo, withStyles(styles))(SeedModal)
