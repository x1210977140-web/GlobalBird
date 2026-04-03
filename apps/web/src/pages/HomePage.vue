<template>
  <main class="page">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">GlobalBird / 本地联调版</p>
        <h1>海量鸟类分布的前端主链路演示</h1>
        <p class="hero-summary">
          这是一版通过本地 Fastify mock API 联调的演示实现：当前已经接通
          `/api/v1/cells`、`/occurrences`、`/species`、`/media` 和
          `compliance`，先把 HTTP 契约、交互和面板闭环跑通。
        </p>
      </div>

      <div class="hero-metrics">
        <article class="hero-metric">
          <span>当前 cell 数</span>
          <strong>{{ cells.length }}</strong>
        </article>
        <article class="hero-metric">
          <span>当前样本数</span>
          <strong>{{ totalOccurrences }}</strong>
        </article>
        <article class="hero-metric">
          <span>当前物种数</span>
          <strong>{{ totalSpecies }}</strong>
        </article>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-copy">
        <h2>筛选器</h2>
        <p>这部分模拟前端对聚合接口参数的控制，当前只保留年份和媒体两个维度。</p>
      </div>

      <div class="toolbar-controls">
        <label class="control">
          <span>时间范围</span>
          <select v-model="filters.yearPreset" @change="refreshScene">
            <option value="all">全部年份</option>
            <option value="recent">最近两年</option>
            <option value="classic">2023 年及以前</option>
          </select>
        </label>

        <label class="control checkbox">
          <input
            v-model="filters.requireMedia"
            type="checkbox"
            @change="refreshScene"
          />
          <span>只看有图片样本</span>
        </label>
      </div>
    </section>

    <section v-if="sceneError" class="status-card error">
      <strong>视野数据加载失败</strong>
      <p>{{ sceneError }}</p>
    </section>

    <section class="workspace">
      <section class="scene-panel">
        <GlobeCanvas
          :cells="cells"
          :selected-h3="selectedH3"
          :loading="loading"
          @select="handleSelectCell"
        />
      </section>

      <InfoPanel
        :cell-detail="selectedCellDetail"
        :selected-species-key="selectedSpeciesKey"
        :species-profile="selectedSpecies"
        :media="selectedMedia"
        :compliance="selectedCompliance"
        @select-species="handleSelectSpecies"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import GlobeCanvas from "../components/GlobeCanvas.vue";
import InfoPanel from "../components/InfoPanel.vue";
import {
  getCellDetail,
  getCompliance,
  getSpeciesMedia,
  getSpeciesProfile,
  listCells,
} from "../core/api-client";
import type {
  CellDetailDto as CellDetail,
  CellFiltersDto as CellFilters,
  CellSummaryDto as CellSummary,
  ComplianceDataDto as ComplianceData,
  MediaItemDto as MediaItem,
  SpeciesProfileDto as SpeciesProfile,
} from "@global-bird/contracts";

const filters = reactive<CellFilters>({
  yearPreset: "all",
  requireMedia: false,
});

const loading = ref(false);
const sceneError = ref<string | null>(null);
const cells = ref<CellSummary[]>([]);
const selectedH3 = ref<string | null>(null);
const selectedCellDetail = ref<CellDetail | null>(null);
const selectedSpeciesKey = ref<number | null>(null);
const selectedSpecies = ref<SpeciesProfile | null>(null);
const selectedMedia = ref<MediaItem[]>([]);
const selectedCompliance = ref<ComplianceData | null>(null);

const totalOccurrences = computed(() => {
  return cells.value.reduce((sum, item) => sum + item.occurrenceCount, 0);
});

const totalSpecies = computed(() => {
  return cells.value.reduce((sum, item) => sum + item.speciesCount, 0);
});

async function refreshScene() {
  loading.value = true;
  sceneError.value = null;

  try {
    const nextCells = await listCells(filters);
    cells.value = nextCells;

    const fallbackH3 = nextCells[0]?.h3 ?? null;
    const keepCurrent = nextCells.some((item) => item.h3 === selectedH3.value);
    selectedH3.value = keepCurrent ? selectedH3.value : fallbackH3;

    if (selectedH3.value) {
      await loadCell(selectedH3.value);
    } else {
      selectedCellDetail.value = null;
      selectedSpeciesKey.value = null;
      selectedSpecies.value = null;
      selectedMedia.value = [];
      selectedCompliance.value = null;
    }
  } catch {
    sceneError.value = "请确认本地 API 服务已启动，并且 `GET /api/v1/cells` 可以正常访问。";
    cells.value = [];
    selectedH3.value = null;
    selectedCellDetail.value = null;
    selectedSpeciesKey.value = null;
    selectedSpecies.value = null;
    selectedMedia.value = [];
    selectedCompliance.value = null;
  } finally {
    loading.value = false;
  }
}

async function loadCell(h3: string) {
  const detail = await getCellDetail(h3, filters).catch(() => null);
  selectedCellDetail.value = detail;
  selectedH3.value = detail?.h3 ?? null;

  if (!detail) {
    selectedSpeciesKey.value = null;
    selectedSpecies.value = null;
    selectedMedia.value = [];
    selectedCompliance.value = null;
    return;
  }

  selectedCompliance.value = await getCompliance(detail.downloadKey).catch(
    () => null,
  );

  const firstSpeciesKey =
    selectedSpeciesKey.value &&
    detail.topSpecies.some((item) => item.speciesKey === selectedSpeciesKey.value)
      ? selectedSpeciesKey.value
      : detail.topSpecies[0]?.speciesKey ?? detail.occurrences[0]?.speciesKey ?? null;

  if (firstSpeciesKey) {
    await loadSpecies(firstSpeciesKey);
  } else {
    selectedSpeciesKey.value = null;
    selectedSpecies.value = null;
    selectedMedia.value = [];
  }
}

async function loadSpecies(speciesKey: number) {
  selectedSpeciesKey.value = speciesKey;
  const [profile, media] = await Promise.allSettled([
    getSpeciesProfile(speciesKey),
    getSpeciesMedia(speciesKey),
  ]);
  selectedSpecies.value = profile.status === "fulfilled" ? profile.value : null;
  selectedMedia.value = media.status === "fulfilled" ? media.value : [];
}

async function handleSelectCell(h3: string) {
  if (h3 === selectedH3.value) return;
  loading.value = true;
  await loadCell(h3);
  loading.value = false;
}

async function handleSelectSpecies(speciesKey: number) {
  await loadSpecies(speciesKey);
}

onMounted(async () => {
  await refreshScene();
});
</script>

<style scoped>
.page {
  display: grid;
  gap: 20px;
  padding: 24px;
}

.hero-card,
.toolbar-card,
.status-card {
  display: grid;
  gap: 18px;
  padding: 24px;
  border: 1px solid var(--border-soft);
  border-radius: 28px;
  background: var(--bg-card);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.status-card.error {
  border-color: rgba(190, 24, 93, 0.16);
  background: rgba(255, 244, 246, 0.92);
}

.status-card p,
.status-card strong {
  margin: 0;
}

.status-card p {
  color: #9f1239;
}

.hero-card {
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
  align-items: start;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1.05;
}

.hero-summary,
.toolbar-copy p {
  max-width: 72ch;
  margin: 12px 0 0;
  color: var(--text-subtle);
}

.hero-metrics {
  display: grid;
  gap: 12px;
}

.hero-metric {
  padding: 18px;
  border-radius: 22px;
  background: var(--bg-card-strong);
  border: 1px solid rgba(21, 95, 52, 0.08);
}

.hero-metric span {
  display: block;
  color: var(--text-subtle);
}

.hero-metric strong {
  display: block;
  margin-top: 6px;
  font-size: 1.8rem;
}

.toolbar-card {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
}

.toolbar-copy h2 {
  margin: 0;
}

.toolbar-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.control {
  display: grid;
  gap: 6px;
  min-width: 180px;
}

.control span {
  font-size: 0.9rem;
  color: var(--text-subtle);
}

.control select {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid var(--border-soft);
  background: rgba(255, 255, 255, 0.84);
}

.control.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: auto;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid var(--border-soft);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(360px, 0.9fr);
  gap: 20px;
  align-items: start;
}

.scene-panel {
  min-width: 0;
}

@media (max-width: 1080px) {
  .hero-card,
  .toolbar-card,
  .workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .page {
    padding: 16px;
  }

  .hero-card,
  .toolbar-card {
    padding: 18px;
  }

  .toolbar-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .control,
  .control.checkbox {
    width: 100%;
  }
}
</style>
