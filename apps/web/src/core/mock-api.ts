import {
  complianceByDownloadKey,
  mediaItems,
  mockCells,
  speciesProfiles,
} from "./mock-data";
import type {
  CellDetail,
  CellFilters,
  CellSummary,
  ComplianceData,
  MediaItem,
  SpeciesProfile,
} from "./types";

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function matchesYearPreset(year: number, preset: CellFilters["yearPreset"]) {
  if (preset === "all") return true;
  if (preset === "recent") return year >= 2024;
  return year <= 2023;
}

function cellHasMedia(cell: CellDetail) {
  return cell.occurrences.some((item) => item.hasMedia);
}

function filterOccurrences(cell: CellDetail, filters: CellFilters) {
  return cell.occurrences.filter((item) => {
    if (!matchesYearPreset(item.year, filters.yearPreset)) return false;
    if (filters.requireMedia && !item.hasMedia) return false;
    return true;
  });
}

function toSummary(cell: CellDetail, filters: CellFilters): CellSummary | null {
  const occurrences = filterOccurrences(cell, filters);
  if (occurrences.length === 0) return null;

  const counts = new Map<number, number>();
  for (const item of occurrences) {
    counts.set(item.speciesKey, (counts.get(item.speciesKey) ?? 0) + 1);
  }

  const topSpecies = cell.topSpecies
    .map((item) => ({
      ...item,
      count: counts.get(item.speciesKey) ?? 0,
    }))
    .filter((item) => item.count > 0);

  return {
    ...cell,
    occurrenceCount: occurrences.length,
    speciesCount: counts.size,
    topSpecies,
  };
}

export async function listCells(filters: CellFilters): Promise<CellSummary[]> {
  await wait(180);
  return mockCells
    .filter((cell) => !filters.requireMedia || cellHasMedia(cell))
    .map((cell) => toSummary(cell, filters))
    .filter((cell): cell is CellSummary => cell !== null);
}

export async function getCellDetail(
  h3: string,
  filters: CellFilters,
): Promise<CellDetail | null> {
  await wait(140);
  const cell = mockCells.find((item) => item.h3 === h3);
  if (!cell) return null;

  const summary = toSummary(cell, filters);
  if (!summary) return null;

  return {
    ...cell,
    ...summary,
    occurrences: filterOccurrences(cell, filters),
  };
}

export async function getSpeciesProfile(
  speciesKey: number,
): Promise<SpeciesProfile | null> {
  await wait(100);
  return speciesProfiles.find((item) => item.speciesKey === speciesKey) ?? null;
}

export async function getSpeciesMedia(
  speciesKey: number,
): Promise<MediaItem[]> {
  await wait(120);
  return mediaItems.filter((item) => item.speciesKey === speciesKey);
}

export async function getCompliance(
  downloadKey: string,
): Promise<ComplianceData | null> {
  await wait(80);
  return complianceByDownloadKey[downloadKey] ?? null;
}

