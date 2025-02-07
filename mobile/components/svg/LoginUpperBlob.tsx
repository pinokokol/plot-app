import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from '@/types/svg';

const LoginUpperBlobSvg: React.FC<IconProps> = ({
  color = 'currentColor',
  ...props
}) => (
  <Svg width={384} height={320} {...props}>
    <Path fill="#2699ED" d="M0 0h384v70c0 5.523-4.477 10-10 10H0V0Z" />
    <Path fill="#A8DAFF" d="M0 240h74v70c0 5.523-4.477 10-10 10H0v-80Z" />
    <Path fill="#56ADED" d="M0 80h276v70c0 5.523-4.477 10-10 10H0V80Z" />
    <Path fill="#8BCDFE" d="M0 160h168v70c0 5.523-4.477 10-10 10H0v-80Z" />
  </Svg>
);

export default LoginUpperBlobSvg;
