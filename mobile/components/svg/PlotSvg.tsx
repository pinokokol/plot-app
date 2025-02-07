import React from 'react';
import Svg, { Rect } from 'react-native-svg';

import { IconProps } from '@/types/svg';

const PlotSvg: React.FC<IconProps> = ({ color = 'currentColor', ...props }) => (
  <Svg width="61" height="61" viewBox="0 0 61 61" fill="none">
    <Rect y="36" width="25" height="25" rx="5" fill="white" />
    <Rect x="18" width="25" height="25" rx="5" fill="white" />
    <Rect x="46" y="36" width="5" height="25" rx="2.5" fill="white" />
    <Rect
      x="36"
      y="51"
      width="5"
      height="25"
      rx="2.5"
      transform="rotate(-90 36 51)"
      fill="white"
    />
  </Svg>
);

export default PlotSvg;
