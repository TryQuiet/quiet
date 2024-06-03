# Quiet Desktop Front End

This is a mini-readme for the Quiet Desktop application's front end. It explains the architecture we are moving to and lays out some standards for writing UI code and components.

## Architecture

### Use Material UI

The Quiet Desktop UI uses Material UI (MUI) components as its base. Developers are encouraged to wrap MUI components in thin wrapper components so that wrapped components can easily be styled and extended in a DRY way. For an example of this, see `packages/desktop/src/renderer/components/ui/Typography/Typography.tsx` - as of this writing, no styling or extended functionality has been added to the Typography component, it passes props through directly to the underlying Material component. Nevertheless, by creating and using our own wrapper component, we developers can easily style or extend the MUI Typography in the future. 

These "atomic components" (meaning they are simple, indivisible, and used to make other more complex components) are placed in the `packages/desktop/src/renderer/components/ui` directory. Their names match the MUI components that they are wrapping.

### Composition and Composability

Developers are encouraged to build complex components by composing atomic components. Typically, this means taking advantage of React's `children` prop so that basic components maintain flexibility when used.

### Importing and Exporting

Inside the `./components/ui` directory is an index file that exports atomic components so that they can easily be imported in a single line:

```js
import { Drawer, Grid, Tab, Tabs, Typography } from '../ui'
```

## TODO

- Determine what lives in the `widgets` directory and what lives in the main `components` directory. Move files and update imports as needed.