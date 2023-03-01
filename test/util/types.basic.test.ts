import { Err, None, Ok, Option, Result, Some } from "../../src/util/types";

test("result types work", () => {
  expect(checkResult(Ok(123))).toBe(1230);
  expect(checkResult(Err("abcdefg"))).toBe(70000);
});

function checkResult(result: Result<number, string>): number {
  if (!result.ok) return result.err.length * 10000;
  return result.val * 10;
}

test("option types work", () => {
  expect(checkOption(None())).toBe(-233);
  expect(checkOption(Some(23))).toBe(639);
});

function checkOption(option: Option<number>): number {
  if (!option.has) return -233;
  return option.val + 616;
}
