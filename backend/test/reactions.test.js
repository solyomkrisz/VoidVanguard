/**
 * Kezdobarat magyarazat:
 * Fajl: backend/test/reactions.test.js
 * Szerep: Backend teszt: automatizalt ellenorzes, hogy valtozas utan is helyes maradjon a viselkedes.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import jwt from "jsonwebtoken";

jest.mock("../service/reactions.js");

import express from "express";
import supertest from "supertest";
import cookieParser from "cookie-parser";
import reactionsRouter from "../api/reactions.js";
import * as reactionsService from "../service/reactions.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const TARGET_ID = "880e8400-e29b-41d4-a716-446655440003";

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/reactions", reactionsRouter);
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

describe("Reactions API - /api/reactions", () => {
    describe("GET /:targetId (Get user reaction)", () => {
        beforeEach(() => {
            reactionsService.getUserReaction.mockResolvedValue({ type: "like" });
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request.get(`/api/reactions/${TARGET_ID}`);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(reactionsService.getUserReaction).not.toHaveBeenCalled();
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if targetId is not a valid UUID", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/reactions/not-a-valid-uuid")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 with the user reaction", async () => {
                const token = generateToken();

                const response = await request
                    .get(`/api/reactions/${TARGET_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(reactionsService.getUserReaction).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: TEST_USER_ID,
                        targetId: TARGET_ID,
                    })
                );
            });

            it("Should return 200 with null when the user has no reaction", async () => {
                reactionsService.getUserReaction.mockResolvedValueOnce(null);
                const token = generateToken();

                const response = await request
                    .get(`/api/reactions/${TARGET_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.result).toBeNull();
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                reactionsService.getUserReaction.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .get(`/api/reactions/${TARGET_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("POST / (Create or update reaction)", () => {
        const validBody = {
            targetId: TARGET_ID,
            type: "like",
        };

        beforeEach(() => {
            reactionsService.createUserReaction.mockResolvedValue({ type: "like" });
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request.post("/api/reactions").send(validBody);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(reactionsService.createUserReaction).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful like reaction", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/reactions")
                    .set("Authorization", `Bearer ${token}`)
                    .send(validBody);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(reactionsService.createUserReaction).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: TEST_USER_ID,
                        targetId: TARGET_ID,
                        reactionType: "like",
                    })
                );
            });

            it("Should return 200 on successful dislike reaction", async () => {
                reactionsService.createUserReaction.mockResolvedValueOnce({ type: "dislike" });
                const token = generateToken();

                const response = await request
                    .post("/api/reactions")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, type: "dislike" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(reactionsService.createUserReaction).toHaveBeenCalledWith(
                    expect.objectContaining({ reactionType: "dislike" })
                );
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if targetId is missing", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/reactions")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ type: "like" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if targetId is not a valid UUID", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/reactions")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, targetId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if type is missing", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/reactions")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ targetId: TARGET_ID });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if type is an invalid value", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/reactions")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, type: "love" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                reactionsService.createUserReaction.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .post("/api/reactions")
                    .set("Authorization", `Bearer ${token}`)
                    .send(validBody);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
