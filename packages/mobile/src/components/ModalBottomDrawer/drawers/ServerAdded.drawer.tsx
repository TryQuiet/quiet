import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import ServerAddedComponent from '../../ServerAdded/ServerAddedComponent'
import { nativeServicesActions } from '../../../store/nativeServices/nativeServices.slice'
import { ModalBottomDrawer } from '../ModalBottomDrawer.component'
import { navigationActions } from '../../../store/navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

export const ServerAddedDrawer: React.FC = () => {
  const dispatch = useDispatch()
  const [visible, setVisible] = useState(false)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const unacceptedServers = useSelector(communities.selectors.unacceptedServers)
  const tosRequested = useSelector(communities.selectors.tosRequested)

  useEffect(() => {
    if (unacceptedServers.length > 0 && !visible && !tosRequested) {
      setVisible(true)
    } else if (visible && (unacceptedServers.length === 0 || tosRequested)) {
      setVisible(false)
    }
  }, [tosRequested, unacceptedServers, visible])

  const handleChoose = useCallback(
    async (useServer: boolean) => {
      if (!currentCommunity) {
        // This should never happen, but if it does, just leave the community to return to home
        dispatch(nativeServicesActions.leaveCommunity())
        setVisible(false)
        return
      }
      if (useServer) {
        dispatch(communities.actions.acceptServer())
        if (!currentCommunity.tosAccepted) {
          dispatch(navigationActions.navigation({ screen: ScreenNames.TermsOfServiceScreen }))
        }
      } else {
        dispatch(nativeServicesActions.leaveCommunity())
      }
      setVisible(false)
    },
    [currentCommunity, dispatch]
  )

  return (
    <ModalBottomDrawer
      visible={visible}
      onClose={() => handleChoose(false)}
      title='Server Added'
      showHandle
      testIdPrefix='unexpected-server-drawer'
      heightRatio={3 / 4}
    >
      <ServerAddedComponent visible={visible} onChoose={handleChoose} serverHosts={unacceptedServers} />
    </ModalBottomDrawer>
  )
}

export default ServerAddedDrawer
