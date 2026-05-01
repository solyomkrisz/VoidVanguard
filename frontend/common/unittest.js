import { result } from "/common/common.js";

export const results = new result().init();

/** Group related tests together */
export function describe(feature, callback, log = false) {
  log && console.log(`Feature: ${feature}`);
  results.features++;
  callback();
}

/** A specific test */
export function it(expectation, callback, log = false) {
  log && console.log(`Test: ${expectation}`);
  results.tests++;
  callback();
}

export function expect(result, log = false) {
  return {
    result,
    toBe: (value) => {
      if (result === value) {
        log && console.log("Test passed");
        results.successful++;
        return true;
      } else {
        log &&
          console.error(
            `Test failed: Expected the result to be ${value}, but got ${result}`,
          );
        results.failed++;
        return false;
      }
    },
  };
}
