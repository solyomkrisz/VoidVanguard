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

import {
  run as run3,
  results as results3,
  fetchMock as fetchMock3,
} from "/test/functional/blockeduserlist.js";

fetchMock1.install();
await run1();
results1.see();
fetchMock1.restore();

fetchMock2.install();
await run2();
results2.see();
fetchMock2.restore();

fetchMock2.install();
await run3();
results3.see();
fetchMock3.restore();
