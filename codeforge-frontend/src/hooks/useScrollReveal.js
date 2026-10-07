import { useEffect, useRef, useState } from "react";

// Returns a ref to attach and a boolean that flips to true once the element
// has scrolled into view — used to trigger a CSS fade/slide-in animation
// only once, the first time each section becomes visible.
export default function useScrollReveal() {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}