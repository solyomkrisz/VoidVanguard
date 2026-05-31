/**
 * Kezdobarat magyarazat:
 * Fajl: backend/test/scores.test.js
 * Szerep: Backend teszt: automatizalt ellenorzes, hogy valtozas utan is helyes maradjon a viselkedes.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import jwt from "jsonwebtoken";

jest.mock("../service/scores.js");

import express from "express";
import supertest from "supertest";
import cookieParser from "cookie-parser";
import scoresRouter from "../api/scores.js";
import * as scoresService from "../service/scores.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const DEFAULT_PARAMS = "page=1&limit=20";

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/scores", scoresRouter);
    return supertest(app);
}

function generateToken(payload = {}) {
    return jwt.sign(
        {
            id: TEST_USER_ID,
            username: "testuser",
            role: 0,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            ...payload,
        },
        ACCESS_TOKEN_SECRET
    );
}

const request = createApp();

describe("Scores API - /api/scores", () => {
    describe("GET /leaderboard (Ranglista lekérése)", () => {
        const mockScores = [
            { username: "player1", score: 9999 },
            { username: "player2", score: 8888 },
        ];

        beforeEach(() => {
            scoresService.lazySelectBestUserScores.mockResolvedValue(mockScores);
        });

        describe("Happy paths (200)", () => {
            it("Visszaadja a ranglistát autentikáció nélkül (public nézet)", async () => {
                const response = await request.get(`/api/scores/leaderboard?${DEFAULT_PARAMS}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.result).toEqual(mockScores);
                expect(scoresService.lazySelectBestUserScores).toHaveBeenCalledWith(
                    expect.objectContaining({ view: "public", page: 1, limit: 20 })
                );
            });

            it("Visszaadja a ranglistát autentikált felhasználónak (public nézet)", async () => {
                const token = generateToken();

                const response = await request
                    .get(`/api/scores/leaderboard?${DEFAULT_PARAMS}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it("Visszaadja a ranglistát private nézetben autentikált felhasználónak", async () => {
                const token = generateToken();

                const response = await request
                    .get(`/api/scores/leaderboard?${DEFAULT_PARAMS}&view=private`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(scoresService.lazySelectBestUserScores).toHaveBeenCalledWith(
                    expect.objectContaining({ view: "private", userId: TEST_USER_ID })
                );
            });

            it("Elfogad egyéni page és limit query paramétereket", async () => {
                const response = await request.get("/api/scores/leaderboard?page=3&limit=10");

                expect(response.statusCode).toBe(200);
                expect(scoresService.lazySelectBestUserScores).toHaveBeenCalledWith(
                    expect.objectContaining({ page: 3, limit: 10 })
                );
            });
        });

        describe("Autentikációs hibák (401)", () => {
            it("Visszaad 401-et ha private nézetet kér le autentikáció nélkül", async () => {
                const response = await request.get(
                    `/api/scores/leaderboard?${DEFAULT_PARAMS}&view=private`
                );

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(scoresService.lazySelectBestUserScores).not.toHaveBeenCalled();
            });
        });

        describe("Validációs hibák (400)", () => {
            it("Visszaad 400-at érvénytelen view paraméter esetén", async () => {
                const response = await request.get(
                    `/api/scores/leaderboard?${DEFAULT_PARAMS}&view=invalid`
                );

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at hiányzó page paraméter esetén", async () => {
                const response = await request.get("/api/scores/leaderboard?limit=20");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at hiányzó limit paraméter esetén", async () => {
                const response = await request.get("/api/scores/leaderboard?page=1");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at negatív limit esetén", async () => {
                const response = await request.get("/api/scores/leaderboard?page=1&limit=-1");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at negatív page esetén", async () => {
                const response = await request.get("/api/scores/leaderboard?page=-1&limit=20");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Szerver hibák (500)", () => {
            it("Visszaad 500-at ha a service váratlan hibát dob", async () => {
                scoresService.lazySelectBestUserScores.mockRejectedValueOnce(new Error("DB hiba"));

                const response = await request.get(`/api/scores/leaderboard?${DEFAULT_PARAMS}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("GET / (Saját legjobb eredmény és rang lekérése)", () => {
        const mockScore = { score: 5000, rank: 42 };

        beforeEach(() => {
            scoresService.getBestScoreWithRankForUser.mockResolvedValue(mockScore);
        });

        describe("Happy paths (200)", () => {
            it("Visszaadja a felhasználó legjobb eredményét és rangját", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/scores")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.result).toEqual(mockScore);
                expect(scoresService.getBestScoreWithRankForUser).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TEST_USER_ID })
                );
            });
        });

        describe("Autentikációs hibák (401)", () => {
            it("Visszaad 401-et token nélkül", async () => {
                const response = await request.get("/api/scores");

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(scoresService.getBestScoreWithRankForUser).not.toHaveBeenCalled();
            });
        });

        describe("Szerver hibák (500)", () => {
            it("Visszaad 500-at ha a service váratlan hibát dob", async () => {
                scoresService.getBestScoreWithRankForUser.mockRejectedValueOnce(new Error("DB hiba"));
                const token = generateToken();

                const response = await request
                    .get("/api/scores")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
