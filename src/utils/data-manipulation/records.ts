import { Fn } from "../types/common";

export const entries = <K extends string | number | symbol, V>
  (r: Record<K, V>) =>
  Object.entries(r) as [K, V][];

export const fromEntries = <K extends string | number | symbol, V>
  (kvps: [K, V][]) =>
  Object.fromEntries(kvps) as Record<K, V>;

export const mapValues = <K extends string | number | symbol, V, W>
  (f: Fn<[V], W>, r: Record<K, V>) =>
  fromEntries(entries(r).map(([k, v]) => [k, f(v)]));