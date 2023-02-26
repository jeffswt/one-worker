import { sleep } from "../../src/async/time";
import {
  DefTreeAcceptableAsyncFunction,
  DefTreeAcceptableAsyncGenerator,
  DefTreeAcceptableFunction,
  DefTreeAcceptableGenerator,
} from "../../src/deftree/func";
import { expectTypesEq } from "../common";

test("functions can be converted to async", () => {
  function foo1() {
    return;
  }
  function foo2(a: number, b: string[]) {
    return new Date();
  }
  expectTypesEq<DefTreeAcceptableFunction<typeof foo1>, () => Promise<void>>();
  expectTypesEq<
    DefTreeAcceptableFunction<typeof foo2>,
    (a: number, b: string[]) => Promise<Date>
  >();
});

test("async functions are accepted in-place", () => {
  async function foo1() {
    return Promise.resolve();
  }
  async function foo2(a: number, b: string[]) {
    return Promise.resolve(new Date());
  }
  expectTypesEq<
    DefTreeAcceptableAsyncFunction<typeof foo1>,
    () => Promise<void>
  >();
  expectTypesEq<
    DefTreeAcceptableAsyncFunction<typeof foo2>,
    (a: number, b: string[]) => Promise<Date>
  >();
});

test("generators can be converted to async", () => {
  function* foo1() {
    yield;
    return;
  }
  function* foo2(a: number, b: string[]) {
    yield [2333];
    return "?";
  }
  expectTypesEq<
    DefTreeAcceptableGenerator<typeof foo1>,
    () => AsyncGenerator<undefined, void>
  >();
  expectTypesEq<
    DefTreeAcceptableGenerator<typeof foo2>,
    (a: number, b: string[]) => AsyncGenerator<number[], string>
  >();
});

test("async generators are accepted in-place", () => {
  async function* foo1() {
    await sleep(0.01);
    yield;
    return;
  }
  async function* foo2(a: number, b: string[]) {
    await sleep(0.01);
    yield [2333];
    return "?";
  }
  expectTypesEq<
    DefTreeAcceptableAsyncGenerator<typeof foo1>,
    () => AsyncGenerator<undefined, void>
  >();
  expectTypesEq<
    DefTreeAcceptableAsyncGenerator<typeof foo2>,
    (a: number, b: string[]) => AsyncGenerator<number[], string>
  >();
});

test("invalid values are rejected by converters", () => {
  const bar = 12345;
  expectTypesEq<DefTreeAcceptableFunction<typeof bar>, never>();
  expectTypesEq<DefTreeAcceptableAsyncFunction<typeof bar>, never>();
  expectTypesEq<DefTreeAcceptableGenerator<typeof bar>, never>();
  expectTypesEq<DefTreeAcceptableAsyncGenerator<typeof bar>, never>();
});
