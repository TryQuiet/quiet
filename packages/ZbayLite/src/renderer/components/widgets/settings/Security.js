import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import Immutable from 'immutable'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'

import UserListItem from '../channelSettings/UserListItem'

const styles = theme => ({
  title: {},
  titleDiv: {
    marginBottom: 24
  },
  alignLabel: {
    marginTop: 3
  },
  labelDiv: {
    marginTop: 16,
    marginBottom: 50
  },
  itemName: {
    fontSize: 14
  },
  imageHostsDiv: {
    marginTop: 32
  }
})

export const Security = ({
  classes,
  whitelisted,
  autoload,
  allowAll,
  toggleAllowAll,
  removeImageHost,
  removeSiteHost
}) => {
  return (
    <Grid container direction='column'>
      <Grid
        container
        item
        justify='space-between'
        alignItems='center'
        className={classes.titleDiv}
      >
        <Grid item className={classes.title}>
          <Typography variant='h3'>Security</Typography>
        </Grid>
      </Grid>
      <Grid item className={classes.subtitle}>
        <Typography variant='h5'>Outbound Links</Typography>
      </Grid>
      <Grid item className={classes.labelDiv}>
        <FormControlLabel
          control={
            <Checkbox
              checked={allowAll}
              onChange={e => {
                toggleAllowAll(e.target.checked)
              }}
              color='default'
            />
          }
          label={
            <Typography variant='body2' className={classes.alignLabel}>
              Never warn me about outbound link on Zbay.
            </Typography>
          }
        />
      </Grid>
      {!!whitelisted.size && (
        <>
          <Grid item className={classes.subtitle}>
            <Typography variant='h5'>Allowed sites</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              Links from these sites will not trigger warrning:
            </Typography>
          </Grid>
          {whitelisted.map(hostname => {
            return (
              <Grid item>
                <UserListItem
                  name={hostname}
                  actionName='Remove'
                  classes={{ name: classes.itemName }}
                  prefix=''
                  action={() => {
                    removeSiteHost(hostname)
                  }}
                />
              </Grid>
            )
          })}
        </>
      )}
      {!!autoload.size && (
        <Grid item className={classes.imageHostsDiv}>
          <Grid item className={classes.subtitle}>
            <Typography variant='h5'>Allowed image hosts</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              Images from these sites will be auto-loaded:
            </Typography>
          </Grid>
          {autoload.map(hostname => {
            return (
              <Grid item>
                <UserListItem
                  name={hostname.substring(0, 30)}
                  classes={{ name: classes.itemName }}
                  actionName='Remove'
                  prefix=''
                  action={() => {
                    removeImageHost(hostname)
                  }}
                />
              </Grid>
            )
          })}
        </Grid>
      )}
    </Grid>
  )
}
Security.propTypes = {
  classes: PropTypes.object.isRequired,
  whitelisted: PropTypes.instanceOf(Immutable.List).isRequired,
  autoload: PropTypes.instanceOf(Immutable.List).isRequired,
  allowAll: PropTypes.bool.isRequired,
  toggleAllowAll: PropTypes.func.isRequired,
  removeImageHost: PropTypes.func.isRequired,
  removeSiteHost: PropTypes.func.isRequired
}
Security.defaultProps = {}

export default withStyles(styles)(Security)
