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
  <div className="rounded-2xl border border-border/70 bg-background/80 p-2 shadow-sm backdrop-blur [&_.react-colorful]:w-full [&_.react-colorful__hue]:mt-2 [&_.react-colorful__hue]:h-3 [&_.react-colorful__hue]:rounded-full [&_.react-colorful__pointer]:h-4 [&_.react-colorful__pointer]:w-4 [&_.react-colorful__pointer]:border-2 [&_.react-colorful__pointer]:border-background [&_.react-colorful__pointer]:shadow-md [&_.react-colorful__saturation]:rounded-xl">
    <HexColorPicker color={initialColor} onChange={changeColor}/>
  </div>
);

export default ColorPicker;
