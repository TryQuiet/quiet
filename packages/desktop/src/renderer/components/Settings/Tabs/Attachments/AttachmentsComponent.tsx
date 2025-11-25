import React from 'react'

import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Slider from '@mui/material/Slider'

import Box from '@mui/material/Box'

const PREFIX = 'Attachments'

const classes = {
  title: `${PREFIX}title`,
  titleDiv: `${PREFIX}titleDiv`,
  subtitle: `${PREFIX}subtitle`,
  radioDiv: `${PREFIX}radioDiv`,
  radioSoundDiv: `${PREFIX}radioSoundDiv`,
  radioIcon: `${PREFIX}radioIcon`,
  bold: `${PREFIX}bold`,
  offset: `${PREFIX}offset`,
  spacing: `${PREFIX}spacing`,
  radioSound: `${PREFIX}radioSound`,
  subtitleSoundDiv: `${PREFIX}subtitleSoundDiv`,
  label: `${PREFIX}label`,
  spacingSound: `${PREFIX}spacingSound`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.title}`]: {},

  [`& .${classes.titleDiv}`]: {
    marginBottom: 24,
  },

  [`& .${classes.subtitle}`]: {
    fontSize: 18,
    lineHeight: '27px',
  },

  [`& .${classes.radioDiv}`]: {
    marginLeft: 4,
  },

  [`& .${classes.radioSoundDiv}`]: {},

  [`& .${classes.radioIcon}`]: {
    alignItems: 'flex-start',
    '& .MuiCheckbox-root': {
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'transparent',
      },
      display: 'block',
    },
    '& .MuiIconButton-colorSecondary': {
      color: theme.palette.colors.quietBlue,
    },
    '& .MuiTypography-body1': {
      fontSize: '14px',
      lineHeight: '25px',
    },
  },

  [`& .${classes.bold}`]: {
    fontWeight: 500,
  },

  [`& .${classes.offset}`]: {
    marginTop: 5,
  },

  [`& .${classes.spacing}`]: {
    marginTop: 16,
  },

  [`& .${classes.label}`]: {
    marginTop: 1,
    fontWeight: 500,
  },
}))

interface AttachmentsProps {
  maxAutodownloadBytes: number
  setMaxAutodownloadBytes: (bytes: number) => void
}

interface Step {
  value: number
  label: string
}

function bytesToHumanString(value: number) {
  const units = ['MB', 'GB', 'TB']

  let unitIndex = 0
  let scaledValue = value / (1024 * 1024) // start with MB

  console.log(`Value: ${value}, Scaled Value: ${scaledValue}, Unit Index: ${unitIndex}`)
  while (scaledValue >= 1024 && unitIndex < units.length - 1) {
    console.log(`Value: ${value}, Scaled Value: ${scaledValue}, Unit Index: ${unitIndex}`)
    unitIndex += 1
    scaledValue /= 1024
  }

  console.log(`Value: ${value}, Scaled Value: ${scaledValue}, Unit Index: ${unitIndex}`)
  return `${scaledValue} ${units[unitIndex]}`
}

const ALWAYS = Number.MAX_SAFE_INTEGER

// Hardcoded step values to allow for wide range of sizes with more digestible
// logarithmic-esque packing.
const stepValuesMegabytes = [0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1024, ALWAYS]

function stepValueToLabel(value: number) {
  if (value === 0) {
    return 'Never'
  } else if (value === ALWAYS) {
    return 'Always'
  } else {
    return ` Under ${bytesToHumanString(value)}`
  }
}

function stepValueToBytes(value: number) {
  return Math.min(value * 1024 * 1024, ALWAYS)
}

const steps: Step[] = stepValuesMegabytes.map(value => {
  const valueBytes = stepValueToBytes(value)
  return {
    value: valueBytes,
    label: stepValueToLabel(valueBytes),
  }
})

function getStepValue(value: number) {
  return steps[value].value
}

function bytesValueToIndex(bytes: number) {
  return steps.findIndex(step => step.value === bytes)
}

export const AttachmentsComponent: React.FC<AttachmentsProps> = ({ maxAutodownloadBytes, setMaxAutodownloadBytes }) => {
  const handleChange = (_event: Event, newValue: number | number[], _activeThumb: number) => {
    if (typeof newValue === 'number') {
      const bytes = steps[newValue].value
      console.log(`Selected value: ${bytes}`)
      setMaxAutodownloadBytes(bytes)
    }
  }

  return (
    <StyledGrid container direction='column'>
      <Grid container item justifyContent='space-between' alignItems='center' className={classes.titleDiv}>
        <Grid item className={classes.title}>
          <Typography variant='h3'>Files and Images</Typography>
        </Grid>
      </Grid>
      <Grid item>
        <Typography variant='h5' className={classes.subtitle}>
          Auto-download...
        </Typography>
      </Grid>
      <Box sx={{ mx: 'auto', width: '70%', mt: 7 }}>
        <Slider
          value={bytesValueToIndex(maxAutodownloadBytes)}
          min={0}
          step={1}
          max={steps.length - 1}
          scale={getStepValue}
          marks
          getAriaValueText={stepValueToLabel}
          valueLabelFormat={stepValueToLabel}
          onChange={handleChange}
          valueLabelDisplay='on'
          aria-labelledby='non-linear-slider'
        />
      </Box>
    </StyledGrid>
  )
}
