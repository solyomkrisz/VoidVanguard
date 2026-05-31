/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/common/unittest.js
 * Szerep: Bongeszos unit teszt segedek egyszeru assertokkal es eredmenykiirassal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { result } from "/common/common.js";

// Kicsi, bongeszoben futo unit-teszt csomagot epít ossze sajat assert helperrel.
export function createTestSuite(title = "Test Suite") {
  const results = new result().init();
  results.title = title;

  // Osszefogo blokkba rendezi az azonos featurehoz tartozo teszteket.
  function describe(feature, callback, log = false) {
    log && console.log(`Feature: ${feature}`);
    results.features++;
    callback();
  }

  // Egyetlen tesztesetet futtat a suite-on belul.
  function it(expectation, callback, log = false) {
    log && console.log(`Test: ${expectation}`);
    results.tests++;
    callback();
  }

  // Minimalis assertion API-t ad, ami kozben frissiti a tesztstatisztikat is.
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
