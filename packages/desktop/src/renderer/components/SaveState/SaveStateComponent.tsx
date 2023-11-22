import React from 'react'
import { Persistor } from 'redux-persist/es/types'

interface SaveStateComponentProps {
    persistor: Persistor
}

// Only for testing purposes
export const SaveStateComponent: React.FC<SaveStateComponentProps> = ({ persistor }) => {
    return (
        <div
            id='save-state-button'
            data-testid='save-state-button'
            data-is-saved='false'
            onClick={async () => {
                await persistor.flush()
                const element = document.getElementById('save-state-button')
                element?.setAttribute('data-is-saved', 'true')
            }}
        />
    )
}
