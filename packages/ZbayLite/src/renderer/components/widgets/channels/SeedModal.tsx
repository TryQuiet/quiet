import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'

import Modal from '../../ui/Modal/Modal'
import Icon from '../../ui/Icon/Icon'

import lock from '../../../static/images/lock.svg'
import { Grid, Typography } from '@material-ui/core'
import client from '../../../zcash'

const useStyles = makeStyles((theme) => ({
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
}))

interface SeedModalProps {
  open: boolean
  handleClose: () => void
}

export const SeedModal: React.FC<SeedModalProps> = ({ open, handleClose }) => {
  const classes = useStyles({})
  const [seedWords, setSeedWords] = React.useState(null)
  React.useEffect(() => {
    const fetchSeed = async () => {
      const seedData = await client.seed()
      setSeedWords(seedData.seed.split(' '))
    }
    if (open) {
      void fetchSeed()
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
                <Icon src={lock} />
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
                      {seedWords.slice(0, 12).map((word, index: number) => (
                        <Typography
                          variant='body2'
                          className={classes.seedWord}
                        >{`${index + 1}. ${word}`}</Typography>
                      ))}
                    </Grid>
                    <Grid item>
                      {seedWords.slice(12).map((word, index: number) => (
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

export default SeedModal
