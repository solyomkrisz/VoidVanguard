function result() {
  this.init = function () {
    this.features = 0;
    this.tests = 0;
    this.failed = 0;
    this.successful = 0;

    return this;
  };

  this.see = function () {
    const maxLabelLength = Math.max(
      "Features tested".length,
      "Total tests".length,
      "Successful".length,
      "Failed".length,
    );

    const addPadding = function (label) {
      return label + ".".repeat(maxLabelLength - label.length + 3);
    };

    console.log(`\n${addPadding("Features tested")}: ${this.features}`);
    console.log(`${addPadding("Total tests")}: ${this.tests}`);
    console.log(
      `${addPadding("Successful")}: ${this.tests} / ${this.successful} (${((this.successful / this.tests) * 100).toFixed(2)}%)`,
    );
    console.log(
      `${addPadding("Failed")}: ${this.tests} / ${this.failed} (${((this.failed / this.tests) * 100).toFixed(2)}%)\n`,
    );
  };

  this.init();
}

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
