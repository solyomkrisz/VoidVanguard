/*
 * ============================================================
 * USERS.TEST.JS — MAGYARÁZAT
 * ============================================================
 *
 * Ez egy integrációs teszt a /api/users Express route-okhoz.
 * Nem az adatbázist teszteli valóban, hanem azt, hogy az API-réteg
 * helyesen viselkedik-e: jó státuszkódot ad-e vissza, meghívja-e
 * a megfelelő service-függvényt, helyes hibákat dob-e.
 *
 * ------------------------------------------------------------
 * JEST — AZ ALAPOK
 * ------------------------------------------------------------
 *
 * Jest a JavaScript tesztelő framework. Alapfogalmak:
 *
 *   describe()
 *     Teszteket csoportosít. Egymásba lehet ágyazni.
 *     Csak szervezési eszköz — olvashatóvá teszi a kimenetet:
 *       Users API - /api/users
 *         POST / (Register)
 *           Happy paths (200, 201)
 *             ✓ Should return 201 on successful registration
 *
 *   it() / test()
 *     Egy konkrét teszteset. Kap egy leírást és egy async callback-et.
 *
 *   beforeEach()
 *     Minden it() előtt lefut a csoporton belül.
 *     Arra való, hogy az előfeltételeket beállítsuk (pl. mock visszatérési értéke).
 *     Így minden teszt "tiszta lappal" indul.
 *
 *   expect()
 *     Ezzel ellenőrzöd az eredményt. Mintázat: expect(valami).toBe(valami_más)
 *     Használt matcher-ek:
 *       .toBe(201)                   — pontosan egyenlő
 *       .toBe(true)                  — boolean ellenőrzés
 *       .toHaveBeenCalledWith(...)   — mock-on: milyen argumentumokkal hívták meg
 *       .not.toHaveBeenCalled()      — mock-on: egyáltalán nem hívták meg
 *
 * ------------------------------------------------------------
 * JEST MOCK — jest.mock()
 * ------------------------------------------------------------
 *
 *   jest.mock("../service/users.js")
 *
 *   Ez felváltja az egész users.js service modult egy automatikusan
 *   generált mock-kal. Minden exportált függvény (createUser, getUser, stb.)
 *   helyett egy spy függvényt kap, amelyet a tesztekben irányítani lehet.
 *
 *   Miért kell? Mert nem akarunk valódi adatbázist hívni a tesztekből.
 *   Csak azt ellenőrizzük, hogy az API-réteg (router, validáció, hibakezelés)
 *   helyesen működik-e.
 *
 *   A mock-ot beforeEach-ben konfigurálják:
 *     usersService.createUser.mockResolvedValue("new-user-id")
 *       → ha hívják a createUser-t, visszaad egy Promise<"new-user-id">
 *
 *     usersService.createUser.mockRejectedValueOnce({ code: "ER_DUP_ENTRY" })
 *       → EGYSZER rejected Promise-t dob (ER_DUP_ENTRY = MySQL duplikált kulcs hiba)
 *       → "Once" = csak az első hívásnál, utána visszaáll az alapra
 *
 *   FONTOS: a jest.mock() hívást a fájl elejére kell írni (az importok elé is),
 *   mert Jest automatikusan "hoistol" — azaz felhúzza a fájl tetejére futtatás előtt.
 *   Ezért nem okoz gondot, hogy az import utáni sorban áll.
 *
 * ------------------------------------------------------------
 * SUPERTEST
 * ------------------------------------------------------------
 *
 *   A Supertest lehetővé teszi, hogy HTTP kéréseket küldjünk egy Express
 *   alkalmazásnak anélkül, hogy valódi szervert indítanánk.
 *
 *   createApp()
 *     Létrehoz egy mini Express appot a szükséges middleware-ekkel,
 *     majd visszaadja supertest(app)-ként — ez egy HTTP kliens az apphoz.
 *     Nem nyit valódi portot.
 *
 *   Kérés küldése:
 *     request.post("/api/users").send(validBody)
 *       .post("/api/users")                  — POST kérés az URL-re
 *       .send(validBody)                     — request body (automatikusan JSON)
 *       .set("Authorization", `Bearer ...`)  — HTTP fejléc beállítása
 *       .query({ search: "test" })           — query string (?search=test)
 *
 *     A response objektum tartalmazza:
 *       response.statusCode  — HTTP státuszkód (200, 201, 400, stb.)
 *       response.body        — a JSON válasz objektumként
 *
 * ------------------------------------------------------------
 * JWT TOKENEK — generateToken() és generateAdminToken()
 * ------------------------------------------------------------
 *
 *   Valódi JWT tokent generálnak, ugyanazzal az ACCESS_TOKEN_SECRET-tel
 *   amit a szerver is használ. Így az auth middleware valóban elfogadja
 *   a tesztben küldött tokeneket.
 *
 *   generateToken(payload)
 *     Alap user tokent generál (role: 0). A payload-dal felülírható
 *     bármely mező — pl. generateToken({ id: OTHER_USER_ID }) más user-t ad.
 *
 *   generateAdminToken(payload)
 *     Admin tokent generál (role: 1) a generateToken() segítségével.
 *
 * ------------------------------------------------------------
 * A TESZTESETEK STRUKTÚRÁJA
 * ------------------------------------------------------------
 *
 *   Minden végpont (POST, GET, GET /:id, PATCH, DELETE) azonos struktúrában:
 *
 *   Happy paths       — Sikeres eset: jó adattal jó válasz jön
 *   Authorization     — 401 (nincs token), 403 (nincs jogosultság)
 *   Input validation  — 400: hibás bemenetek (rövid username, érvénytelen email)
 *   Conflicts         — 400: duplikált adat (MySQL ER_DUP_ENTRY)
 *   Server errors     — 500: váratlan hiba a service-ben
 *
 * ------------------------------------------------------------
 * EGY KONKRÉT TESZT LÉPÉSEI (példa)
 * ------------------------------------------------------------
 *
 *   it("Should return 403 if regular user tries to access another user's data", async () => {
 *       const token = generateToken({ id: OTHER_USER_ID }); // 1. más user tokenje
 *
 *       const response = await request
 *           .get(`/api/users/${TEST_USER_ID}`)              // 2. lekéri TEST_USER adatait
 *           .set("Authorization", `Bearer ${token}`);       // 3. de OTHER_USER tokennel
 *
 *       expect(response.statusCode).toBe(403);              // 4. elvárja a 403-at
 *       expect(response.body.success).toBe(false);          // 5. és hogy success: false legyen
 *   });
 *
 *   Ez teszteli, hogy a router helyesen védi-e az adatot:
 *   más user nem láthatja a profilját.
 *
 * ------------------------------------------------------------
 * ÖSSZEFOGLALÁS
 * ------------------------------------------------------------
 *
 *   Jest          = teszt framework (describe, it, expect, mock, beforeEach)
 *   Supertest     = HTTP kérés szimulátor Express apphoz (nem kell valódi szerver)
 *   jest.mock()   = service helyettesítése fake függvényekkel (nincs DB hívás)
 *   mockResolvedValue      = mock mit adjon vissza sikeres esetben
 *   mockRejectedValueOnce  = mock mit dobjon hibaesetben (csak egyszer)
 *   generateToken          = valódi JWT token a teszthez, az auth middleware elfogadja
 *
 * ============================================================
 */
import jwt from "jsonwebtoken";

jest.mock("../service/users.js");

import express from "express";
import supertest from "supertest";
import cookieParser from "cookie-parser";
import usersRouter from "../api/users.js";
import * as usersService from "../service/users.js";
import * as CustomError from "../common/CustomError.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_USER_ID = "660e8400-e29b-41d4-a716-446655440001";

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/users", usersRouter);
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

function generateAdminToken(payload = {}) {
    return generateToken({ role: 1, ...payload });
}

const request = createApp();

describe("Users API - /api/users", () => {
    describe("POST / (Register)", () => {
        const validBody = {
            username: "newuser",
            email: "newuser@example.com",
            password: "TestPass1!",
            passwordConfirm: "TestPass1!",
        };

        beforeEach(() => {
            usersService.createUser.mockResolvedValue("new-user-id");
        });

        describe("Happy paths (200, 201)", () => {
            it("Should return 201 on successful registration", async () => {
                const response = await request.post("/api/users").send(validBody);

                expect(response.statusCode).toBe(201);
                expect(response.body.success).toBe(true);
                expect(usersService.createUser).toHaveBeenCalledWith(
                    expect.objectContaining({ username: "newuser", email: "newuser@example.com" })
                );
            });

            it("Should return 200 when already logged in (registration not available)", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/users")
                    .set("Authorization", `Bearer ${token}`)
                    .send(validBody);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(usersService.createUser).not.toHaveBeenCalled();
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if username is too short (< 3 characters)", async () => {
                const response = await request
                    .post("/api/users")
                    .send({ ...validBody, username: "ab" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if username is too long (> 20 characters)", async () => {
                const response = await request
                    .post("/api/users")
                    .send({ ...validBody, username: "a".repeat(21) });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if username contains invalid characters (e.g. dash)", async () => {
                const response = await request
                    .post("/api/users")
                    .send({ ...validBody, username: "invalid-user" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if email is invalid", async () => {
                const response = await request
                    .post("/api/users")
                    .send({ ...validBody, email: "not-an-email" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if password is too short (< 8 characters)", async () => {
                const response = await request
                    .post("/api/users")
                    .send({ ...validBody, password: "Ab1!", passwordConfirm: "Ab1!" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if password does not meet complexity requirements", async () => {
                const response = await request
                    .post("/api/users")
                    .send({ ...validBody, password: "simplepassword", passwordConfirm: "simplepassword" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if passwords do not match", async () => {
                const response = await request
                    .post("/api/users")
                    .send({ ...validBody, passwordConfirm: "DifferentPass1!" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Conflicts (400)", () => {
            it("Should return 400 if username or email is already taken", async () => {
                usersService.createUser.mockRejectedValueOnce({ code: "ER_DUP_ENTRY" });

                const response = await request.post("/api/users").send(validBody);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                usersService.createUser.mockRejectedValueOnce(new Error("Unexpected error"));

                const response = await request.post("/api/users").send(validBody);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("GET / (Search)", () => {
        beforeEach(() => {
            usersService.searchFor.mockResolvedValue({
                results: [{ id: TEST_USER_ID, username: "testuser" }],
                page: 1,
                limit: 6,
                total: 1,
                hasNext: false,
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 with results when search query is provided", async () => {
                const response = await request.get("/api/users").query({ search: "test" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(usersService.searchFor).toHaveBeenCalledWith(
                    expect.objectContaining({ query: "test" })
                );
            });

            it("Should use page and limit parameters when provided", async () => {
                const response = await request
                    .get("/api/users")
                    .query({ search: "test", page: 2, limit: 10 });

                expect(response.statusCode).toBe(200);
                expect(usersService.searchFor).toHaveBeenCalledWith(
                    expect.objectContaining({ query: "test", page: 2, limit: 10 })
                );
            });

            it("Should work without authentication", async () => {
                const response = await request.get("/api/users").query({ search: "test" });

                expect(response.statusCode).toBe(200);
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if no search query is provided", async () => {
                const response = await request.get("/api/users");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
                expect(usersService.searchFor).not.toHaveBeenCalled();
            });

            it("Should return 400 if search query is only whitespace", async () => {
                const response = await request.get("/api/users").query({ search: "   " });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("GET /:id (Get user by ID)", () => {
        beforeEach(() => {
            usersService.getUser.mockResolvedValue({
                id: TEST_USER_ID,
                username: "testuser",
                email: "test@example.com",
                role: 0,
            });
        });

        describe("Authorization (401, 403)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request.get(`/api/users/${TEST_USER_ID}`);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
            });

            it("Should return 403 if regular user tries to access another user's data", async () => {
                const token = generateToken({ id: OTHER_USER_ID });

                const response = await request
                    .get(`/api/users/${TEST_USER_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(403);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if the user ID is not a valid UUID", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .get("/api/users/not-a-valid-uuid")
                    .set("Authorization", `Bearer ${adminToken}`);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 when admin requests any user", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .get(`/api/users/${TEST_USER_ID}`)
                    .set("Authorization", `Bearer ${adminToken}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(usersService.getUser).toHaveBeenCalledWith({ userId: TEST_USER_ID });
            });

            it("Should return 200 when a user requests their own data", async () => {
                const token = generateToken({ id: TEST_USER_ID });

                const response = await request
                    .get(`/api/users/${TEST_USER_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                usersService.getUser.mockRejectedValueOnce(new Error("Unexpected error"));
                const adminToken = generateAdminToken();

                const response = await request
                    .get(`/api/users/${TEST_USER_ID}`)
                    .set("Authorization", `Bearer ${adminToken}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("PATCH / (Update user)", () => {
        beforeEach(() => {
            usersService.updateUser.mockResolvedValue(true);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request
                    .patch("/api/users")
                    .send({ username: "newname" });

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if username is too short", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/users")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ username: "ab" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if username is too long", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/users")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ username: "a".repeat(21) });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if email is invalid", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/users")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ email: "not-valid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if password and passwordConfirm do not match", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/users")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ password: "NewPass1!", passwordConfirm: "DifferentPass1!" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful username update", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/users")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ username: "updatedname" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(usersService.updateUser).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TEST_USER_ID })
                );
            });

            it("Should return 200 on successful email update", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/users")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ email: "newemail@example.com" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        describe("Conflicts and server errors (400, 500)", () => {
            it("Should return 400 if username or email is already taken", async () => {
                usersService.updateUser.mockRejectedValueOnce({ code: "ER_DUP_ENTRY" });
                const token = generateToken();

                const response = await request
                    .patch("/api/users")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ username: "existinguser" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                usersService.updateUser.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .patch("/api/users")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ username: "updatedname" });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("DELETE / (Delete user)", () => {
        beforeEach(() => {
            usersService.deleteUser.mockResolvedValue(null);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request.delete("/api/users");

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful deletion", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/users")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(usersService.deleteUser).toHaveBeenCalledWith({ id: TEST_USER_ID });
            });
        });

        describe("Server errors (404, 500)", () => {
            it("Should return 404 if user is not found", async () => {
                usersService.deleteUser.mockRejectedValueOnce(CustomError.USER_NOT_FOUND);
                const token = generateToken();

                const response = await request
                    .delete("/api/users")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(404);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                usersService.deleteUser.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .delete("/api/users")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
