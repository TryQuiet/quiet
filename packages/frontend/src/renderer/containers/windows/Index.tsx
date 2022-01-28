import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Redirect } from 'react-router'

import appHandlers from '../../store/handlers/app'

export interface useIndexActionsReturnTypes {
  loadVersion: () => void
}

const useIndexActions = (): useIndexActionsReturnTypes => {
  const dispatch = useDispatch()
  const loadVersion = () => dispatch(appHandlers.actions.loadVersion())
  return { loadVersion }
}

export const Index = () => {
  const { loadVersion } = useIndexActions()

  useEffect(() => {
    loadVersion()
  }, [])
  return <Redirect to='/main/channel/general' />
}

export default Index
