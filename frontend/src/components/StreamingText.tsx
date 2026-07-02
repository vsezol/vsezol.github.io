import { useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  /** already fully revealed (historical message) */
  instant: boolean;
  onProgress?: () => void;
  onDone?: () => void;
}

/** Agent message with a typewriter reveal and a blinking caret. */
export default function StreamingText({ text, instant, onProgress, onDone }: Props) {
  const [shown, setShown] = useState(instant ? text.length : 0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (instant) return;
    let i = 0;
    let timer: number;
    const step = () => {
      i = Math.min(text.length, i + 2 + Math.floor(Math.random() * 3));
      setShown(i);
      onProgress?.();
      if (i < text.length) {
        timer = window.setTimeout(step, 26);
      } else if (!doneRef.current) {
        doneRef.current = true;
        timer = window.setTimeout(() => onDone?.(), 220);
      }
    };
    step();
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streaming = !instant && shown < text.length;

  return (
    <div className="agent-text">
      {text.slice(0, shown)}
      {streaming && <span className="caret" />}
    </div>
  );
}
