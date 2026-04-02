export type MediaType = "StillImage";

export interface TopSpecies {
  speciesKey: number;
  scientificName: string;
  commonName: string;
  count: number;
}

export interface CellSummary {
  h3: string;
  center: {
    lon: number;
    lat: number;
  };
  region: string;
  occurrenceCount: number;
  speciesCount: number;
  topSpecies: TopSpecies[];
}

export interface OccurrenceRecord {
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

export interface CellDetail extends CellSummary {
  summary: string;
  downloadKey: string;
  occurrences: OccurrenceRecord[];
}

export interface SpeciesProfile {
  speciesKey: number;
  commonName: string;
  scientificName: string;
  habitat: string;
  status: string;
  note: string;
}

export interface MediaItem {
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

export interface ComplianceData {
  downloadKey: string;
  doi: string;
  citation: string;
  rightsSummary: string;
}

export interface CellFilters {
  yearPreset: "all" | "recent" | "classic";
  requireMedia: boolean;
}

