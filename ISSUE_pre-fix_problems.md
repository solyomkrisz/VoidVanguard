# Bug: A profil/friend/admin folyamat több ponton inkonzisztens és zajos hibakezelést ad

## Leírás
A javítások előtt több, egymást erősítő probléma volt jelen a profil-, barátkezelési, auth- és adminfelületeken. Ezek UX-romlást, nehezen követhető állapotváltásokat és karbantarthatósági gondokat okoztak.

## Főbb problémák (javítás előtti állapot)

1. A Settings panel nem zárt be logout után
- Kijelentkezés után a beállításpanel bizonyos esetekben nyitva maradt.
- Ez félrevezető UI-állapotot okozott (nem autentikált nézet + nyitott auth-függő panel).

2. Túlzottan zajos toast hibák session probe esetben
- Vendég/állapotellenőrző (`POST /api/sessions` hitelesítési adatok nélkül) hívások validációs hibái is toastként jelentek meg.
- Következmény: felesleges „Username must not be empty” típusú zaj a felhasználónak.

3. A profil avatar-kezelése szétszórt és részben legacy mezőre épült
- Az avatar frissítés/olvasás folyamata helyenként nem volt egységesen az `avatar` mezőre szervezve.
- Az `avatar_index` logika több ponton visszamaradt, ami adatmodell-inkonzisztenciát okozott.

4. A friend/blocked listák `userId` kezelése túlkomplikált volt
- Ugyanarra a célra több alternatív mezőt próbált a kód (`user_id`, `userId`, `recipient_id`, `initiator_id`, `blocked_id`, `id`).
- Ez felesleges védelmi logikát, nehezebb hibakeresést és törékenyebb event-folyamot eredményezett.

5. Az admin panel listák vizuálisan és viselkedésben eltértek
- Incoming/Outgoing/Manage friends/Blocked listák sor- és pagination stílusa nem volt konzisztens.
- Példák: blokkolt lista pagination nem középre rendezett, eltérő spacing/padding, eltérő sorstruktúra.

6. Inline shadow CSS miatt alacsony karbantarthatóság
- Nagy, komponensbe ágyazott style blokkok nehezítették a változtatásokat.
- Nehezen újrafelhasználható, nehezen diffelhető, magasabb regressziós rizikó.

## Reprodukció (javítás előtti állapot)

### A) Settings panel logout hiba
1. Bejelentkezés után nyisd meg a Settings panelt.
2. Jelentkezz ki.
3. A panel esetenként látható marad.

### B) Session probe toast zaj
1. Vendégként nyisd meg az auth/profile flow-t.
2. Fusson le automatikus session ellenőrzés credential nélkül.
3. Megjelenik validációs hiba toast (nem felhasználói akció miatt).

### C) Friend/blocked action ID bizonytalanság
1. Különböző listákról triggerelj friend/block actiont.
2. Eltérő adat shape-eknél ID-feloldási guardok aktiválódnak.
3. Hibalog/no-op viselkedés jelenhet meg.

## Elvárt viselkedés
- Logoutkor minden auth-függő panel determinisztikusan bezár.
- Session probe hibák ne generáljanak felhasználói zajt.
- Avatar-kezelés kizárólag konzisztens `avatar` mezőre épüljön.
- Friend/blocked eventek egységes, stabil `user_id` pipeline-t használjanak.
- Admin listák közös UI-nyelvet és azonos interakciós viselkedést kövessenek.
- Komponens stílusok külön CSS fájlokba kerüljenek, ne inline shadow style tömbökben legyenek.

## Üzleti/UX hatás
- Bizalomcsökkenés a felülettel szemben (inkonzisztens állapotok).
- Többlet support/hibajegy zaj (felhasználótól független validációs toast hibák).
- Lassabb fejlesztési iteráció (nehezebben karbantartható stílus és ID-feloldási logika).

## Prioritás
High

## Megjegyzés
Ez a jegy a javítások előtti problémahalmazt dokumentálja, mint összefoglaló root-cause issue.
