import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, errors, identity } from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { UsernameRegistrationScreenProps } from './UsernameRegistration.types'
import { UsernameRegistration } from '../../components/Registration/UsernameRegistration.component'
import { ErrorCodes } from '@quiet/types'

export const UsernameRegistrationScreen: FC<UsernameRegistrationScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const [ isOwner, setIsOwner ] = useState<boolean>(false)

  useEffect(() => {
    setIsOwner(Boolean(currentCommunity?.CA))
  }, [currentCommunity])

  const fetching = route.params?.fetching

  const error = useSelector(errors.selectors.registrarErrors)

  const navigation = useCallback(
    (screen: ScreenNames, params?: any) => {
      dispatch(
        navigationActions.navigation({
          screen,
          params,
        })
      )
    },
    [dispatch]
  )

  const handleAction = (nickname: string) => {
    // Clear errors
    if (error) {
      dispatch(errors.actions.clearError(error))
    }

    dispatch(identity.actions.chooseUsername({ nickname: nickname }))
  }

  useEffect(() => {
    if (!currentIdentity.userCsr?.userCsr) {
      console.warn('Waiting for CSR')
      return
    }

    if (isOwner) {
      // Register own certificate
      dispatch(identity.actions.registerCertificate())
    } else {
      // Save user csr to the database
      dispatch(identity.actions.saveUserCsr())
    }

    navigation(ScreenNames.ConnectionProcessScreen)
  }, [dispatch, currentIdentity.userCsr])

  return (
    <UsernameRegistration
      registerUsernameAction={handleAction}
      registerUsernameError={error?.code === ErrorCodes.FORBIDDEN ? error.message : undefined}
      usernameRegistered={Boolean(currentIdentity.userCsr?.userCsr)}
      fetching={fetching}
    />
  )
}
