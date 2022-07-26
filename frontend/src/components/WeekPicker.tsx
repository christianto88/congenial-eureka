import React, { FunctionComponent } from "react";

import { Button } from "@material-ui/core";
interface Prop {
  currentWeek: string;
  previous: () => void;
  next: () => void;
  weekPublished: boolean;
}
const WeekPicker: FunctionComponent<Prop> = ({ previous, next, currentWeek, weekPublished }) => {
  return (
    <>
      <Button variant="outlined" onClick={previous}>Previous</Button>
      <span style={{ fontWeight: 'bolder', fontSize: '14px', marginLeft: '10px', marginRight: '10px', color: `${weekPublished ? 'green' : 'black'}` }}>{currentWeek}</span>
      <Button variant="outlined" onClick={next}>Next</Button>
    </>

  );
};
export default WeekPicker;