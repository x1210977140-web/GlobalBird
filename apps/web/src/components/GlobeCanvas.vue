<template>
  <div class="globe-shell">
    <canvas
      ref="canvasRef"
      class="globe-canvas"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @wheel.prevent="onWheel"
    />
    <div class="globe-hud">
      <span>拖拽可旋转</span>
      <span>滚轮可缩放</span>
      <span>点击热点查看详情</span>
    </div>
    <div v-if="loading" class="globe-loading">正在刷新视野数据…</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { CellSummaryDto as CellSummary } from "@global-bird/contracts";

const props = defineProps<{
  cells: CellSummary[];
  selectedH3: string | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  select: [h3: string];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const width = ref(0);
const height = ref(0);
const yaw = ref(-0.38);
const pitch = ref(-0.32);
const zoom = ref(1);
const pointerState = ref<{
  active: boolean;
  startX: number;
  startY: number;
  startYaw: number;
  startPitch: number;
  moved: boolean;
}>({
  active: false,
  startX: 0,
  startY: 0,
  startYaw: 0,
  startPitch: 0,
  moved: false,
});

let resizeObserver: ResizeObserver | null = null;

const visiblePoints = computed(() => {
  return props.cells
    .map((cell) => {
      const projected = projectCell(cell);
      return projected ? { cell, ...projected } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.depth - b.depth);
});

function setupCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  width.value = rect.width;
  height.value = rect.height;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function sphereRadius() {
  return Math.min(width.value, height.value) * 0.33 * zoom.value;
}

function projectCell(cell: CellSummary) {
  const radius = sphereRadius();
  const centerX = width.value * 0.5;
  const centerY = height.value * 0.53;

  const lon = (cell.center.lon * Math.PI) / 180;
  const lat = (cell.center.lat * Math.PI) / 180;
  const cosLat = Math.cos(lat);

  const baseX = cosLat * Math.sin(lon);
  const baseY = Math.sin(lat);
  const baseZ = cosLat * Math.cos(lon);

  const cosYaw = Math.cos(yaw.value);
  const sinYaw = Math.sin(yaw.value);
  const yawX = baseX * cosYaw - baseZ * sinYaw;
  const yawZ = baseX * sinYaw + baseZ * cosYaw;

  const cosPitch = Math.cos(pitch.value);
  const sinPitch = Math.sin(pitch.value);
  const pitchY = baseY * cosPitch - yawZ * sinPitch;
  const pitchZ = baseY * sinPitch + yawZ * cosPitch;

  if (pitchZ < -0.08) return null;

  const px = centerX + yawX * radius;
  const py = centerY - pitchY * radius;
  const pointRadius = 4 + Math.log2(cell.occurrenceCount + 1) * 1.4 + pitchZ * 2;

  return {
    x: px,
    y: py,
    depth: pitchZ,
    pointRadius,
  };
}

function drawGrid(context: CanvasRenderingContext2D, radius: number) {
  const centerX = width.value * 0.5;
  const centerY = height.value * 0.53;

  context.save();
  context.strokeStyle = "rgba(222, 241, 232, 0.2)";
  context.lineWidth = 1;

  for (const scale of [0.2, 0.42, 0.65, 0.86]) {
    context.beginPath();
    context.ellipse(centerX, centerY, radius, radius * scale, 0, 0, Math.PI * 2);
    context.stroke();
  }

  for (const scale of [0.3, 0.58, 0.82]) {
    context.beginPath();
    context.ellipse(centerX, centerY, radius * scale, radius, 0, 0, Math.PI * 2);
    context.stroke();
  }

  context.restore();
}

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, width.value, height.value);

  const radius = sphereRadius();
  const centerX = width.value * 0.5;
  const centerY = height.value * 0.53;

  const atmosphere = context.createRadialGradient(
    centerX,
    centerY,
    radius * 0.4,
    centerX,
    centerY,
    radius * 1.18,
  );
  atmosphere.addColorStop(0, "rgba(22, 163, 74, 0.18)");
  atmosphere.addColorStop(0.68, "rgba(59, 130, 246, 0.08)");
  atmosphere.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = atmosphere;
  context.beginPath();
  context.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
  context.fill();

  const globe = context.createRadialGradient(
    centerX - radius * 0.35,
    centerY - radius * 0.4,
    radius * 0.1,
    centerX,
    centerY,
    radius,
  );
  globe.addColorStop(0, "#4ecf80");
  globe.addColorStop(0.28, "#168359");
  globe.addColorStop(0.7, "#0f3e3d");
  globe.addColorStop(1, "#0b1f29");
  context.fillStyle = globe;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.clip();
  drawGrid(context, radius);

  for (const point of visiblePoints.value) {
    const selected = point.cell.h3 === props.selectedH3;
    const glow = context.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      point.pointRadius * 3.2,
    );
    glow.addColorStop(
      0,
      selected ? "rgba(250, 204, 21, 0.95)" : "rgba(255, 255, 255, 0.95)",
    );
    glow.addColorStop(
      1,
      selected ? "rgba(250, 204, 21, 0)" : "rgba(255, 255, 255, 0)",
    );
    context.fillStyle = glow;
    context.beginPath();
    context.arc(point.x, point.y, point.pointRadius * 3.2, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = selected ? "#facc15" : "#f8fafc";
    context.beginPath();
    context.arc(point.x, point.y, point.pointRadius, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = selected ? "#78350f" : "rgba(12, 24, 18, 0.32)";
    context.lineWidth = selected ? 2.4 : 1.2;
    context.stroke();
  }

  context.restore();

  context.fillStyle = "rgba(255, 255, 255, 0.9)";
  context.font = "600 14px PingFang SC, sans-serif";
  context.fillText("GlobalBird 本地联调版", 20, 28);
}

function findCellAtPoint(clientX: number, clientY: number) {
  const canvas = canvasRef.value;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  let bestMatch: { h3: string; distance: number } | null = null;
  for (const point of visiblePoints.value) {
    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const threshold = Math.max(point.pointRadius + 8, 16);
    if (distance <= threshold && (!bestMatch || distance < bestMatch.distance)) {
      bestMatch = { h3: point.cell.h3, distance };
    }
  }
  return bestMatch?.h3 ?? null;
}

function onPointerDown(event: PointerEvent) {
  pointerState.value = {
    active: true,
    startX: event.clientX,
    startY: event.clientY,
    startYaw: yaw.value,
    startPitch: pitch.value,
    moved: false,
  };
}

function onPointerMove(event: PointerEvent) {
  if (!pointerState.value.active) return;
  const deltaX = event.clientX - pointerState.value.startX;
  const deltaY = event.clientY - pointerState.value.startY;
  if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
    pointerState.value.moved = true;
  }
  yaw.value = pointerState.value.startYaw - deltaX * 0.006;
  pitch.value = Math.max(
    -1.12,
    Math.min(1.12, pointerState.value.startPitch + deltaY * 0.0055),
  );
  draw();
}

function onPointerUp(event: PointerEvent) {
  if (!pointerState.value.active) return;
  const wasDrag = pointerState.value.moved;
  pointerState.value.active = false;

  if (!wasDrag) {
    const h3 = findCellAtPoint(event.clientX, event.clientY);
    if (h3) emit("select", h3);
  }
}

function onWheel(event: WheelEvent) {
  zoom.value = Math.min(1.28, Math.max(0.82, zoom.value - event.deltaY * 0.0008));
  draw();
}

watch(
  () => [props.cells, props.selectedH3, props.loading],
  () => {
    draw();
  },
  { deep: true },
);

onMounted(() => {
  setupCanvas();
  if (canvasRef.value) {
    resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });
    resizeObserver.observe(canvasRef.value);
  }
  window.addEventListener("resize", setupCanvas);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("resize", setupCanvas);
});
</script>

<style scoped>
.globe-shell {
  position: relative;
  min-height: 540px;
  border-radius: 32px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0)),
    linear-gradient(160deg, #07111b 0%, #08202a 58%, #11351d 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.globe-canvas {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 540px;
  touch-action: none;
}

.globe-hud {
  position: absolute;
  bottom: 18px;
  left: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  pointer-events: none;
}

.globe-hud span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  backdrop-filter: blur(10px);
}

.globe-loading {
  position: absolute;
  top: 18px;
  right: 18px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  font-size: 12px;
  backdrop-filter: blur(12px);
}
</style>
