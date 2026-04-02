<template>
  <aside class="panel">
    <section class="panel-block">
      <div class="panel-heading">
        <p class="eyebrow">当前 Cell</p>
        <h2>{{ cellDetail?.region ?? "未选择区域" }}</h2>
      </div>
      <p class="summary">
        {{ cellDetail?.summary ?? "点击画布上的热点后，这里会显示该区域的聚合摘要和样本信息。" }}
      </p>

      <div v-if="cellDetail" class="metrics">
        <div class="metric">
          <span class="metric-label">occurrence</span>
          <strong>{{ cellDetail.occurrenceCount }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">species</span>
          <strong>{{ cellDetail.speciesCount }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">download</span>
          <strong>{{ cellDetail.downloadKey }}</strong>
        </div>
      </div>
    </section>

    <section v-if="cellDetail" class="panel-block">
      <div class="panel-heading compact">
        <p class="eyebrow">Top Species</p>
      </div>
      <div class="species-list">
        <button
          v-for="species in cellDetail.topSpecies"
          :key="species.speciesKey"
          class="species-chip"
          :class="{ active: species.speciesKey === selectedSpeciesKey }"
          @click="$emit('select-species', species.speciesKey)"
        >
          <span>{{ species.commonName }}</span>
          <small>{{ species.count }}</small>
        </button>
      </div>
    </section>

    <section v-if="speciesProfile" class="panel-block">
      <div class="panel-heading compact">
        <p class="eyebrow">物种详情</p>
        <h3>{{ speciesProfile.commonName }}</h3>
        <p class="latin">{{ speciesProfile.scientificName }}</p>
      </div>
      <dl class="meta-grid">
        <div>
          <dt>栖息地</dt>
          <dd>{{ speciesProfile.habitat }}</dd>
        </div>
        <div>
          <dt>状态</dt>
          <dd>{{ speciesProfile.status }}</dd>
        </div>
      </dl>
      <p class="summary">{{ speciesProfile.note }}</p>
    </section>

    <section v-if="media.length > 0" class="panel-block">
      <div class="panel-heading compact">
        <p class="eyebrow">图片媒体</p>
      </div>
      <div class="media-list">
        <article v-for="item in media" :key="item.mediaId" class="media-card">
          <img :src="item.thumbnailUrl" :alt="item.title" />
          <div class="media-copy">
            <strong>{{ item.title }}</strong>
            <p>
              {{ item.attribution.license }} · {{ item.attribution.rightsHolder }}
            </p>
            <a :href="item.source.references" target="_blank" rel="noreferrer">
              查看来源
            </a>
          </div>
        </article>
      </div>
    </section>

    <section v-if="cellDetail" class="panel-block">
      <div class="panel-heading compact">
        <p class="eyebrow">观测样本</p>
      </div>
      <div class="occurrence-list">
        <article
          v-for="item in cellDetail.occurrences"
          :key="item.gbifId"
          class="occurrence-card"
        >
          <div class="occurrence-top">
            <strong>{{ item.commonName }}</strong>
            <span>{{ item.eventDate }}</span>
          </div>
          <p class="latin">{{ item.scientificName }}</p>
          <p class="occurrence-meta">
            {{ item.locationLabel }} · {{ item.publisher }}
          </p>
          <p class="occurrence-license">
            {{ item.license }} / {{ item.rightsHolder }}
          </p>
        </article>
      </div>
    </section>

    <section v-if="compliance" class="panel-block">
      <div class="panel-heading compact">
        <p class="eyebrow">合规与引用</p>
      </div>
      <dl class="meta-grid single">
        <div>
          <dt>DOI</dt>
          <dd>{{ compliance.doi }}</dd>
        </div>
        <div>
          <dt>Citation</dt>
          <dd>{{ compliance.citation }}</dd>
        </div>
        <div>
          <dt>Rights</dt>
          <dd>{{ compliance.rightsSummary }}</dd>
        </div>
      </dl>
    </section>
  </aside>
</template>

<script setup lang="ts">
import type { CellDetail, ComplianceData, MediaItem, SpeciesProfile } from "../core/types";

defineProps<{
  cellDetail: CellDetail | null;
  selectedSpeciesKey: number | null;
  speciesProfile: SpeciesProfile | null;
  media: MediaItem[];
  compliance: ComplianceData | null;
}>();

defineEmits<{
  "select-species": [speciesKey: number];
}>();
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel-block {
  padding: 20px;
  border-radius: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow);
  backdrop-filter: blur(14px);
}

.panel-heading h2,
.panel-heading h3 {
  margin: 4px 0 0;
  font-size: 1.3rem;
}

.panel-heading.compact h3 {
  font-size: 1.1rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.summary,
.latin,
.occurrence-meta,
.occurrence-license,
.media-copy p {
  margin: 0;
  color: var(--text-subtle);
}

.latin {
  font-style: italic;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.metric {
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.7);
}

.metric strong {
  display: block;
  margin-top: 6px;
  font-size: 1.15rem;
}

.metric-label,
dt {
  font-size: 0.78rem;
  color: var(--text-subtle);
}

.species-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.species-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-main);
}

.species-chip.active {
  border-color: rgba(31, 122, 69, 0.28);
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.species-chip small {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(21, 95, 52, 0.12);
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 14px 0;
}

.meta-grid.single {
  grid-template-columns: 1fr;
}

.meta-grid dd {
  margin: 6px 0 0;
}

.media-list,
.occurrence-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.media-card,
.occurrence-card {
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
}

.media-card {
  grid-template-columns: 96px 1fr;
  align-items: center;
}

.media-card img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 14px;
}

.media-copy {
  display: grid;
  gap: 6px;
}

.media-copy a {
  color: var(--accent-strong);
  text-decoration: none;
}

.occurrence-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 720px) {
  .metrics,
  .meta-grid {
    grid-template-columns: 1fr;
  }

  .media-card {
    grid-template-columns: 1fr;
  }

  .media-card img {
    width: 100%;
    height: 180px;
  }
}
</style>

