import { LocationType } from '../../../common/constants/inventory.constant';

export const LOCATION_TYPES = [
  LocationType.ZONE,
  LocationType.RACK,
  LocationType.BIN,
] as const;

export type LocationTypeLiteral = (typeof LOCATION_TYPES)[number];
