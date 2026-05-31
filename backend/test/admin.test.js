/**
 * Kezdobarat magyarazat:
 * Fajl: backend/test/admin.test.js
 * Szerep: Backend teszt: automatizalt ellenorzes, hogy valtozas utan is helyes maradjon a viselkedes.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import jwt from "jsonwebtoken";

jest.mock("../service/admin.js");

import express from "express";
import supertest from "supertest";
import cookieParser from "cookie-parser";
import adminRouter from "../api/admin.js";
import * as adminService from "../service/admin.js";
import * as CustomError from "../common/CustomError.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const TEST_ADMIN_ID = "550e8400-e29b-41d4-a716-446655440000";
const TARGET_USER_ID = "660e8400-e29b-41d4-a716-446655440001";

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/admin", adminRouter);
    return supertest(app);
}

function generateToken(payload = {}) {
    return jwt.sign(
        {
            id: TEST_ADMIN_ID,
            username: "testadmin",
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

function futureDate(minutesFromNow = 10) {
    return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
}

const request = createApp();

describe("Admin API - /api/admin", () => {
    describe("GET /ban (Get ban status)", () => {
        beforeEach(() => {
            adminService.getBanStatus.mockResolvedValue({ isBanned: false, ban: null });
        });

        describe("Authorization (401, 403)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request
                    .get("/api/admin/ban")
                    .query({ targetUserId: TARGET_USER_ID });

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(adminService.getBanStatus).not.toHaveBeenCalled();
            });

            it("Should return 403 if authenticated as a regular user", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/admin/ban")
                    .set("Authorization", `Bearer ${token}`)
                    .query({ targetUserId: TARGET_USER_ID });

                expect(response.statusCode).toBe(403);
                expect(adminService.getBanStatus).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 with ban status when admin requests it", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .get("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .query({ targetUserId: TARGET_USER_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(adminService.getBanStatus).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TARGET_USER_ID })
                );
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                adminService.getBanStatus.mockRejectedValueOnce(new Error("Unexpected error"));
                const adminToken = generateAdminToken();

                const response = await request
                    .get("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .query({ targetUserId: TARGET_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("GET /bans (List user bans)", () => {
        beforeEach(() => {
            adminService.lazySelectUserBans.mockResolvedValue({
                results: [],
                page: 1,
                limit: 20,
                total: 0,
                hasNext: false,
            });
        });

        describe("Authorization (401, 403)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request
                    .get("/api/admin/bans")
                    .query({ targetUserId: TARGET_USER_ID });

                expect(response.statusCode).toBe(401);
                expect(adminService.lazySelectUserBans).not.toHaveBeenCalled();
            });

            it("Should return 403 if authenticated as a regular user", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/admin/bans")
                    .set("Authorization", `Bearer ${token}`)
                    .query({ targetUserId: TARGET_USER_ID });

                expect(response.statusCode).toBe(403);
                expect(adminService.lazySelectUserBans).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 with ban history when admin requests it", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .get("/api/admin/bans")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .query({ targetUserId: TARGET_USER_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(adminService.lazySelectUserBans).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TARGET_USER_ID })
                );
            });

            it("Should pass page and limit parameters to the service", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .get("/api/admin/bans")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .query({ targetUserId: TARGET_USER_ID, page: 2, limit: 10 });

                expect(response.statusCode).toBe(200);
                expect(adminService.lazySelectUserBans).toHaveBeenCalledWith(
                    expect.objectContaining({ page: 2, limit: 10 })
                );
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                adminService.lazySelectUserBans.mockRejectedValueOnce(new Error("Unexpected error"));
                const adminToken = generateAdminToken();

                const response = await request
                    .get("/api/admin/bans")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .query({ targetUserId: TARGET_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("POST /ban (Ban user)", () => {
        const validBody = {
            userId: TARGET_USER_ID,
        };

        beforeEach(() => {
            adminService.banUser.mockResolvedValue(null);
        });

        describe("Authorization (401, 403)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request.post("/api/admin/ban").send(validBody);

                expect(response.statusCode).toBe(401);
                expect(adminService.banUser).not.toHaveBeenCalled();
            });

            it("Should return 403 if authenticated as a regular user", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${token}`)
                    .send(validBody);

                expect(response.statusCode).toBe(403);
                expect(adminService.banUser).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful permanent ban", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send(validBody);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(adminService.banUser).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: TARGET_USER_ID,
                        createdBy: TEST_ADMIN_ID,
                    })
                );
            });

            it("Should return 200 on successful temporary ban with expiresAt", async () => {
                const adminToken = generateAdminToken();
                const expires = futureDate(10);

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ ...validBody, expiresAt: expires });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it("Should return 200 on ban with optional reason", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ ...validBody, reason: "Violation of rules" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(adminService.banUser).toHaveBeenCalledWith(
                    expect.objectContaining({ reason: "Violation of rules" })
                );
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if userId is missing", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({});

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if userId is not a valid UUID", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ userId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if reason exceeds 60 characters", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ ...validBody, reason: "a".repeat(61) });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if expiresAt is not a valid ISO8601 date", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ ...validBody, expiresAt: "not-a-date" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if expiresAt is less than 5 minutes in the future", async () => {
                const adminToken = generateAdminToken();
                const tooSoon = futureDate(1);

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ ...validBody, expiresAt: tooSoon });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Service errors (400, 500)", () => {
            it("Should return 400 if admin tries to ban themselves", async () => {
                adminService.banUser.mockRejectedValueOnce(CustomError.CANNOT_BAN_YOURSELF);
                const adminToken = generateAdminToken();

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ userId: TEST_ADMIN_ID });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if admin tries to ban a user with equal or higher role", async () => {
                adminService.banUser.mockRejectedValueOnce(CustomError.BAN_HIGHER_ROLE_ERROR);
                const adminToken = generateAdminToken();

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send(validBody);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 404 if the target user does not exist", async () => {
                adminService.banUser.mockRejectedValueOnce(CustomError.USER_NOT_FOUND);
                const adminToken = generateAdminToken();

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send(validBody);

                expect(response.statusCode).toBe(404);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                adminService.banUser.mockRejectedValueOnce(new Error("Unexpected error"));
                const adminToken = generateAdminToken();

                const response = await request
                    .post("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send(validBody);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("DELETE /ban (Unban user)", () => {
        beforeEach(() => {
            adminService.unBanUser.mockResolvedValue(null);
        });

        describe("Authorization (401, 403)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request
                    .delete("/api/admin/ban")
                    .send({ userId: TARGET_USER_ID });

                expect(response.statusCode).toBe(401);
                expect(adminService.unBanUser).not.toHaveBeenCalled();
            });

            it("Should return 403 if authenticated as a regular user", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/admin/ban")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: TARGET_USER_ID });

                expect(response.statusCode).toBe(403);
                expect(adminService.unBanUser).not.toHaveBeenCalled();
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if userId is missing", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .delete("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({});

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if userId is not a valid UUID", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .delete("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ userId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful unban", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .delete("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ userId: TARGET_USER_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(adminService.unBanUser).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: TARGET_USER_ID,
                        revokedBy: TEST_ADMIN_ID,
                    })
                );
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                adminService.unBanUser.mockRejectedValueOnce(new Error("Unexpected error"));
                const adminToken = generateAdminToken();

                const response = await request
                    .delete("/api/admin/ban")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ userId: TARGET_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
