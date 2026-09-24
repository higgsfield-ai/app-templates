import { getModel } from "./catalog";
import { mapByPaths } from "./catalog/mappers";
import type { GenerationPlane, PlatformRequest } from "./catalog/types";

export function toPlatform(plane: GenerationPlane): PlatformRequest {
  const model = getModel(plane.model);
  if (model.toPlatform) return model.toPlatform(plane);
  if (model.paths) return mapByPaths(plane, model.paths);
  throw new Error(`No platform map for ${plane.model}`);
}
