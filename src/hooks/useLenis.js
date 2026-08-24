import { useEffect } from "react";
import Lenis from "lenis";

export const useLenis = () => {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 1,
      smoothWheel: true,
      touchMultiplier: 1.5,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    window.lenis = lenis;

    return () => {
      lenis.destroy();
      window.lenis = null;
    };
  }, []);
};