import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import ServerAddedComponent from '../../ServerAdded/ServerAddedComponent'
import { nativeServicesActions } from 'packages/mobile/src/store/nativeServices/nativeServices.slice'
import { ModalBottomDrawer } from '../ModalBottomDrawer.component'

export const ServerAddedDrawer: React.FC = () => {
  const dispatch = useDispatch()
  const [visible, setVisible] = useState(false)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const unacceptedServers = useSelector(communities.selectors.unacceptedServers)

  useEffect(() => {
    if (unacceptedServers.length > 0 && !visible) {
      setVisible(true)
    } else if (visible && unacceptedServers.length === 0) {
      setVisible(false)
    }
  }, [unacceptedServers, visible])

  const handleChoose = useCallback(
    async (useServer: boolean) => {
      if (!currentCommunity) {
        // This should never happen, but if it does, just leave the community to return to home
        dispatch(nativeServicesActions.leaveCommunity())
        setVisible(false)
        return
      }
      if (useServer) {
        const updateCommunityPayload = {
          id: currentCommunity.id,
          updates: {
            qssEnabled: true,
            serverHosts: currentCommunity.serverHosts?.map(sh => ({ ...sh, accepted: true })),
          },
        }
        dispatch(communities.actions.updateCommunityData(updateCommunityPayload))
        if (!currentCommunity.tosAccepted) {
          dispatch(communities.actions.requestTermsOfService())
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
