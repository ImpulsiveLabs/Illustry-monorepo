import React from 'react';
import { HexColorPicker } from 'react-colorful';

type ColorPickerProps = {
  initialColor: string;
  // eslint-disable-next-line no-unused-vars
  changeColor: ((newColor: string) => void) | undefined;
}
const ColorPicker = ({
  initialColor,
  changeColor
}: ColorPickerProps) => <HexColorPicker color={initialColor} onChange={changeColor}/>;

export default ColorPicker;
