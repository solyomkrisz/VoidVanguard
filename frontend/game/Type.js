/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Type.js
 * Szerep: Kozponti tipuskonstansok a jatekbeli entitasok azonositashoz.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
// Fo entitastipusok.
export const UNKNOWN = 0;
export const MOUSE = 1;
export const PLAYER = 2;
export const ENEMY = 3;
export const BUILDING_BLOCK = 4;
export const PROJECTILE = 5;

// Modellobjektum- es dekoracios tipusok.
export const BLOCK = 48;
export const THRUSTER = 49;
export const NEBULA = 50;

// Specialis, technikai vagy logikai tipusok az utkozes es interakcio jelolesere.
export const NONE = 97;
export const RIGIDBODY = 98;
export const INTERACTION = 99;
