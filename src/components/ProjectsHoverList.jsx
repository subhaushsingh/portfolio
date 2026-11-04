import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Project list with a mouse-following image preview (port of ObsidianUI "hover-img").
 * Uses framer-motion (already in your project), so there is nothing new to install.
 *
 * items: [{ title, label, imageSrc, link?, github? }]
 *
 * All colors use the theme tokens (--fg / --surface) so it works in light and dark mode.
 *
 * The preview is positioned with `absolute` inside the list (not `fixed`), because
 * your panels sit inside a transformed, CSS-zoomed container where `fixed` + clientX
 * would land in the wrong place.
 */
export default function ProjectsHoverList({ items = [] }) {
  const listRef = useRef(null);
  const [index, setIndex] = useState(0); // last hovered row (drives which image is shown)
  const [hovering, setHovering] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 28, mass: 0.6 });
  const y = useSpring(my, { stiffness: 260, damping: 28, mass: 0.6 });

  const onMove = (e) => {
    const el = listRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // normalise through the rect so it stays correct under CSS zoom / transforms
    mx.set(((e.clientX - rect.left) / rect.width) * el.offsetWidth);
    my.set(((e.clientY - rect.top) / rect.height) * el.offsetHeight);
  };

  return (
    <div
      ref={listRef}
      className="relative w-full text-[rgb(var(--fg))]"
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="flex flex-col">
        {items.map((item, i) => (
          <div
            key={item.title}
            onMouseEnter={() => setIndex(i)}
            className="group flex items-center justify-between gap-6 border-t border-[rgb(var(--fg)/0.15)] last:border-b py-5 sm:py-6 transition-opacity duration-500"
            style={{ opacity: hovering && index !== i ? 0.35 : 1 }}
          >
            <h3 className="text-lg sm:text-2xl font-semibold text-[rgb(var(--fg))] transition-transform duration-500 group-hover:-translate-x-2">
              {item.title}
            </h3>

            <div className="flex flex-col items-end gap-2 max-w-[14rem] sm:max-w-xs text-right transition-transform duration-500 group-hover:translate-x-2">
              <p className="text-xs sm:text-sm text-[rgb(var(--fg)/0.65)] leading-relaxed line-clamp-2">{item.label}</p>
              <div className="relative z-40 flex gap-4 text-xs sm:text-sm font-medium text-[rgb(var(--fg))]">
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-[rgb(var(--fg)/0.65)] transition">
                    Live
                  </a>
                )}
                {item.github && (
                  <a href={item.github} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-[rgb(var(--fg)/0.65)] transition">
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mouse-following preview (hidden on small / touch screens) */}
      <motion.div style={{ x, y }} className="pointer-events-none absolute top-0 left-0 z-30 hidden md:block">
        <div className="-translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: hovering ? 1 : 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-[300px] h-[188px] overflow-hidden rounded-xl border border-[rgb(var(--fg)/0.15)] shadow-[0_25px_50px_-12px_rgba(40,30,10,0.35)] bg-[rgb(var(--surface))]"
          >
            {items.map((item, i) => (
              <motion.div
                key={item.title}
                className="w-full h-full"
                initial={false}
                animate={{ y: `${-100 * index}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {item.imageSrc ? (
                  <img src={item.imageSrc} alt={item.title} draggable={false} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[rgb(var(--fg)/0.12)] to-[rgb(var(--fg)/0)] text-[rgb(var(--fg)/0.8)] text-xl font-semibold">
                    {item.title}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}