import {
  run as run1,
  results as results1,
  fetchMock as fetchMock1,
} from "/test/functional/core.js";

import {
  run as run2,
  results as results2,
  fetchMock as fetchMock2,
} from "/test/functional/appmodal.js";

await run1();
results1.see();
fetchMock1.restore();

await run2();
results2.see();
fetchMock2.restore();
