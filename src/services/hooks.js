import { useRef, useLayoutEffect } from 'react';

export function useAutoScroll(deps = []) {
  const scrollRef = useRef(null);
  const rafRef = useRef(null);

  useLayoutEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
        const isNearBottom = scrollHeight - clientHeight - scrollTop < 500;

        if (isNearBottom) {
          scrollRef.current.scrollTop = scrollHeight;
        }
      }
    };

    // Use requestAnimationFrame for smooth scrolling
    rafRef.current = requestAnimationFrame(scrollToBottom);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, deps);

  return scrollRef;
}