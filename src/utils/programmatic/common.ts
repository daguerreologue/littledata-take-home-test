import { Fn } from "../types/common";

export const iden = <A>(x: A) => x;

export class LazyValue<A> {
  constructor(private readonly thunk: () => A) { }

  then = <B>(f: Fn<[A], B>) =>
    new LazyValue(() => f(this.thunk()));

  valueOf = () =>
    this.thunk();
}

export const given = <A>(value: A) =>
  new LazyValue(() => value);

export const applyIf = <A, B>(pred: Fn<[A], boolean>, f: Fn<[A], B>) =>
  (x: A) =>
    pred(x)
      ? f(x)
      : x;
