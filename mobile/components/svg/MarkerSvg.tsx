import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from '@/types/svg';

const MarkerSvg: React.FC<IconProps> = ({
  color = 'currentColor',
  ...props
}) => (
  <Svg width="25" height="30" viewBox="0 0 25 30" fill="none">
    <Path
      d="M23.3333 12.6667C23.3333 20.6667 12.6667 28.6667 12.6667 28.6667C12.6667 28.6667 2 20.6667 2 12.6667C2 9.83769 3.12381 7.12458 5.12419 5.12419C7.12458 3.12381 9.83769 2 12.6667 2C15.4956 2 18.2088 3.12381 20.2091 5.12419C22.2095 7.12458 23.3333 9.83769 23.3333 12.6667Z"
      fill="#EC6E00"
      stroke="white"
      stroke-width="2.66667"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default MarkerSvg;
