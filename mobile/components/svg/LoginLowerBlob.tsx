import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from '@/types/svg';

const LoginLowerBlobSvg: React.FC<IconProps> = ({
  color = 'currentColor',
  ...props
}) => (
  <Svg width={384} height={320} {...props}>
    <Path fill="#2699ED" d="M0 250c0-5.523 4.477-10 10-10h374v80H0v-70Z" />
    <Path fill="#A8DAFF" d="M310 10c0-5.523 4.477-10 10-10h64v80h-74V10Z" />
    <Path fill="#56ADED" d="M108 170c0-5.523 4.477-10 10-10h266v80H108v-70Z" />
    <Path fill="#8BCDFE" d="M216 90c0-5.523 4.477-10 10-10h158v80H216V90Z" />
  </Svg>
);

export default LoginLowerBlobSvg;
