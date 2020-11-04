
import {
  Typography,
  TypographyOptions,
} from "@material-ui/core/styles/createTypography";
import {
  Palette,
  PaletteOptions,
} from "@material-ui/core/styles/createPalette";

declare module "@material-ui/core/styles/createTypography" {
  interface Typography {
    fontStyle: string;
    fontWeight: string;
    useNextVariants: boolean;
  }
  interface TypographyOptions {
    fontStyle?: string;
    fontWeight?: string;
    useNextVariants?: boolean;
  }
}

declare module "@material-ui/core/styles/createPalette" {
  interface Palette {
    colors: { [key: string]: string };
  }
  interface PaletteOptions {
    colors?: { [key: string]: string };
  }
}
