export interface HealthDto {
  status: "ok";
  appName: string;
}

export const cellYearPresets = ["all", "recent", "classic"] as const;

export type CellYearPreset = (typeof cellYearPresets)[number];
export type MediaType = "StillImage";

export interface TopSpeciesDto {
  speciesKey: number;
  scientificName: string;
  commonName: string;
  count: number;
}

export interface CellSummaryDto {
  h3: string;
  center: {
    lon: number;
    lat: number;
  };
  region: string;
  occurrenceCount: number;
  speciesCount: number;
  topSpecies: TopSpeciesDto[];
}

export interface OccurrenceRecordDto {
  gbifId: number;
  speciesKey: number;
  commonName: string;
  scientificName: string;
  eventDate: string;
  year: number;
  basisOfRecord: string;
  datasetKey: string;
  license: string;
  rightsHolder: string;
  publisher: string;
  locationLabel: string;
  hasMedia: boolean;
}

export interface CellDetailDto extends CellSummaryDto {
  summary: string;
  downloadKey: string;
  occurrences: OccurrenceRecordDto[];
}

export interface SpeciesProfileDto {
  speciesKey: number;
  commonName: string;
  scientificName: string;
  habitat: string;
  status: string;
  note: string;
}

export interface MediaItemDto {
  mediaId: number;
  speciesKey: number;
  title: string;
  type: MediaType;
  thumbnailUrl: string;
  previewUrl: string;
  original: {
    access: "source-link" | "signed";
    href?: string;
  };
  attribution: {
    license: string;
    rightsHolder: string;
    creator: string;
    publisher: string;
  };
  source: {
    identifier: string;
    references: string;
  };
}

export interface ComplianceDataDto {
  downloadKey: string;
  doi: string;
  citation: string;
  rightsSummary: string;
}

export interface CellFiltersDto {
  yearPreset: CellYearPreset;
  requireMedia: boolean;
}
