/**
 * Kezdobarat magyarazat:
 * Fajl: backend/test/passwordresets.test.js
 * Szerep: Backend teszt: automatizalt ellenorzes, hogy valtozas utan is helyes maradjon a viselkedes.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
jest.mock("../service/passwordresets.js");

import express from "express";
import supertest from "supertest";
import cookieParser from "cookie-parser";
import passwordResetsRouter from "../api/passwordresets.js";
import * as passwordResetsService from "../service/passwordresets.js";
import * as CustomError from "../common/CustomError.js";

const VALID_TOKEN = "a".repeat(40);
const VALID_PASSWORD = "TestPass1!";

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/reset-password", passwordResetsRouter);
    return supertest(app);
}

const request = createApp();

describe("Password Resets API - /api/reset-password", () => {
    describe("POST /request (Jelszó-visszaállítás kérése)", () => {
        beforeEach(() => {
            passwordResetsService.createForUserWithEmail.mockResolvedValue(null);
        });

        describe("Happy paths (200)", () => {
            it("Visszaad 200-at érvényes email esetén", async () => {
                const response = await request
                    .post("/api/reset-password/request")
                    .field("email", "test@example.com");

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(passwordResetsService.createForUserWithEmail).toHaveBeenCalledWith(
                    expect.objectContaining({ email: "test@example.com" })
                );
            });

            it("Visszaad 404-et ha a felhasználó nem létezik", async () => {
                passwordResetsService.createForUserWithEmail.mockRejectedValueOnce(
                    CustomError.USER_NOT_FOUND
                );

                const response = await request
                    .post("/api/reset-password/request")
                    .field("email", "nemletezik@example.com");

                expect(response.statusCode).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Validációs hibák (400)", () => {
            it("Visszaad 400-at érvénytelen email esetén", async () => {
                const response = await request
                    .post("/api/reset-password/request")
                    .field("email", "nem-valid-email");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
                expect(passwordResetsService.createForUserWithEmail).not.toHaveBeenCalled();
            });

            it("Visszaad 400-at hiányzó email esetén", async () => {
                const response = await request
                    .post("/api/reset-password/request");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Szerver hibák (500)", () => {
            it("Visszaad 500-at ha a service váratlan hibát dob", async () => {
                passwordResetsService.createForUserWithEmail.mockRejectedValueOnce(
                    new Error("DB hiba")
                );

                const response = await request
                    .post("/api/reset-password/request")
                    .field("email", "test@example.com");

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("POST /confirm (Jelszó visszaállítása)", () => {
        beforeEach(() => {
            passwordResetsService.resetPassword.mockResolvedValue(null);
        });

        describe("Happy paths (200)", () => {
            it("Visszaad 200-at érvényes adatokkal", async () => {
                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("token", VALID_TOKEN)
                    .field("password", VALID_PASSWORD)
                    .field("passwordConfirm", VALID_PASSWORD);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(passwordResetsService.resetPassword).toHaveBeenCalledWith(
                    expect.objectContaining({ token: VALID_TOKEN, password: VALID_PASSWORD })
                );
            });
        });

        describe("Validációs hibák (400)", () => {
            it("Visszaad 400-at hiányzó token esetén", async () => {
                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("password", VALID_PASSWORD)
                    .field("passwordConfirm", VALID_PASSWORD);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at ha a token túl rövid (< 40 karakter)", async () => {
                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("token", "a".repeat(39))
                    .field("password", VALID_PASSWORD)
                    .field("passwordConfirm", VALID_PASSWORD);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at ha a token túl hosszú (> 100 karakter)", async () => {
                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("token", "a".repeat(101))
                    .field("password", VALID_PASSWORD)
                    .field("passwordConfirm", VALID_PASSWORD);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at ha a token érvénytelen karaktereket tartalmaz", async () => {
                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("token", "a".repeat(39) + "!")
                    .field("password", VALID_PASSWORD)
                    .field("passwordConfirm", VALID_PASSWORD);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at ha a jelszó túl rövid (< 8 karakter)", async () => {
                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("token", VALID_TOKEN)
                    .field("password", "Ab1!")
                    .field("passwordConfirm", "Ab1!");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at ha a jelszóból hiányzik a nagybetű", async () => {
                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("token", VALID_TOKEN)
                    .field("password", "testpass1!")
                    .field("passwordConfirm", "testpass1!");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at ha a jelszóból hiányzik a szám", async () => {
                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("token", VALID_TOKEN)
                    .field("password", "TestPass!!")
                    .field("passwordConfirm", "TestPass!!");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at ha a jelszóból hiányzik a speciális karakter", async () => {
                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("token", VALID_TOKEN)
                    .field("password", "TestPass12")
                    .field("passwordConfirm", "TestPass12");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at ha a két jelszó nem egyezik", async () => {
                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("token", VALID_TOKEN)
                    .field("password", VALID_PASSWORD)
                    .field("passwordConfirm", "MasikJelszo1!");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Visszaad 400-at hiányzó jelszó esetén", async () => {
                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("token", VALID_TOKEN)
                    .field("passwordConfirm", VALID_PASSWORD);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Érvénytelen / lejárt token hibák (400)", () => {
            it("Visszaad 400-at ha a token érvénytelen", async () => {
                passwordResetsService.resetPassword.mockRejectedValueOnce(
                    CustomError.INVALID_RESET_TOKEN
                );

                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("token", VALID_TOKEN)
                    .field("password", VALID_PASSWORD)
                    .field("passwordConfirm", VALID_PASSWORD);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Szerver hibák (500)", () => {
            it("Visszaad 500-at ha a service váratlan hibát dob", async () => {
                passwordResetsService.resetPassword.mockRejectedValueOnce(
                    new Error("DB hiba")
                );

                const response = await request
                    .post("/api/reset-password/confirm")
                    .field("token", VALID_TOKEN)
                    .field("password", VALID_PASSWORD)
                    .field("passwordConfirm", VALID_PASSWORD);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
