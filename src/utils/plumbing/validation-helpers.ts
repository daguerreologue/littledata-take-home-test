import * as zod from "zod";

export const coercedBigInt =
  zod.union([zod.bigint(), zod.number().int()]).transform(BigInt);

export const coercedToLowerCaseSha256 =
  zod.string()
    .regex(/^[A-Fa-f0-9]{64}$/, { message: "invalid SHA-256 checksum" })
    .transform(s => s.toLowerCase());