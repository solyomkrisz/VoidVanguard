/**
 * Kezdobarat magyarazat:
 * Fajl: backend/test/sessions.test.js
 * Szerep: Backend teszt: automatizalt ellenorzes, hogy valtozas utan is helyes maradjon a viselkedes.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import jwt from "jsonwebtoken";

jest.mock("../service/auth.js");

import express from "express";
import supertest from "supertest";
import cookieParser from "cookie-parser";
import sessionsRouter from "../api/sessions.js";
import * as authService from "../service/auth.js";
import * as CustomError from "../common/CustomError.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/sessions", sessionsRouter);
    return supertest(app);
}

function generateToken(payload = {}) {
    return jwt.sign(
        {
            id: "550e8400-e29b-41d4-a716-446655440000",
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

describe("Sessions API - /api/sessions", () => {
    describe("POST / (Login)", () => {
        beforeEach(() => {
            authService.login.mockResolvedValue({
                accessToken: "mock-access-token",
                refreshToken: "mock-refresh-token",
                exp: Math.floor(Date.now() / 1000) + 3600,
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 with access token on successful login", async () => {
                const response = await request
                    .post("/api/sessions")
                    .send({ username: "testuser", password: "TestPass1!" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.result).toHaveProperty("access_token", "mock-access-token");
                expect(authService.login).toHaveBeenCalledWith(
                    expect.objectContaining({ username: "testuser", password: "TestPass1!" })
                );
            });

            it("Should return 200 \"Already logged in\" when a valid access token is provided", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/sessions")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ username: "testuser", password: "TestPass1!" });

                expect(response.statusCode).toBe(200);
                expect(response.body.message).toBe("Already logged in");
                expect(authService.login).not.toHaveBeenCalled();
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if username is empty", async () => {
                const response = await request
                    .post("/api/sessions")
                    .send({ username: "", password: "TestPass1!" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if password is empty", async () => {
                const response = await request
                    .post("/api/sessions")
                    .send({ username: "testuser", password: "" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if username is missing", async () => {
                const response = await request
                    .post("/api/sessions")
                    .send({ password: "TestPass1!" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if password is missing", async () => {
                const response = await request
                    .post("/api/sessions")
                    .send({ username: "testuser" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Authentication errors (400)", () => {
            it("Should return 400 for invalid credentials", async () => {
                authService.login.mockRejectedValueOnce(CustomError.INVALID_CREDENTIALS);

                const response = await request
                    .post("/api/sessions")
                    .send({ username: "wronguser", password: "WrongPass1!" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                authService.login.mockRejectedValueOnce(new Error("Unexpected error"));

                const response = await request
                    .post("/api/sessions")
                    .send({ username: "testuser", password: "TestPass1!" });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("DELETE / (Logout)", () => {
        beforeEach(() => {
            authService.destroyAllSessions.mockResolvedValue(true);
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 without authentication", async () => {
                const response = await request.delete("/api/sessions");

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(authService.destroyAllSessions).not.toHaveBeenCalled();
            });

            it("Should return 200 and destroy sessions when authenticated", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/sessions")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(authService.destroyAllSessions).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: expect.any(String) })
                );
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 if destroyAllSessions throws", async () => {
                authService.destroyAllSessions.mockRejectedValueOnce(new Error("Service error"));

                const token = generateToken();

                const response = await request
                    .delete("/api/sessions")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
