import {
  apiErrors,
  cellYearPresets,
  type ApiErrorCode,
  type ApiErrorDto,
  type CellFiltersDto,
} from "@global-bird/contracts";
import type { FastifyInstance, FastifyReply } from "fastify";
import {
  getCellDetail,
  getCompliance,
  getSpeciesProfile,
  listCells,
  listSpeciesMedia,
} from "../mock/repository";

type FiltersQuery = {
  yearPreset?: string;
  requireMedia?: string;
};

type H3Params = {
  h3: string;
};

type SpeciesParams = {
  speciesKey: string;
};

type DownloadParams = {
  downloadKey: string;
};

type ParseResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      code: ApiErrorCode;
      message: string;
    };

function sendApiError(
  reply: FastifyReply,
  requestId: string,
  statusCode: number,
  code: ApiErrorCode,
  message: string,
) {
  const payload: ApiErrorDto = {
    code,
    message,
    requestId,
  };

  return reply.status(statusCode).send(payload);
}

function parseFiltersQuery(query: FiltersQuery): ParseResult<CellFiltersDto> {
  const yearPreset = query.yearPreset ?? "all";
  if (
    !cellYearPresets.includes(
      yearPreset as (typeof cellYearPresets)[number],
    )
  ) {
    return {
      ok: false,
      code: apiErrors.INVALID_ARGUMENT,
      message: "yearPreset must be one of: all, recent, classic",
    };
  }

  const rawRequireMedia = query.requireMedia ?? "false";
  if (rawRequireMedia !== "true" && rawRequireMedia !== "false") {
    return {
      ok: false,
      code: apiErrors.INVALID_ARGUMENT,
      message: "requireMedia must be true or false",
    };
  }

  return {
    ok: true,
    value: {
      yearPreset: yearPreset as CellFiltersDto["yearPreset"],
      requireMedia: rawRequireMedia === "true",
    },
  };
}

function parseSpeciesKey(speciesKey: string): ParseResult<number> {
  const parsed = Number(speciesKey);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return {
      ok: false,
      code: apiErrors.INVALID_ARGUMENT,
      message: "speciesKey must be a positive integer",
    };
  }

  return {
    ok: true,
    value: parsed,
  };
}

export function registerApiRoutes(app: FastifyInstance) {
  app.get<{ Querystring: FiltersQuery }>(
    "/api/v1/cells",
    async (request, reply) => {
      const parsed = parseFiltersQuery(request.query);
      if (!parsed.ok) {
        return sendApiError(
          reply,
          request.id,
          400,
          parsed.code,
          parsed.message,
        );
      }

      return listCells(parsed.value);
    },
  );

  app.get<{ Params: H3Params; Querystring: FiltersQuery }>(
    "/api/v1/cells/:h3/occurrences",
    async (request, reply) => {
      const parsedFilters = parseFiltersQuery(request.query);
      if (!parsedFilters.ok) {
        return sendApiError(
          reply,
          request.id,
          400,
          parsedFilters.code,
          parsedFilters.message,
        );
      }

      const detail = getCellDetail(request.params.h3, parsedFilters.value);
      if (!detail) {
        return sendApiError(
          reply,
          request.id,
          404,
          apiErrors.NOT_FOUND,
          "cell was not found for the current filters",
        );
      }

      return detail;
    },
  );

  app.get<{ Params: SpeciesParams }>(
    "/api/v1/species/:speciesKey",
    async (request, reply) => {
      const parsedSpeciesKey = parseSpeciesKey(request.params.speciesKey);
      if (!parsedSpeciesKey.ok) {
        return sendApiError(
          reply,
          request.id,
          400,
          parsedSpeciesKey.code,
          parsedSpeciesKey.message,
        );
      }

      const profile = getSpeciesProfile(parsedSpeciesKey.value);
      if (!profile) {
        return sendApiError(
          reply,
          request.id,
          404,
          apiErrors.NOT_FOUND,
          "species was not found",
        );
      }

      return profile;
    },
  );

  app.get<{ Params: SpeciesParams }>(
    "/api/v1/species/:speciesKey/media",
    async (request, reply) => {
      const parsedSpeciesKey = parseSpeciesKey(request.params.speciesKey);
      if (!parsedSpeciesKey.ok) {
        return sendApiError(
          reply,
          request.id,
          400,
          parsedSpeciesKey.code,
          parsedSpeciesKey.message,
        );
      }

      const profile = getSpeciesProfile(parsedSpeciesKey.value);
      if (!profile) {
        return sendApiError(
          reply,
          request.id,
          404,
          apiErrors.NOT_FOUND,
          "species was not found",
        );
      }

      return listSpeciesMedia(parsedSpeciesKey.value);
    },
  );

  app.get<{ Params: DownloadParams }>(
    "/api/v1/compliance/downloads/:downloadKey",
    async (request, reply) => {
      const compliance = getCompliance(request.params.downloadKey);
      if (!compliance) {
        return sendApiError(
          reply,
          request.id,
          404,
          apiErrors.NOT_FOUND,
          "download was not found",
        );
      }

      return compliance;
    },
  );
}
