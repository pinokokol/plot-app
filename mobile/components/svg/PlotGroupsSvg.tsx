import React from 'react';
import Svg, { Rect } from 'react-native-svg';

import { IconProps } from '@/types/svg';

const PlotGroupsSvg: React.FC<IconProps> = ({
  color = 'currentColor',
  ...props
}) => (
  <Svg width="61" height="61" viewBox="0 0 61 61" fill="none">
    <Rect x="36" y="36" width="25" height="25" rx="5" fill="white" />
    <Rect y="36" width="25" height="25" rx="5" fill="white" />
    <Rect x="18" width="25" height="25" rx="5" fill="white" />
  </Svg>
);

export default PlotGroupsSvg;
