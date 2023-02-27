import { binaryToHex, createUniqueId } from "../../src/util/crypto";

test("binary -> hex conversion works", () => {
  expect(binaryToHex("")).toBe("");
  expect(binaryToHex("abc")).toBe("616263");
  expect(binaryToHex("\x00\x01\x02\x03")).toBe("00010203");
});

test("binary -> hex conversion works", () => {
  expect(binaryToHex("")).toBe("");
  expect(binaryToHex("abc")).toBe("616263");
  expect(binaryToHex("\x00\x01\x02\x03")).toBe("00010203");
});

test("unique id does not conflict", () => {
  const memory: Record<string, boolean> = {};
  const turns = 10000;
  for (let turn = 0; turn < turns; turn++) {
    const key = createUniqueId();
    expect(memory[key]).toBe(undefined);
  }
});

test("unique id bit distribution is even", () => {
  const count: number[] = "?"
    .repeat(64)
    .split("")
    .map(() => 0);
  // run statistics
  const turns = 23333;
  for (let turn = 0; turn < turns; turn++) {
    const key = createUniqueId();
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        const val = key.codePointAt(i)!;
        if (val & (1 << j)) count[i * 8 + j] += 1;
      }
  }
  // check result if it lies in the correct range
  const threshold = 0.03;
  const minDiff = Math.abs(turns - Math.min(...count) * 2) / turns;
  const maxDiff = Math.abs(turns - Math.max(...count) * 2) / turns;
  expect(minDiff).toBeLessThan(threshold);
  expect(maxDiff).toBeLessThan(threshold);
});
