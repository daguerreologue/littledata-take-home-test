import { Pool } from "pg";
import { StringRepr } from "./utils/types/doctypes";
import { Fn } from "./utils/types/common";
import pg from "pg";
import { AppError } from "./utils/errors/common";
import { propsToCamel } from "./utils/data-manipulation/struct-types";


export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "filemeta",
});

// leave timestamps unparsed into Dates by default
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, (val: string) => val);
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (val: string) => val);
// parse bigints (OID 20 = int8) as JS BigInts
pg.types.setTypeParser(20, BigInt);
// conversely, force BigInts to serialize as strings
(BigInt.prototype as any).toPostgres = function () {
  return this.toString();
}

export const db = {
  query: async <
    Result extends object,
    Params extends any[] = any[]
  >(query: StringRepr<'SQL query'>, opts?: {
    params?: Params,
    onEmptyResult?: Fn<[], Result[]>,
    camelise?: boolean
  }) => {
    const { params, onEmptyResult, camelise = true } = opts ?? {};
    try {
      const { rows } = await pool.query<Result>(query, params);
      if (!rows) {
        if (onEmptyResult) {
          return onEmptyResult();
        } else {
          throw new AppError("empty database query result set", { query, params });
        }
      }
      return camelise
        ? rows.map(propsToCamel) as Result[]
        : rows;
    } catch (error) {
      throw new AppError("error during database query", { error, query, params });
    }
  },
  close: pool.end
}