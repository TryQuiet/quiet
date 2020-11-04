import React from "react";
import IconButtonMui from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";

import { IIconButtonProps } from "./IconButton.d";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 6,
    color: theme.typography.body1.color,
  },
}));

export const IconButton: React.FC<IIconButtonProps> = ({
  children,
  onClick,
}) => {
  const classes = useStyles({});
  return (
    <IconButtonMui classes={{ root: classes.root }} onClick={onClick}>
      {children}
    </IconButtonMui>
  );
};

export default IconButton;
