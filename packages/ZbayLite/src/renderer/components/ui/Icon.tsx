import React from "react";
import { IIconProps } from "./Icon.d";

export const Icon: React.FC<IIconProps> = ({className, src, onClickHandler, onMouseEnterHandler, onMouseLeaveHandler}) => {
  return <img className={className} src={src} onClick={onClickHandler} onMouseEnter={onMouseEnterHandler} onMouseLeave={onMouseLeaveHandler}  />;
};

//export const Icon: React.FC<IIconProps> = ({ className, src }) => (
//  <img className={className} src={src} />
//);

export default Icon;
