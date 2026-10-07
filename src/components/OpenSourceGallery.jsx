import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Lensed, draggable, infinitely tiled gallery (ObsidianUI "art-gallery" port)
 * that renders your open-source contributions.
 *
 * Needs only `three`. No shadcn / clsx / tailwind-merge / motion.
 * Each contribution = { repo: "owner/name", pr: "...", link: "https://..." }
 * Optional: logo (Simple Icons slug), color (hex), image (your own imported file)
 * Click a tile (without dragging) to open its link.
 */

const CELL_SIZE = 0.75;
const ZOOM_LEVEL = 1.25;
const LERP = 0.075;
const TILE = 512;
const IMAGE_AREA = [0.2, 0.8]; // image occupies 20%–80% of a cell (matches shader)

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec2 uOffset;
  uniform vec2 uResolution;
  uniform vec4 uBorderColor;
  uniform vec3 uBg;
  uniform float uZoom;
  uniform float uCellSize;
  uniform float uTextureCount;
  uniform sampler2D uImageAtlas;
  uniform sampler2D uTextAtlas;
  varying vec2 vUv;

  void main() {
    vec2 screenUV = (vUv - 0.5) * 2.0;
    float radius = length(screenUV);
    float distortion = 1.0 - 0.08 * radius * radius;
    vec2 distortedUV = screenUV * distortion;
    vec2 aspectRatio = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 worldCoord = distortedUV * aspectRatio;
    worldCoord *= uZoom;
    worldCoord += uOffset;

    vec2 cellPos = worldCoord / uCellSize;
    vec2 cellId = floor(cellPos);
    vec2 cellUV = fract(cellPos);

    float lineWidth = 0.005;
    float gridX = smoothstep(0.0, lineWidth, cellUV.x) * smoothstep(0.0, lineWidth, 1.0 - cellUV.x);
    float gridY = smoothstep(0.0, lineWidth, cellUV.y) * smoothstep(0.0, lineWidth, 1.0 - cellUV.y);
    float gridMask = gridX * gridY;

    float imageSize = 0.6;
    float imageBorder = (1.0 - imageSize) * 0.5;
    vec2 imageUV = (cellUV - imageBorder) / imageSize;
    float edgeSmooth = 0.01;
    vec2 imageMask = smoothstep(-edgeSmooth, edgeSmooth, imageUV) *
                     smoothstep(-edgeSmooth, edgeSmooth, 1.0 - imageUV);
    float imageAlpha = imageMask.x * imageMask.y;
    bool inImageArea = imageUV.x >= 0.0 && imageUV.x <= 1.0 && imageUV.y >= 0.0 && imageUV.y <= 1.0;

    float textHeight = 0.08;
    float textY = 0.88;
    bool inTextArea = cellUV.x >= 0.05 && cellUV.x <= 0.95 && cellUV.y >= textY && cellUV.y <= (textY + textHeight);

    float texIndex = mod(cellId.x + cellId.y * 3.0, uTextureCount);
    if (texIndex < 0.0) texIndex += uTextureCount;
    float atlasSize = ceil(sqrt(uTextureCount));
    vec2 atlasPos = vec2(mod(texIndex, atlasSize), floor(texIndex / atlasSize));

    vec3 color = uBg;

    if (inImageArea && imageAlpha > 0.0) {
      // flip only inside the tile so the image is upright and the tile row
      // matches the text atlas row
      vec2 tileUV = vec2(imageUV.x, 1.0 - imageUV.y);
      vec2 atlasUV = (atlasPos + tileUV) / atlasSize;
      vec3 imageColor = texture2D(uImageAtlas, atlasUV).rgb;
      color = mix(color, imageColor, imageAlpha);
    }

    if (inTextArea) {
      vec2 textCoord = vec2((cellUV.x - 0.05) / 0.9, (cellUV.y - textY) / textHeight);
      textCoord.y = 1.0 - textCoord.y;
      vec2 atlasUV = (atlasPos + textCoord) / atlasSize;
      vec4 textColor = texture2D(uTextAtlas, atlasUV);
      color = mix(uBg, textColor.rgb, textColor.a);
    }

    color = mix(color, uBorderColor.rgb, (1.0 - gridMask) * uBorderColor.a);

    float fade = 1.0 - smoothstep(1.2, 1.8, radius);
    gl_FragColor = vec4(color * fade, 1.0);
  }
`;

// ---------- helpers ----------
const hueOf = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
};

const ownerOf = (repo) => repo.split("/")[0];
const nameOf = (repo) => repo.split("/")[1] ?? repo;

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // required so the atlas canvas isn't tainted
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

// ---------- brand logos ----------
// Keys are lowercase "owner/repo" or just "owner". `slug` is a Simple Icons name
// (white logo is fetched at runtime); `color` is the tile's background.
// Override per contribution in constants with: { logo: "slug", color: "#hex", image: importedFile }
const BRANDS = {
  strapi: { slug: "strapi", color: "#4945FF" },
  "emscripten-core": { slug: "webassembly", color: "#E8641B" },
  collaboraonline: { color: "#0B6FB8" },
  marketcalls: { color: "#0F766E" },
  nextcloud: { slug: "nextcloud", color: "#0082C9" },
};

const brandOf = (c) => {
  const repo = c.repo.toLowerCase();
  const b = BRANDS[repo] || BRANDS[ownerOf(repo)] || {};
  return {
    slug: c.logo ?? b.slug,
    color: c.color ?? b.color ?? `hsl(${hueOf(c.repo)}, 65%, 42%)`,
  };
};

// Fetch a Simple Icons SVG, recolor it white, return it as an <img>.
async function loadLogo(slug) {
  if (!slug) return null;
  try {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`);
    if (!res.ok) return null;
    const svg = (await res.text()).replace("<svg ", '<svg fill="#ffffff" width="256" height="256" ');
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = await loadImage(url);
    URL.revokeObjectURL(url);
    return img;
  } catch {
    return null;
  }
}

// GitHub avatars must come from avatars.githubusercontent.com: the github.com/x.png
// URL redirects and the redirect doesn't send CORS headers, which breaks canvas use.
const avatarUrl = (owner) => `https://avatars.githubusercontent.com/${owner}?s=256`;

async function buildImageAtlas(items) {
  const n = Math.ceil(Math.sqrt(items.length));
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = n * TILE;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const brands = items.map(brandOf);
  const assets = await Promise.all(
    items.map(async (c, i) => {
      if (c.image) {
        const custom = await loadImage(c.image);
        if (custom) return { kind: "image", img: custom };
      }
      const logo = await loadLogo(brands[i].slug);
      if (logo) return { kind: "logo", img: logo };
      const avatar = await loadImage(avatarUrl(ownerOf(c.repo)));
      if (avatar) return { kind: "avatar", img: avatar };
      return { kind: "none" };
    })
  );

  items.forEach((c, i) => {
    const x = (i % n) * TILE;
    const y = Math.floor(i / n) * TILE;
    const { kind, img } = assets[i];

    // brand-colored base with a soft darkening toward the bottom
    ctx.fillStyle = brands[i].color;
    ctx.fillRect(x, y, TILE, TILE);
    const shade = ctx.createLinearGradient(x, y, x, y + TILE);
    shade.addColorStop(0, "rgba(255,255,255,0.10)");
    shade.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, TILE, TILE);

    if (kind === "image") {
      // your own artwork: crop to fill the tile
      const s = Math.max(TILE / img.width, TILE / img.height);
      const w = img.width * s;
      const h = img.height * s;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, TILE, TILE);
      ctx.clip();
      ctx.drawImage(img, x + (TILE - w) / 2, y + (TILE - h) / 2, w, h);
      ctx.restore();
    } else if (kind === "logo") {
      const size = TILE * 0.5;
      ctx.drawImage(img, x + (TILE - size) / 2, y + (TILE - size) / 2, size, size);
    } else if (kind === "avatar") {
      const size = TILE * 0.55;
      const ax = x + (TILE - size) / 2;
      const ay = y + (TILE - size) / 2;
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(ax, ay, size, size, 40);
      else ctx.rect(ax, ay, size, size);
      ctx.clip();
      ctx.drawImage(img, ax, ay, size, size);
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "bold 190px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(nameOf(c.repo).slice(0, 2).toUpperCase(), x + TILE / 2, y + TILE / 2);
    }
  });

  return canvas;
}

function buildTextAtlas(items) {
  const n = Math.ceil(Math.sqrt(items.length));
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = n * TILE;
  const ctx = canvas.getContext("2d");

  items.forEach((c, i) => {
    const x = (i % n) * TILE;
    const y = Math.floor(i / n) * TILE;
    let label = c.repo.toUpperCase();
    if (label.length > 30) label = label.slice(0, 29) + "…";
    const prNumber = c.pr?.match(/#\d+/)?.[0] ?? "PR";

    ctx.save();
    // The shader stretches the whole tile over a very wide, short strip,
    // so draw as a 2048x256 strip squeezed into the 512x512 tile.
    ctx.setTransform(0.25, 0, 0, 2, x, y);
    ctx.font = "80px monospace";
    ctx.fillStyle = "rgba(160,160,160,1)";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(label, 30, 128);
    ctx.textAlign = "right";
    ctx.fillText(prNumber, 2048 - 30, 128);
    ctx.restore();
  });

  return canvas;
}

const makeTexture = (canvas) => {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.flipY = false;
  t.needsUpdate = true;
  return t;
};

// ---------- component ----------
export default function OpenSourceGallery({ contributions = [], showHint = true }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !contributions.length) return;

    setReady(false);
    const n = contributions.length;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const lerp = reducedMotion ? 1 : LERP;
    const dragZoom = reducedMotion ? 1 : ZOOM_LEVEL;

    let cancelled = false;
    let raf = 0;
    let material, geometry, mesh, imageTex, textTex;

    const state = {
      dragging: false,
      moved: false,
      start: { x: 0, y: 0 },
      prev: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      targetOffset: { x: 0, y: 0 },
      zoom: 1,
      targetZoom: 1,
    };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.setClearColor(0x050505);
    const el = renderer.domElement;
    el.style.cssText = "display:block;width:100%;height:100%;cursor:grab;touch-action:none";
    container.appendChild(el);

    const draw = () => {
      if (!material) return;
      material.uniforms.uOffset.value.set(state.offset.x, state.offset.y);
      material.uniforms.uZoom.value = state.zoom;
      renderer.render(scene, camera);
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      state.offset.x += (state.targetOffset.x - state.offset.x) * lerp;
      state.offset.y += (state.targetOffset.y - state.offset.y) * lerp;
      state.zoom += (state.targetZoom - state.zoom) * lerp;
      draw();
    };
    const start = () => { if (!raf) tick(); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    // Same lens math as the shader, so clicks land on the tile you see.
    // Returns tile index, or -1 if the pointer isn't over an image.
    const pick = (clientX, clientY) => {
      const rect = el.getBoundingClientRect();
      const w = container.clientWidth;
      const h = container.clientHeight;
      // normalise via rect so it also works under CSS `zoom` / transforms
      const px = ((clientX - rect.left) / rect.width) * w;
      const py = ((clientY - rect.top) / rect.height) * h;
      const sx = (px / w) * 2 - 1;
      const sy = -((py / h) * 2 - 1);
      const d = 1 - 0.08 * (sx * sx + sy * sy);
      const wx = sx * d * (w / h) * state.zoom + state.offset.x;
      const wy = sy * d * state.zoom + state.offset.y;
      const cx = Math.floor(wx / CELL_SIZE);
      const cy = Math.floor(wy / CELL_SIZE);
      const fx = wx / CELL_SIZE - cx;
      const fy = wy / CELL_SIZE - cy;
      const inImage = fx > IMAGE_AREA[0] && fx < IMAGE_AREA[1] && fy > IMAGE_AREA[0] && fy < IMAGE_AREA[1];
      if (!inImage) return -1;
      return (((cx + cy * 3) % n) + n) % n;
    };

    const onPointerDown = (e) => {
      e.preventDefault();
      container.setPointerCapture?.(e.pointerId);
      state.dragging = true;
      state.moved = false;
      state.start = { x: e.clientX, y: e.clientY };
      state.prev = { x: e.clientX, y: e.clientY };
      el.style.cursor = "grabbing";
    };

    const onPointerMove = (e) => {
      if (!state.dragging) {
        el.style.cursor = pick(e.clientX, e.clientY) >= 0 ? "pointer" : "grab";
        return;
      }
      const dx = e.clientX - state.prev.x;
      const dy = e.clientY - state.prev.y;
      if (Math.hypot(e.clientX - state.start.x, e.clientY - state.start.y) > 6) state.moved = true;
      if ((Math.abs(dx) > 2 || Math.abs(dy) > 2) && state.targetZoom === 1) state.targetZoom = dragZoom;
      state.targetOffset.x -= dx * 0.003;
      state.targetOffset.y += dy * 0.003;
      state.prev = { x: e.clientX, y: e.clientY };
    };

    const endDrag = () => {
      state.dragging = false;
      state.targetZoom = 1;
      el.style.cursor = "grab";
    };

    const onPointerUp = (e) => {
      if (container.hasPointerCapture?.(e.pointerId)) container.releasePointerCapture(e.pointerId);
      const wasClick = state.dragging && !state.moved;
      endDrag();
      if (wasClick) {
        const idx = pick(e.clientX, e.clientY);
        const link = idx >= 0 ? contributions[idx]?.link : null;
        if (link) window.open(link, "_blank", "noopener,noreferrer");
      }
    };

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      material?.uniforms.uResolution.value.set(w, h);
      draw();
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // The panel slides in from the side, so only render while it's on screen.
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.01 });

    Promise.all([buildImageAtlas(contributions), Promise.resolve(buildTextAtlas(contributions))]).then(
      ([imageCanvas, textCanvas]) => {
        if (cancelled) return;
        imageTex = makeTexture(imageCanvas);
        textTex = makeTexture(textCanvas);

        material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uOffset: { value: new THREE.Vector2(0, 0) },
            uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
            uBorderColor: { value: new THREE.Vector4(1, 1, 1, 0.15) },
            uBg: { value: new THREE.Vector3(5 / 255, 5 / 255, 5 / 255) },
            uZoom: { value: 1 },
            uCellSize: { value: CELL_SIZE },
            uTextureCount: { value: n },
            uImageAtlas: { value: imageTex },
            uTextAtlas: { value: textTex },
          },
        });
        geometry = new THREE.PlaneGeometry(2, 2);
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        container.addEventListener("pointerdown", onPointerDown);
        container.addEventListener("pointermove", onPointerMove);
        container.addEventListener("pointerup", onPointerUp);
        container.addEventListener("pointercancel", endDrag);
        container.addEventListener("pointerleave", endDrag);

        draw();
        io.observe(container);
        setReady(true);
      }
    );

    return () => {
      cancelled = true;
      stop();
      io.disconnect();
      ro.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", endDrag);
      container.removeEventListener("pointerleave", endDrag);
      imageTex?.dispose();
      textTex?.dispose();
      geometry?.dispose();
      material?.dispose();
      renderer.dispose();
      if (el.parentNode === container) container.removeChild(el);
    };
  }, [contributions]);

  return (
    <div className="absolute inset-0 bg-[#050505]" style={{ touchAction: "none" }}>
      <div
        ref={containerRef}
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: ready ? 1 : 0 }}
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs sm:text-sm">
          Loading contributions…
        </div>
      )}
    </div>
  );
}