const button = document.querySelector('.pixel-button');
const canvas = button.querySelector('canvas');
const context = canvas.getContext('2d');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionPreference.matches;
const settings = {
  columns: 40, rows: 14, gap: 1.5,
  maxTilt: 9,
  waveDuration: 720, waveSpeed: 1.5, waveWidth: 4.5, waveStrength: 1.5,
  glowDuration: 140, highlightSpread: 0.09,
  shimmerStrength: 0.14,
  baseOpacity: 0.025, pixelVariation: 0.085, maxOpacity: 0.76,
  highlightBase: 0.16, highlightVariation: 0.34, rippleOpacity: 0.34,
};
const pixels = Array.from({ length: settings.columns * settings.rows }, (_, index) => ({
  column: index % settings.columns,
  row: Math.floor(index / settings.columns),
  seed: Math.random(),
}));
const pointer = { x: 0.5, y: 0.5, active: false };
let waves = [];
let width = 0;
let height = 0;
let frame = 0;
let glow = 0;
let lastTime = 0;

function draw(time) {
  frame = 0;
  const delta = Math.min(time - lastTime, 50);
  lastTime = time;
  const targetGlow = pointer.active ? 1 : 0;
  glow += (targetGlow - glow) * (1 - Math.exp(-delta / settings.glowDuration));
  if (Math.abs(targetGlow - glow) < 0.001) glow = targetGlow;
  waves = waves.filter(wave => time - wave.time < settings.waveDuration);
  const activeWaves = waves.map(wave => ({
    x: wave.x * width,
    y: wave.y * height,
    radius: (time - wave.time) / 1000 * width * settings.waveSpeed,
    strength: (1 - (time - wave.time) / settings.waveDuration) * settings.waveStrength,
  }));
  context.clearRect(0, 0, width, height);
  context.fillStyle = 'rgb(230, 242, 255)';
  const cellWidth = width / settings.columns;
  const cellHeight = height / settings.rows;
  const pointerX = pointer.x * width;
  const pointerY = pointer.y * height;
  const highlightSpread = width * width * settings.highlightSpread;
  const shimmerPhase = (pointer.x + pointer.y) * Math.PI * 2;
  const shimmerStrength = reducedMotion ? 0 : settings.shimmerStrength * glow;

  for (const { row, column, seed } of pixels) {
    const x = (column + 0.5) * cellWidth;
    const y = (row + 0.5) * cellHeight;
    const distanceSquared = (x - pointerX) ** 2 + (y - pointerY) ** 2;
    const highlight = Math.exp(-distanceSquared / highlightSpread) * glow;
    let ripple = 0;

    for (const wave of activeWaves) {
      const distance = Math.hypot(x - wave.x, y - wave.y);
      const band = (distance - wave.radius) / (cellWidth * settings.waveWidth);
      ripple += Math.exp(-band * band) * wave.strength;
    }

    const shimmer = (0.5 + Math.sin(shimmerPhase + seed * 30) * 0.5) * shimmerStrength;
    context.globalAlpha = Math.min(settings.maxOpacity,
      settings.baseOpacity + seed * settings.pixelVariation
      + highlight * (settings.highlightBase + seed * settings.highlightVariation)
      + ripple * settings.rippleOpacity + shimmer);
    context.fillRect(column * cellWidth + settings.gap / 2, row * cellHeight + settings.gap / 2,
      cellWidth - settings.gap, cellHeight - settings.gap);
  }

  if (!reducedMotion && (glow !== targetGlow || waves.length)) {
    frame = requestAnimationFrame(draw);
  }
}

function render() {
  if (!frame) {
    lastTime = performance.now() - 16;
    frame = requestAnimationFrame(draw);
  }
}

function movePointer(event) {
  const rect = button.parentElement.getBoundingClientRect();
  pointer.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  pointer.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  pointer.active = true;
  button.style.setProperty('--tilt-x', `${(0.5 - pointer.y) * settings.maxTilt * 2}deg`);
  button.style.setProperty('--tilt-y', `${(pointer.x - 0.5) * settings.maxTilt * 2}deg`);
  if (reducedMotion) glow = 1;
  render();
}

function releasePointer() {
  pointer.active = false;
  button.style.removeProperty('--tilt-x');
  button.style.removeProperty('--tilt-y');
  if (reducedMotion) glow = 0;
  render();
}

button.addEventListener('pointerenter', movePointer);
button.addEventListener('pointermove', movePointer);
button.addEventListener('pointerleave', releasePointer);
button.addEventListener('pointercancel', releasePointer);
button.addEventListener('pointerup', event => {
  if (event.pointerType !== 'mouse') releasePointer();
});
button.addEventListener('click', event => {
  if (reducedMotion) return;
  const rect = button.getBoundingClientRect();
  const x = event.detail === 0 ? 0.5 : (event.clientX - rect.left) / rect.width;
  const y = event.detail === 0 ? 0.5 : (event.clientY - rect.top) / rect.height;
  waves.push({ x, y, time: performance.now() });
  render();
});

new ResizeObserver(() => {
  width = button.clientWidth;
  height = button.clientHeight;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  render();
}).observe(button);

motionPreference.addEventListener('change', ({ matches }) => {
  reducedMotion = matches;
  waves = [];
  glow = pointer.active ? 1 : 0;
  render();
});
