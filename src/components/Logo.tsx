import React from 'react';

type Props = {
  size: number | string;
  className?: string;
};

const Logo: React.FC<Props> = ({ className, size }) => (
  <svg
    version="1.0"
    width={size}
    height={size}
    className={className}
    viewBox="0 0 512.000000 512.000000"
    preserveAspectRatio="xMidYMid meet">
    <g
      stroke="none"
      transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
      fill="var(--text-primary)">
      <path d="M0 2560 l0 -2560 2560 0 2560 0 0 2560 0 2560 -2560 0 -2560 0 0 -2560z m1778 1218 c9 -9 12 -85 12 -283 l-1 -270 -249 -255 -249 -255 -1 526 c0 395 3 528 12 537 17 17 459 17 476 0z m2200 0 c17 -17 17 -459 0 -476 -9 -9 -165 -12 -639 -12 l-627 0 -361 -367 c-199 -201 -360 -371 -358 -376 2 -6 167 -178 368 -383 l364 -372 383 -1 382 -1 0 250 0 250 -363 0 c-269 0 -366 3 -375 12 -17 17 -17 459 0 476 17 17 1209 17 1226 0 17 -17 17 -1459 0 -1476 -9 -9 -186 -12 -734 -12 l-721 0 -280 283 c-697 705 -953 968 -953 980 1 6 274 288 608 625 l607 612 730 0 c555 0 734 -3 743 -12z m-2188 -2178 c0 -210 -3 -289 -12 -298 -17 -17 -459 -17 -476 0 -9 9 -12 145 -12 553 l1 540 249 -255 249 -255 1 -285z" />
    </g>
  </svg>
);

export default Logo;
