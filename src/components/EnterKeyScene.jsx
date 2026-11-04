import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

import keyUpImg from "../assets/images/key-up.webp";
import keyDownImg from "../assets/images/key-down.webp";
import keyHandImg from "../assets/images/key-hand.webp";

/**
 * A hand pressing a lit Enter key, drawn as the BACKGROUND of your existing footer.
 * Put it as the first child of a `relative` footer; the footer's own content goes on top.
 *
 * Three image layers (1536x864, same framing), imported from src/assets/images/ :
 *   key-up.webp    the desk with the key up
 *   key-down.webp  the same desk with the key down (shown while pressed)
 *   key-hand.webp  the hand on its own; it drops by the distance the two keys differ
 *
 * Press it: click / tap the key, or hit Enter while the footer is on screen.
 * The hand comes down, the key sinks, a synthesized "thock" plays; on release a lighter
 * "click" plays, and ~0.4s later `onActivate` fires.
 *
 * Props
 *   onActivate  () => void
 *   hint        small caption in the bottom-left corner
 *   mirror      true = hand comes in from the RIGHT (the key sits bottom-left)
 *   tone        "mono" = the red art is recolored to white-on-dark to suit a dark footer
 *               "red"  = the original red artwork
 *   debug       outlines the clickable area so you can tune HIT below
 *
 * The footer's content must not block the key: give the content wrapper
 * `pointer-events-none` and its links/buttons `pointer-events-auto`.
 */

const IMAGES = {
  up: keyUpImg,
  down: keyDownImg,
  hand: keyHandImg,
};

/* clickable key, as % of the 1536x864 image (unflipped): tweak if it's off */
const HIT = { left: 46, top: 61, width: 41, height: 29 };
/* centre of the key, for the flash of light */
const GLOW = { x: 66.5, y: 75.5, w: 46 };

/* the hand's travel, as a share of the scene's height (73 of 864 px) */
const HAND_DOWN = "8.45%";
const HAND_HOVER = "1.1%";
const pressSpring = { type: "spring", stiffness: 1100, damping: 46, mass: 0.6 };
const releaseSpring = { type: "spring", stiffness: 520, damping: 17, mass: 0.7 };
const MIN_PRESS_MS = 140; // even the quickest tap shows the key going all the way down
const ACTIVATE_DELAY = 420;

const RED = "#e00020";
const FOOTER_DARK = "#0a0a0a";

/* ---------- sound (Web Audio, no files) ---------- */
let audioCtx = null;
const getCtx = () => {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  audioCtx = audioCtx || new AC();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
};

const thump = (ac, t, f0, f1, dur, gain) => {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
};

const noiseBurst = (ac, t, dur, freq, q, gain) => {
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t);
};

const playKeyDown = () => {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  thump(ac, t, 180, 55, 0.13, 0.5); // the thock
  noiseBurst(ac, t, 0.05, 1800, 0.8, 0.35);
};

const playKeyUp = () => {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  thump(ac, t, 440, 260, 0.05, 0.16); // the lighter click
  noiseBurst(ac, t, 0.03, 4200, 1.2, 0.22);
};

/* ---------- component ---------- */
export default function EnterKeyScene({
  onActivate,
  hint = "Go on, press Enter",
  mirror = true,
  tone = "mono",
  debug = false,
}) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const mono = tone === "mono";

  // The art rises into place and settles from a slight zoom as the footer scrolls in
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const artY = useTransform(scrollYProgress, [0, 0.85], ["16%", "0%"], { clamp: true });
  const artScale = useTransform(scrollYProgress, [0, 0.85], [1.06, 1], { clamp: true });
  const onScreen = useInView(ref, { amount: 0.3 });

  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [presses, setPresses] = useState(0);
  const onImgError = useCallback((e) => {
    console.warn("EnterKeyScene: image failed to load:", e.currentTarget.src);
  }, []);

  const downAt = useRef(0);
  const isDown = useRef(false); // one thock per press, one click per release
  const releaseTimer = useRef(null);
  const activateTimer = useRef(null);
  const onActivateRef = useRef(onActivate);
  onActivateRef.current = onActivate;

  const press = useCallback(() => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    downAt.current = performance.now();
    if (!isDown.current) {
      isDown.current = true;
      playKeyDown();
    }
    setPressed(true);
    setPresses((n) => n + 1);
  }, []);

  const release = useCallback(() => {
    if (!isDown.current) return;
    const held = performance.now() - downAt.current;
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(() => {
      isDown.current = false;
      playKeyUp();
      setPressed(false);
      if (activateTimer.current) clearTimeout(activateTimer.current);
      activateTimer.current = setTimeout(() => onActivateRef.current?.(), ACTIVATE_DELAY);
    }, Math.max(0, MIN_PRESS_MS - held));
  }, []);

  useEffect(
    () => () => {
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
      if (activateTimer.current) clearTimeout(activateTimer.current);
    },
    []
  );

  // Enter anywhere while the footer is on screen and nothing else wants the key
  useEffect(() => {
    if (!onScreen) return;
    const busy = (el) =>
      !!el &&
      (el.matches("input, textarea, select, button, a, [contenteditable=''], [contenteditable='true']") ||
        el.closest("[role='dialog']") !== null);
    const down = (e) => {
      if (e.key !== "Enter" || e.repeat || e.metaKey || e.ctrlKey || e.altKey || busy(document.activeElement)) return;
      press();
    };
    const up = (e) => {
      if (e.key === "Enter") release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [onScreen, press, release]);

  const layer = "absolute inset-0 h-full w-full select-none pointer-events-none";
  const tint = mono ? { filter: "url(#ek-mono)" } : undefined;

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden"
      style={{ containerType: "size", backgroundColor: mono ? FOOTER_DARK : RED }}
    >
      {/* recolors the red art to white-on-dark: grayscale, then stretch so the red field lands on black */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id="ek-mono" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.4" intercept="-0.39" />
            <feFuncG type="linear" slope="1.4" intercept="-0.39" />
            <feFuncB type="linear" slope="1.4" intercept="-0.39" />
          </feComponentTransfer>
        </filter>
      </svg>

      {/*
        The 16:9 frame: at least as wide as the footer, and at least as wide as a
        picture that fills the footer's height, anchored to the bottom. The image never
        distorts; on very wide footers the empty top is cropped, so the key stays in view.
      */}
      <div
        className="absolute bottom-0 left-1/2"
        style={{ width: "max(100cqw, 177.78cqh)", aspectRatio: "16 / 9", transform: "translateX(-50%)" }}
      >
        <motion.div className="h-full w-full" style={reduced ? undefined : { y: artY, scale: artScale }}>
          {/* flipping this one wrapper mirrors every layer + the hit area together */}
          <div className="relative h-full w-full" style={{ transform: mirror ? "scaleX(-1)" : undefined }}>
            <img
              className={layer}
              src={IMAGES.up}
              onError={onImgError}
              alt=""
              width={1536}
              height={864}
              decoding="async"
              draggable={false}
              style={tint}
            />

            {/* the same desk with the key down in its lit well: shown while pressed */}
            <img
              className={layer}
              src={IMAGES.down}
              onError={onImgError}
              alt=""
              width={1536}
              height={864}
              loading="eager"
              decoding="async"
              draggable={false}
              style={{ ...tint, opacity: pressed ? 1 : 0 }}
            />

            {/* a flash of light off the key, once per press */}
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${GLOW.x}%`, top: `${GLOW.y}%`, width: `${GLOW.w}%`, aspectRatio: "1 / 1" }}
              aria-hidden="true"
            >
              <AnimatePresence>
                {!reduced && pressed && (
                  <motion.span
                    key={presses}
                    className="block h-full w-full rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 62%)" }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: [0, 0.5, 0], scale: 1.25 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* the hand drops by exactly the distance the two key drawings put between them */}
            <motion.img
              className={layer}
              src={IMAGES.hand}
              onError={onImgError}
              alt=""
              width={1536}
              height={864}
              decoding="async"
              draggable={false}
              style={tint}
              initial={false}
              animate={{ y: pressed ? HAND_DOWN : hovered ? HAND_HOVER : "0%" }}
              transition={reduced ? { duration: 0 } : pressed ? pressSpring : releaseSpring}
            />

            {/* the key itself: the only part you can press */}
            <button
              type="button"
              aria-label="Press the enter key"
              className="absolute rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{
                left: `${HIT.left}%`,
                top: `${HIT.top}%`,
                width: `${HIT.width}%`,
                height: `${HIT.height}%`,
                outline: debug ? "2px dashed #fff" : undefined,
                background: debug ? "rgba(255,255,255,0.15)" : undefined,
              }}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.currentTarget.setPointerCapture?.(e.pointerId);
                press();
              }}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={() => pressed && release()}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
              onPointerLeave={() => setHovered(false)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                  e.preventDefault();
                  press();
                }
              }}
              onKeyUp={(e) => {
                if (e.key === "Enter" || e.key === " ") release();
              }}
              onBlur={() => pressed && release()}
            />
          </div>
        </motion.div>
      </div>


      {/* small caption in the corner, under the key */}
      {hint && (
        <p className="pointer-events-none absolute left-6 sm:left-12 bottom-4 text-[11px] sm:text-xs text-white/60">
          {hint}
        </p>
      )}
    </div>
  );
}