import React from 'react'
import PropTypes from 'prop-types'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'

import { Grid } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import AddFunds from '../../../components/widgets/settings/AddFunds'
import Modal from '../Modal'

const styles = theme => ({
  root: {}
})

export const TopUpModal = ({
  classes,
  open,
  handleClose,
  openSettingsModal,
  setTabToOpen,
  ...rest
}) => {
  const [offset, setOffset] = React.useState(0)
  const adjustOffset = () => {
    if (window.innerWidth > 600) {
      setOffset((window.innerWidth - 600) / 2)
    }
  }
  React.useEffect(() => {
    if (window) {
      window.addEventListener('resize', adjustOffset)
      adjustOffset()
    }
  }, [])
  return (
    <Modal open={open} handleClose={handleClose} contentWidth='100%'>
      <AutoSizer>
        {({ width, height }) => {
          return (
            <Scrollbars
              autoHideTimeout={500}
              style={{ width: window.innerWidth, height: height }}
            >
              <Grid container justify={'center'}>
                <Grid item xs>
                  <Grid
                    item
                    className={classes.content}
                    style={{ paddingRight: offset, paddingLeft: offset }}
                  >
                    <AddFunds
                      {...rest}
                      variant={'wide'}
                      setCurrentTab={() => {
                        openSettingsModal()
                        setTabToOpen()
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Scrollbars>
          )
        }}
      </AutoSizer>
    </Modal>
  )
}

TopUpModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(['transparent', 'private']),
  address: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  openSettingsModal: PropTypes.func.isRequired,
  setTabToOpen: PropTypes.func.isRequired,
  handleCopy: PropTypes.func
}

TopUpModal.defaultProps = {
  open: false,
  handleCopy: () => null
}

export default withStyles(styles)(TopUpModal)
