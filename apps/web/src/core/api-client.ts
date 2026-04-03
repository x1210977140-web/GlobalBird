import type {
  ApiErrorDto,
  CellDetailDto,
  CellFiltersDto,
  CellSummaryDto,
  ComplianceDataDto,
  MediaItemDto,
  SpeciesProfileDto,
} from "@global-bird/contracts";

const apiBaseUrl = "/api/v1";

function buildFilterQuery(filters: CellFiltersDto) {
  const params = new URLSearchParams();
  params.set("yearPreset", filters.yearPreset);
  params.set("requireMedia", String(filters.requireMedia));
  return params.toString();
}

async function parseResponse<T>(
  response: Response,
  allowNotFound = false,
): Promise<T | null> {
  if (allowNotFound && response.status === 404) {
    return null;
  }

  if (!response.ok) {
    let message = `请求失败（${response.status}）`;

    try {
      const payload = (await response.json()) as ApiErrorDto;
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Keep the generic message when the error response is not JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function listCells(
  filters: CellFiltersDto,
): Promise<CellSummaryDto[]> {
  const query = buildFilterQuery(filters);
  const response = await fetch(`${apiBaseUrl}/cells?${query}`);
  return (await parseResponse<CellSummaryDto[]>(response)) ?? [];
}

export async function getCellDetail(
  h3: string,
  filters: CellFiltersDto,
): Promise<CellDetailDto | null> {
  const query = buildFilterQuery(filters);
  const response = await fetch(`${apiBaseUrl}/cells/${h3}/occurrences?${query}`);
  return parseResponse<CellDetailDto>(response, true);
}

export async function getSpeciesProfile(
  speciesKey: number,
): Promise<SpeciesProfileDto | null> {
  const response = await fetch(`${apiBaseUrl}/species/${speciesKey}`);
  return parseResponse<SpeciesProfileDto>(response, true);
}

export async function getSpeciesMedia(
  speciesKey: number,
): Promise<MediaItemDto[]> {
  const response = await fetch(`${apiBaseUrl}/species/${speciesKey}/media`);
  return (await parseResponse<MediaItemDto[]>(response, true)) ?? [];
}

export async function getCompliance(
  downloadKey: string,
): Promise<ComplianceDataDto | null> {
  const response = await fetch(`${apiBaseUrl}/compliance/downloads/${downloadKey}`);
  return parseResponse<ComplianceDataDto>(response, true);
}
