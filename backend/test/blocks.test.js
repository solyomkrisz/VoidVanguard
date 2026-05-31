/**
 * Kezdobarat magyarazat:
 * Fajl: backend/test/blocks.test.js
 * Szerep: Backend teszt: automatizalt ellenorzes, hogy valtozas utan is helyes maradjon a viselkedes.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import jwt from "jsonwebtoken";

jest.mock("../service/blocks.js");

import express from "express";
import supertest from "supertest";
import cookieParser from "cookie-parser";
import blocksRouter from "../api/blocks.js";
import * as blocksService from "../service/blocks.js";
import * as CustomError from "../common/CustomError.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_USER_ID = "660e8400-e29b-41d4-a716-446655440001";

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/blocks", blocksRouter);
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

describe("Blocks API - /api/blocks", () => {
    describe("GET / (List blocked users)", () => {
        beforeEach(() => {
            blocksService.lazySelectByTarget.mockResolvedValue({
                results: [{ id: OTHER_USER_ID, username: "blockeduser" }],
                page: 1,
                limit: 20,
                total: 1,
                hasNext: false,
            });
        });

        describe("Authorization (401, 403)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request
                    .get("/api/blocks")
                    .query({ targetId: TEST_USER_ID });

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(blocksService.lazySelectByTarget).not.toHaveBeenCalled();
            });

            it("Should return 403 if user tries to view another user's block list", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .query({ targetId: OTHER_USER_ID });

                expect(response.statusCode).toBe(403);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if targetId is missing", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/blocks")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
                expect(blocksService.lazySelectByTarget).not.toHaveBeenCalled();
            });

            it("Should return 400 if targetId is not a valid UUID", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .query({ targetId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 when user requests their own block list", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .query({ targetId: TEST_USER_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(blocksService.lazySelectByTarget).toHaveBeenCalledWith(
                    expect.objectContaining({ targetId: TEST_USER_ID })
                );
            });

            it("Should return 200 when admin requests any user's block list", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .get("/api/blocks")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .query({ targetId: OTHER_USER_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it("Should pass page and limit parameters to the service", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .query({ targetId: TEST_USER_ID, page: 2, limit: 10 });

                expect(response.statusCode).toBe(200);
                expect(blocksService.lazySelectByTarget).toHaveBeenCalledWith(
                    expect.objectContaining({ page: 2, limit: 10 })
                );
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                blocksService.lazySelectByTarget.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .get("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .query({ targetId: TEST_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("GET /:id (Block status summary)", () => {
        beforeEach(() => {
            blocksService.getSummary.mockResolvedValue({ isBlocked: true, isBlockedBy: false });
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request.get(`/api/blocks/${OTHER_USER_ID}`);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(blocksService.getSummary).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 with block summary when authenticated", async () => {
                const token = generateToken();

                const response = await request
                    .get(`/api/blocks/${OTHER_USER_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(blocksService.getSummary).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: OTHER_USER_ID,
                        requesterId: TEST_USER_ID,
                    })
                );
            });

            it("Should pass include query parameter to the service", async () => {
                const token = generateToken();

                const response = await request
                    .get(`/api/blocks/${OTHER_USER_ID}`)
                    .set("Authorization", `Bearer ${token}`)
                    .query({ include: "isBlocked,isBlockedBy" });

                expect(response.statusCode).toBe(200);
                expect(blocksService.getSummary).toHaveBeenCalledWith(
                    expect.objectContaining({ include: ["isBlocked", "isBlockedBy"] })
                );
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                blocksService.getSummary.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .get(`/api/blocks/${OTHER_USER_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("POST / (Block user)", () => {
        beforeEach(() => {
            blocksService.blockUser.mockResolvedValue(null);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request
                    .post("/api/blocks")
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(blocksService.blockUser).not.toHaveBeenCalled();
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if userId is missing", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .send({});

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if userId is not a valid UUID", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Happy paths (201)", () => {
            it("Should return 201 on successful block", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(201);
                expect(response.body.success).toBe(true);
                expect(blocksService.blockUser).toHaveBeenCalledWith(
                    expect.objectContaining({
                        blockerId: TEST_USER_ID,
                        blockedId: OTHER_USER_ID,
                    })
                );
            });
        });

        describe("Service errors (400, 500)", () => {
            it("Should return 400 if the user is already blocked", async () => {
                blocksService.blockUser.mockRejectedValueOnce({ code: "ER_DUP_ENTRY" });
                const token = generateToken();

                const response = await request
                    .post("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 if user tries to block themselves", async () => {
                blocksService.blockUser.mockRejectedValueOnce(CustomError.CANNOT_BLOCK_YOURSELF);
                const token = generateToken();

                const response = await request
                    .post("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: TEST_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                blocksService.blockUser.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .post("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("DELETE / (Unblock user)", () => {
        beforeEach(() => {
            blocksService.unblockUser.mockResolvedValue(null);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request
                    .delete("/api/blocks")
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(blocksService.unblockUser).not.toHaveBeenCalled();
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if userId is missing", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .send({});

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if userId is not a valid UUID", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful unblock", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(blocksService.unblockUser).toHaveBeenCalledWith(
                    expect.objectContaining({
                        blockerId: TEST_USER_ID,
                        blockedId: OTHER_USER_ID,
                    })
                );
            });
        });

        describe("Service errors (500)", () => {
            it("Should return 500 if the block does not exist", async () => {
                blocksService.unblockUser.mockRejectedValueOnce(CustomError.UNABLE_TO_UNBLOCK);
                const token = generateToken();

                const response = await request
                    .delete("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                blocksService.unblockUser.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .delete("/api/blocks")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
