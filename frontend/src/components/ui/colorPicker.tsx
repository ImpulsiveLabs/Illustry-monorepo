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
}: ColorPickerProps) => (
  <div className="w-[220px] rounded-lg border border-border/70 bg-background p-3 shadow-sm [&_.react-colorful]:h-[190px] [&_.react-colorful]:w-full [&_.react-colorful__hue]:mt-3 [&_.react-colorful__hue]:h-3 [&_.react-colorful__hue]:rounded-full [&_.react-colorful__pointer]:h-4 [&_.react-colorful__pointer]:w-4 [&_.react-colorful__pointer]:border-2 [&_.react-colorful__pointer]:border-background [&_.react-colorful__pointer]:shadow-md [&_.react-colorful__saturation]:rounded-md">
    <HexColorPicker color={initialColor} onChange={changeColor}/>
  </div>
);

export default ColorPicker;
