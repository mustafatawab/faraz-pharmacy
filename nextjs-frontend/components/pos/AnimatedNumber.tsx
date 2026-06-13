"use client";

import { useSpring, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  className?: string;
}

export function AnimatedNumber({ value, prefix = "", className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 100, damping: 30 });

  useMotionValueEvent(springValue, "change", (latest) => {
    setDisplayValue(Math.round(latest));
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}
    </span>
  );
}
