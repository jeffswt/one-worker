import { DefTreeAcceptableTree } from "../../src/deftree/tree";
import { expectTypesEq } from "../common";

test("valid trees are accepted", () => {
  class AAAA {
    constructor(arg: number) {
      return;
    }
    foo(): string {
      return "123";
    }
  }
  class AAB {
    private theField: number = 0;
    async foo(): Promise<string> {
      return Promise.resolve("123");
    }
    async *bar(): AsyncGenerator<number, void> {
      yield this.theField;
    }
  }
  // the input type
  const tree = {
    a: {
      aa: {
        aaa: {
          aaaa: AAAA,
        },
        aab: AAB,
      },
    },
    b: {
      ba(): number {
        return Math.random();
      },
    },
    *c(ca: number, cb: number[]): Generator<string> {
      yield "";
    },
    async d(da: Record<string, number>, db: Date): Promise<undefined[]> {
      return [];
    },
  };
  // output type expected to be
  type Converted = {
    a: {
      aa: {
        aaa: {
          aaaa: new (arg: number) => {
            foo: () => Promise<string>;
          };
        };
        aab: typeof AAB;
      };
    };
    b: {
      ba: () => Promise<number>;
    };
    c: (ca: number, cb: number[]) => AsyncGenerator<string>;
    d: (da: Record<string, number>, db: Date) => Promise<undefined[]>;
  };
  // they should equal
  expectTypesEq<DefTreeAcceptableTree<typeof tree>, Converted>();
});

test("reject invalid types on the tree", () => {
  class AA {
    publicField: string = "";
    foo(): string {
      return this.publicField;
    }
  }
  // the input type
  const tree = {
    a: {
      aa: AA,
    },
    b: 12345,
    async c() {
      return "";
    },
  };
  // output type expected to be
  type z = DefTreeAcceptableTree<typeof tree>;
  type Converted = {
    a: {
      aa: never;
    };
    b: never;
    c: () => Promise<string>;
  };
  // they should equal
  expectTypesEq<DefTreeAcceptableTree<typeof tree>, Converted>();
});

test("tree can stretch up to 16 levels", async () => {
  class TheClass {
    async foo(): Promise<number> {
      return Promise.resolve(12345);
    }
  }
  // the input type
  const tree = {
    level_0: {
      level_1: {
        level_2: {
          level_3: {
            level_4: {
              level_5: {
                level_6: {
                  level_7: {
                    level_8: {
                      level_9: {
                        level_a: {
                          level_b: {
                            level_c: {
                              level_d: {
                                level_e: {
                                  level_f: {
                                    TheClass,
                                  },
                                  TheClass,
                                },
                                TheClass,
                              },
                              TheClass,
                            },
                            TheClass,
                          },
                          TheClass,
                        },
                        TheClass,
                      },
                      TheClass,
                    },
                    TheClass,
                  },
                  TheClass,
                },
                TheClass,
              },
              TheClass,
            },
            TheClass,
          },
          TheClass,
        },
        TheClass,
      },
      TheClass,
    },
    TheClass,
  };
  // this type is already 'acceptable'
  expectTypesEq<DefTreeAcceptableTree<typeof tree>, typeof tree>();
  // try and get a value to ensure the compiler doesn't fake this equality
  const converted: DefTreeAcceptableTree<typeof tree> = tree;
  const cls =
    new converted.level_0.level_1.level_2.level_3.level_4.level_5.level_6.level_7.level_8.level_9.level_a.level_b.level_c.level_d.level_e.level_f.TheClass();
  expect(await cls.foo()).toBe(12345);
});
