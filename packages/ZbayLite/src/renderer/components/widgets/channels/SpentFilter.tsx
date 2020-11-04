import React from "react";

import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import { ISpentFilterProps } from "./SpentFilter.d";

import Slider from "../../ui/Slider";

const useStyles = makeStyles({
  title: {
    fontSize: "0.83rem",
  },
});

export const SpentFilter: React.FC<ISpentFilterProps> = ({
  value,
  handleOnChange,
}) => {
  const classes = useStyles({});
  return (
    <Grid container direction="column" justify="center" alignItems="center">
      <Grid item>
        <Typography variant="body2" className={classes.title}>
          Ad spend
        </Typography>
      </Grid>
      <Grid item>
        <Slider
          title="Min threshold"
          minLabel="$0"
          maxLabel="$max"
          min={0}
          max={100}
          value={value === -1 ? 100 : value}
          handleOnChange={handleOnChange}
        />
      </Grid>
    </Grid>
  );
};

export default SpentFilter;
