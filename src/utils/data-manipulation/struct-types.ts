export type CamelToSnake<S extends string> =
  S extends `${infer T}${infer U}`
  ? U extends Uncapitalize<U>
  ? `${Lowercase<T>}${CamelToSnake<U>}`
  : `${Lowercase<T>}_${CamelToSnake<Uncapitalize<U>>}`
  : S;

export type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S;

export type Camelise<R> = { [K in keyof R as SnakeToCamel<string & K>]: R[K] };
export type Snakify<R> = { [K in keyof R as CamelToSnake<string & K>]: R[K] };

export const propsToCamel = <R extends Record<string, any>>(r: R): Camelise<R> => {
  const result: any = {};
  for (const k in r) {
    const camelKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = r[k];
  }
  return result;
}

export const propsToSnake = <R extends Record<string, any>>
  (r: R): Snakify<R> => {
  const result: any = {};
  for (const key in r) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = r[key];
  }
  return result;
};

export const select = <R extends object, K extends keyof R>
  (props: K[], r: R): R[K][] => {
  const results = [] as R[K][];
  for (const k of props) {
    results.push(r[k]);
  }
  return results;
};

export const pick = <R extends object, K extends keyof R>
  (props: K[], r: R) => {
  const results = {} as Pick<R, K>;
  for (const k of props) {
    results[k] = r[k];
  }
  return results;
}