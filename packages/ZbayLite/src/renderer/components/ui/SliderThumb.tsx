import React from "react";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  root: {
    width: 18,
    height: 18,
    background: "#d8d8d8",
    borderColor: "#979797",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: "50%",
  },
});

export const SliderThumb: React.FC = () => {
  const classes = useStyles({});
  return <div className={classes.root} />;
};

export default SliderThumb;
