/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/initcomponents.js
 * Szerep: Egy helyen behuzza a custom element modulokat, hogy oldalletolteskor regisztralodjanak.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
// Ezeknel az importoknal a side effect a lenyeg: a modulok sajat magukat definialjak custom elementkent.
import _ from "./component/auth/LogoutButton.js";
import _1 from "./component/auth/AccountQuickManager.js";
