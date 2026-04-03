import type {
  CellDetailDto,
  CellFiltersDto,
  CellSummaryDto,
  ComplianceDataDto,
  MediaItemDto,
  SpeciesProfileDto,
} from "@global-bird/contracts";
import {
  complianceByDownloadKey,
  mediaItems,
  mockCells,
  speciesProfiles,
} from "./mock-data";

function matchesYearPreset(year: number, preset: CellFiltersDto["yearPreset"]) {
  if (preset === "all") return true;
  if (preset === "recent") return year >= 2024;
  return year <= 2023;
}

function filterOccurrences(cell: CellDetailDto, filters: CellFiltersDto) {
  return cell.occurrences.filter((item) => {
    if (!matchesYearPreset(item.year, filters.yearPreset)) return false;
    if (filters.requireMedia && !item.hasMedia) return false;
    return true;
  });
}

function toSummary(
  cell: CellDetailDto,
  filters: CellFiltersDto,
): CellSummaryDto | null {
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

export function listCells(filters: CellFiltersDto): CellSummaryDto[] {
  return mockCells
    .map((cell) => toSummary(cell, filters))
    .filter((cell): cell is CellSummaryDto => cell !== null);
}

export function getCellDetail(
  h3: string,
  filters: CellFiltersDto,
): CellDetailDto | null {
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

export function getSpeciesProfile(
  speciesKey: number,
): SpeciesProfileDto | null {
  return speciesProfiles.find((item) => item.speciesKey === speciesKey) ?? null;
}

export function listSpeciesMedia(speciesKey: number): MediaItemDto[] {
  return mediaItems.filter((item) => item.speciesKey === speciesKey);
}

export function getCompliance(
  downloadKey: string,
): ComplianceDataDto | null {
  return complianceByDownloadKey[downloadKey] ?? null;
}
