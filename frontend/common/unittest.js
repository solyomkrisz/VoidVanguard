import { result } from "/common/common.js";

export function createTestSuite(title = "Test Suite") {
  const results = new result().init();
  results.title = title;

  /** Group related tests together */
  function describe(feature, callback, log = false) {
    log && console.log(`Feature: ${feature}`);
    results.features++;
    callback();
  }

  /** A specific test */
  function it(expectation, callback, log = false) {
    log && console.log(`Test: ${expectation}`);
    results.tests++;
    callback();
  }

  function expect(result, log = false) {
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

  return {
    results,
    describe,
    it,
    expect,
  };
}
