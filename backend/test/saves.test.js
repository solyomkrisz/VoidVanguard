import jwt from "jsonwebtoken";

jest.mock("../service/saves.js");

import express from "express";
import supertest from "supertest";
import cookieParser from "cookie-parser";
import savesRouter from "../api/saves.js";
import * as savesService from "../service/saves.js";
import * as CustomError from "../common/CustomError.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const TEST_GAME_ID = "660e8400-e29b-41d4-a716-446655440001";

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/saves", savesRouter);
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

describe("Saves API - /api/saves", () => {
    describe("GET / (Saves listázása)", () => {
        const mockSaves = [
            { game_id: TEST_GAME_ID, save_name: "Első mentés", is_finished: false },
        ];

        beforeEach(() => {
            savesService.lazySelectByUserId.mockResolvedValue(mockSaves);
        });

        describe("Happy paths (200)", () => {
            it("Visszaadja a mentések listáját autentikált felhasználónak", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/saves")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.result).toEqual(mockSaves);
                expect(savesService.lazySelectByUserId).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TEST_USER_ID, page: 1, limit: 20 })
                );
            });

            it("Elfogad egyéni page és limit query paramétereket", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/saves?page=2&limit=5")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(savesService.lazySelectByUserId).toHaveBeenCalledWith(
                    expect.objectContaining({ page: 2, limit: 5 })
                );
            });
        });

        describe("Autentikációs hibák (401)", () => {
            it("Visszaad 401-et token nélkül", async () => {
                const response = await request.get("/api/saves");

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Szerver hibák (500)", () => {
            it("Visszaad 500-at ha a service dob egy hibát", async () => {
                savesService.lazySelectByUserId.mockRejectedValueOnce(new Error("DB hiba"));
                const token = generateToken();

                const response = await request
                    .get("/api/saves")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("GET /:id (Egy mentés lekérése)", () => {
        const mockSave = { game_id: TEST_GAME_ID, save_name: "Első mentés", game_state: "{}" };

        beforeEach(() => {
            savesService.selectUserSave.mockResolvedValue(mockSave);
        });

        describe("Happy paths (200)", () => {
            it("Visszaadja a mentést érvényes UUID-vel", async () => {
                const token = generateToken();

                const response = await request
                    .get(`/api/saves/${TEST_GAME_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.result).toEqual(mockSave);
                expect(savesService.selectUserSave).toHaveBeenCalledWith(
                    expect.objectContaining({ gameId: TEST_GAME_ID, userId: TEST_USER_ID })
                );
            });
        });

        describe("Validációs hibák (400)", () => {
            it("Visszaad 400-at érvénytelen UUID esetén", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/saves/nem-valid-uuid")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Autentikációs hibák (401)", () => {
            it("Visszaad 401-et token nélkül", async () => {
                const response = await request.get(`/api/saves/${TEST_GAME_ID}`);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Szerver hibák (500)", () => {
            it("Visszaad 500-at ha a service dob egy hibát", async () => {
                savesService.selectUserSave.mockRejectedValueOnce(new Error("DB hiba"));
                const token = generateToken();

                const response = await request
                    .get(`/api/saves/${TEST_GAME_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("PATCH / (Mentés frissítése)", () => {
        beforeEach(() => {
            savesService.updateSave.mockResolvedValue({ game_id: TEST_GAME_ID });
        });

        describe("Happy paths (200)", () => {
            it("Frissíti a mentést érvényes adatokkal", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", TEST_GAME_ID)
                    .field("save_name", "Új név");

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(savesService.updateSave).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TEST_USER_ID })
                );
            });

            it("Frissíti a mentést csak game_id-vel (opcionális mezők nélkül)", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", TEST_GAME_ID);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        describe("Validációs hibák (400)", () => {
            it("Visszaad 400-at hiányzó game_id esetén", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("save_name", "Teszt");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at érvénytelen game_id esetén", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", "nem-uuid");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at ha save_name túl rövid (< 3 karakter)", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", TEST_GAME_ID)
                    .field("save_name", "ab");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at ha save_name túl hosszú (> 20 karakter)", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", TEST_GAME_ID)
                    .field("save_name", "a".repeat(21));

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at érvénytelen game_state esetén", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", TEST_GAME_ID)
                    .field("game_state", "nem-valid-json");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Autentikációs hibák (401)", () => {
            it("Visszaad 401-et token nélkül", async () => {
                const response = await request
                    .patch("/api/saves")
                    .field("game_id", TEST_GAME_ID);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Szerver hibák (500)", () => {
            it("Visszaad 500-at ha a service dob egy hibát", async () => {
                savesService.updateSave.mockRejectedValueOnce(new Error("DB hiba"));
                const token = generateToken();

                const response = await request
                    .patch("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", TEST_GAME_ID);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("PUT / (Mentés létrehozása vagy felülírása)", () => {
        const validGameState = JSON.stringify({ level: 1, score: 0 });

        beforeEach(() => {
            savesService.saveOrUpdate.mockResolvedValue(TEST_GAME_ID);
        });

        describe("Happy paths (200)", () => {
            it("Elmenti a játékot érvényes adatokkal", async () => {
                const token = generateToken();

                const response = await request
                    .put("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", TEST_GAME_ID)
                    .field("game_state", validGameState);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(savesService.saveOrUpdate).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TEST_USER_ID })
                );
            });
        });

        describe("Validációs hibák (400)", () => {
            it("Visszaad 400-at hiányzó game_id esetén", async () => {
                const token = generateToken();

                const response = await request
                    .put("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_state", validGameState);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at hiányzó game_state esetén", async () => {
                const token = generateToken();

                const response = await request
                    .put("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", TEST_GAME_ID);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at érvénytelen game_state (nem objektum) esetén", async () => {
                const token = generateToken();

                const response = await request
                    .put("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", TEST_GAME_ID)
                    .field("game_state", JSON.stringify([1, 2, 3]));

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Autentikációs hibák (401)", () => {
            it("Visszaad 401-et token nélkül", async () => {
                const response = await request
                    .put("/api/saves")
                    .field("game_id", TEST_GAME_ID)
                    .field("game_state", validGameState);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Szerver hibák (500)", () => {
            it("Visszaad 500-at ha a service dob egy hibát", async () => {
                savesService.saveOrUpdate.mockRejectedValueOnce(new Error("DB hiba"));
                const token = generateToken();

                const response = await request
                    .put("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", TEST_GAME_ID)
                    .field("game_state", validGameState);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("DELETE / (Mentés törlése)", () => {
        beforeEach(() => {
            savesService.deleteSave.mockResolvedValue(true);
        });

        describe("Happy paths (200)", () => {
            it("Törli a mentést érvényes game_id-vel", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", TEST_GAME_ID);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(savesService.deleteSave).toHaveBeenCalledWith(
                    expect.objectContaining({ gameId: TEST_GAME_ID, userId: TEST_USER_ID })
                );
            });
        });

        describe("Validációs hibák (400)", () => {
            it("Visszaad 400-at hiányzó game_id esetén", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/saves")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at érvénytelen game_id esetén", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", "nem-uuid");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Autentikációs hibák (401)", () => {
            it("Visszaad 401-et token nélkül", async () => {
                const response = await request
                    .delete("/api/saves")
                    .field("game_id", TEST_GAME_ID);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Szerver hibák (500)", () => {
            it("Visszaad 500-at ha a service dob egy hibát", async () => {
                savesService.deleteSave.mockRejectedValueOnce(new Error("DB hiba"));
                const token = generateToken();

                const response = await request
                    .delete("/api/saves")
                    .set("Authorization", `Bearer ${token}`)
                    .field("game_id", TEST_GAME_ID);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
