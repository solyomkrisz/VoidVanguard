/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/General2DCanvas.js
 * Szerep: Statikus 2D vaszon seged racsalapu rajzmuveletekhez.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import RenderingContext2DCanvas from "/game/RenderingContext2DCanvas.js";

// Ez egyetlen kozosan ujrahasznalt 2D canvas-peldany, amikor nem eri meg minden hivasnal uj wrapper objektumot letrehozni.
export const General2DCanvas = new RenderingContext2DCanvas();
