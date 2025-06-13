import React, { useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { HeaderBar } from './components/HeaderBar/HeaderBar'
import { PresetSection } from './components/PresetSection/PresetSection'
import { useParams } from 'react-router-dom'
import { useAppDispatch } from './redux/hooks'
import { getPreset } from './api/get-preset'
import { importDataAction, resetToInitialState } from './redux/store/reducers/preset-reducer'
import { CircularProgress, Typography } from '@mui/material'

import './App.css'
import './Dialog.css'

function App(): JSX.Element {
  const dispatch = useAppDispatch()
  const [isPresetLoading, setIsPresetLoading] = useState(false)

  // Grab the route param named `id`
  const { id } = useParams<{ id?: string }>()

  useEffect(() => {
    // If there's no `id`, reset to a fresh preset
    if (!id) {
      dispatch(resetToInitialState())
      return
    }

    // Otherwise load the preset from the server
    setIsPresetLoading(true)
    getPreset(id)
      .then(response => {
        dispatch(importDataAction(response))
      })
      .catch(err => {
        console.error('Failed to load preset', err)
        // you might also show a snackbar or redirect to a 404 here
      })
      .finally(() => {
        setIsPresetLoading(false)
      })
  }, [id, dispatch])

  return (
    <DndProvider backend={HTML5Backend}>
      {isPresetLoading ? (
        <div className="height-100 d-flex flex-center">
          <CircularProgress />
          <Typography className="m-16" variant="h6">
            Loading preset…
          </Typography>
        </div>
      ) : (
        <div className="App">
          <HeaderBar />
          <PresetSection />
        </div>
      )}
    </DndProvider>
  )
}

export default App
