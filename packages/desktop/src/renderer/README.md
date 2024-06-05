# Quiet Desktop Front End

This is a mini-readme for the Quiet Desktop application's front end. It explains the architecture we are moving toward and lays out some standards for writing UI code and components.

## Architecture

### Use Material UI

The Quiet Desktop UI uses Material UI (MUI) components as its base. Developers are encouraged to wrap MUI components in thin wrapper components so that wrapped components can easily be styled and extended in a DRY way. For an example of a thin wrapper, see `packages/desktop/src/renderer/components/ui/Typography/Typography.tsx` - as of this writing, no styling or extended functionality has been added to the Typography component, it passes props through directly to the underlying Material component. Multiple related components can be kept in the same file (see: `packages/desktop/src/renderer/components/ui/List/List.tsx`). By creating and using our own wrapper components, we developers can easily style or extend the MUI Typography in the future without having to refactor or make the changes in multiple places.

These "atomic components" (meaning they are simple, indivisible, and used to make other more complex components) are placed in the `packages/desktop/src/renderer/components/ui` directory. Their names match the MUI components that they are wrapping. Make sure to export from the `ui/index.ts` file to make imports easy.

#### Customizing Components

Developers are highly encouraged *NOT* to style atomic components in files for their more complex components. If a new treatment is needed and the stock MUI props do not provide it (for example, an extra-large button), rather than styling the button in your component, add optional styles in the main `Button` wrapper component and use a `variant` prop or intercept one of the stock props and add the styles in the wrapper component.

If you need to change the default component styles, check out the `components` section of the themes in `packages/desktop/src/renderer/theme.ts`.

### Composition and Composability

Developers are encouraged to build complex components by composing atomic components. Typically, this means taking advantage of React's `children` prop so that basic components maintain flexibility when used. Here's [a short introduction to component composition](https://felixgerschau.com/react-component-composition/). This lets us avoid things where we make less-flexible complex components like the following:

```jsx
// Bad way to do it:
<MyBrittleModal
  title='Some title'
  content='Some content'
/>
```

```jsx
// Better way to do it:
<ComposableModal>
  <Typography variant="h3" gutterBottom>
    Some Title
  </Typography>
  <Typography variant='body'>
    Some Content
  </Typography>
</Modal>
```

### Importing and Exporting

Inside the `./components/ui` directory is an index file that exports atomic components so that they can easily be imported in a single line:

```js
import { Drawer, Grid, Tab, Tabs, Typography } from '../ui'
```

## TODO

- Determine what lives in the `widgets` directory and what lives in the main `components` directory. Move files and update imports as needed.