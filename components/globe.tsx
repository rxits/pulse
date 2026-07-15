"use client";

import { useEffect, useRef } from "react";
import createGlobe, { type COBEOptions } from "cobe";

export interface GlobeMarker {
  location: [number, number]; // [lat, lng]
  size: number;
}

/** WebGL globe (COBE v2) that plots visitor locations and auto-rotates. */
export function Globe({ markers }: { markers: GlobeMarker[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markersRef = useRef<GlobeMarker[]>(markers);

  // Keep the latest markers without recreating the globe every poll.
  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let width = canvas.offsetWidth || 480;
    const onResize = () => {
      width = canvas.offsetWidth || width;
    };
    window.addEventListener("resize", onResize);

    const opts: COBEOptions = {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.28,
      dark: 1,
      diffuse: 1.1,
      mapSamples: 16000,
      mapBrightness: 6.5,
      baseColor: [0.22, 0.27, 0.34],
      markerColor: [0.16, 0.85, 0.95],
      glowColor: [0.12, 0.36, 0.46],
      markers: markersRef.current,
    };

    const globe = createGlobe(canvas, opts);

    let phi = 0;
    let raf = 0;
    const tick = () => {
      phi += 0.0035;
      globe.update({ phi, markers: markersRef.current, width: width * 2, height: width * 2 });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="glow-cyan aspect-square w-full max-w-[560px] mx-auto"
      style={{ contain: "layout paint size" }}
    />
  );
}
