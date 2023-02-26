import { sleep } from "../../src/async/time";
import {
  DefTreeAcceptableClass,
  DefTreeAcceptableInstance,
} from "../../src/deftree/class";
import { expectTypesEq } from "../common";

test("valid classes are accepted", () => {
  class Class {
    private value: number;
    constructor(a: boolean, b: null) {
      this.value = 233;
      return;
    }
    async foo(a: number): Promise<string[]> {
      await sleep(0.1);
      return [];
    }
    async *bar(b: string): AsyncGenerator<Date, number[]> {
      await sleep(0.1);
      yield new Date();
      return [];
    }
  }
  const instance = new Class(true, null);
  expectTypesEq<DefTreeAcceptableClass<typeof Class>, typeof Class>();
  expectTypesEq<DefTreeAcceptableInstance<typeof instance>, typeof instance>();
});

test("can convert non-async class methods", () => {
  class Class {
    private value: number;
    constructor(a: boolean, b: null) {
      this.value = 233;
      return;
    }
    foo(a: number): string[] {
      return [];
    }
    *bar(b: string): Generator<Date, number[]> {
      yield new Date();
      return [];
    }
    async asyncFoo(a: number): Promise<string[]> {
      await sleep(0.1);
      return [];
    }
    async *asyncBar(b: string): AsyncGenerator<Date, number[]> {
      await sleep(0.1);
      yield new Date();
      return [];
    }
  }
  const instance = new Class(true, null);
  expectTypesEq<
    DefTreeAcceptableClass<typeof Class>,
    {
      new (a: boolean, b: null): {
        foo: (a: number) => Promise<string[]>;
        bar: (b: string) => AsyncGenerator<Date, number[]>;
        asyncFoo: (a: number) => Promise<string[]>;
        asyncBar: (b: string) => AsyncGenerator<Date, number[]>;
      };
    }
  >();
  expectTypesEq<
    DefTreeAcceptableInstance<typeof instance>,
    {
      foo: (a: number) => Promise<string[]>;
      bar: (b: string) => AsyncGenerator<Date, number[]>;
      asyncFoo: (a: number) => Promise<string[]>;
      asyncBar: (b: string) => AsyncGenerator<Date, number[]>;
    }
  >();
});

test("empty-constructors & empty-classes are allowed", () => {
  class Class {}
  const instance = new Class();
  expectTypesEq<DefTreeAcceptableClass<typeof Class>, typeof Class>();
  expectTypesEq<DefTreeAcceptableInstance<typeof instance>, typeof instance>();
});

test("rejects invalid classes", () => {
  class Class {
    value: number;
    constructor(a: boolean, b: null) {
      this.value = 233;
      return;
    }
  }
  const instance = new Class(true, null);
  expectTypesEq<DefTreeAcceptableClass<typeof Class>, never>();
  expectTypesEq<DefTreeAcceptableInstance<typeof instance>, never>();
});
