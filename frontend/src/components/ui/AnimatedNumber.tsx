import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  style?: TextStyle | TextStyle[];
  prefix?: string;
  suffix?: string;
}

export default function AnimatedNumber({
  value,
  duration = 900,
  format,
  style,
  prefix = '',
  suffix = '',
}: AnimatedNumberProps): React.ReactElement {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = startRef.current;
    const to = value;
    const diff = to - from;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - pct, 3);
      const current = from + diff * eased;
      setDisplay(current);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        startRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const text = format ? format(display) : String(Math.round(display));

  return (
    <Text style={style}>
      {prefix}
      {text}
      {suffix}
    </Text>
  );
}