import React, { useEffect, useRef } from 'react';
import { gsap, Sine } from 'gsap';

type Props = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
};

const AnimatedObject: React.FC<Props> = ({ children, className, delay }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current?.childNodes ?? containerRef.current,
      0.5,
      { alpha: 0, y: 20 },
      { alpha: 1, y: 0, ease: Sine.easeOut, delay, stagger: 0.05 }
    );
  }, [delay]);

  return (
    <div className={className} ref={containerRef}>
      {children}
    </div>
  );
};

AnimatedObject.defaultProps = {
  delay: 0,
};

export default AnimatedObject;
