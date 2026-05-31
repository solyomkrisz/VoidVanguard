/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/test/functional/run.js
 * Szerep: Frontend teszt: kliens oldali funkciok es feluleti viselkedes ellenorzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
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

fetchMock3.install();
await run3();
results3.see();
fetchMock3.restore();
