import jwt from "jsonwebtoken";

jest.mock("../service/tokens.js");
jest.mock("../service/auth.js");

import express from "express";
import supertest from "supertest";
import cookieParser from "cookie-parser";
import tokensRouter from "../api/tokens.js";
import * as tokensService from "../service/tokens.js";
import * as authService from "../service/auth.js";
import * as CustomError from "../common/CustomError.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const SESSION_ID = "770e8400-e29b-41d4-a716-446655440002";
const MOCK_REFRESH_TOKEN = "mock-refresh-token-value";

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/tokens", tokensRouter);
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

describe("Tokens API - /api/tokens", () => {
    describe("GET / (Refresh access token)", () => {
        beforeEach(() => {
            tokensService.refresh.mockResolvedValue("new-access-token");
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 with a new access token when refresh_token cookie is present", async () => {
                const response = await request
                    .get("/api/tokens")
                    .set("Cookie", `refresh_token=${MOCK_REFRESH_TOKEN}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.result).toHaveProperty("access_token", "new-access-token");
                expect(tokensService.refresh).toHaveBeenCalledWith(MOCK_REFRESH_TOKEN);
            });
        });

        describe("Missing token (400)", () => {
            it("Should return 400 if no refresh_token cookie is present", async () => {
                const response = await request.get("/api/tokens");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
                expect(tokensService.refresh).not.toHaveBeenCalled();
            });
        });

        describe("Service errors (400, 401, 500)", () => {
            it("Should return 401 if the refresh token has expired", async () => {
                tokensService.refresh.mockRejectedValueOnce(CustomError.REFRESH_TOKEN_EXPIRED);

                const response = await request
                    .get("/api/tokens")
                    .set("Cookie", `refresh_token=${MOCK_REFRESH_TOKEN}`);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if the refresh token is invalid", async () => {
                tokensService.refresh.mockRejectedValueOnce(CustomError.INVALID_TOKEN);

                const response = await request
                    .get("/api/tokens")
                    .set("Cookie", `refresh_token=${MOCK_REFRESH_TOKEN}`);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                tokensService.refresh.mockRejectedValueOnce(new Error("Unexpected error"));

                const response = await request
                    .get("/api/tokens")
                    .set("Cookie", `refresh_token=${MOCK_REFRESH_TOKEN}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("GET /active (List active sessions)", () => {
        beforeEach(() => {
            tokensService.lazySelectByUserId.mockResolvedValue({
                results: [{ id: SESSION_ID, createdAt: new Date().toISOString() }],
                page: 1,
                limit: 20,
                total: 1,
                hasNext: false,
            });
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request.get("/api/tokens/active");

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(tokensService.lazySelectByUserId).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 with active sessions when authenticated", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/tokens/active")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(tokensService.lazySelectByUserId).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TEST_USER_ID })
                );
            });

            it("Should pass page and limit parameters to the service", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/tokens/active")
                    .set("Authorization", `Bearer ${token}`)
                    .query({ page: 2, limit: 10 });

                expect(response.statusCode).toBe(200);
                expect(tokensService.lazySelectByUserId).toHaveBeenCalledWith(
                    expect.objectContaining({ page: 2, limit: 10 })
                );
            });

            it("Should pass the current refresh_token cookie to the service", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/tokens/active")
                    .set("Authorization", `Bearer ${token}`)
                    .set("Cookie", `refresh_token=${MOCK_REFRESH_TOKEN}`);

                expect(response.statusCode).toBe(200);
                expect(tokensService.lazySelectByUserId).toHaveBeenCalledWith(
                    expect.objectContaining({ currentRefreshToken: MOCK_REFRESH_TOKEN })
                );
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                tokensService.lazySelectByUserId.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .get("/api/tokens/active")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("DELETE /:id (Revoke session by ID)", () => {
        beforeEach(() => {
            tokensService.revokeSessionById.mockResolvedValue(null);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request.delete(`/api/tokens/${SESSION_ID}`);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(tokensService.revokeSessionById).not.toHaveBeenCalled();
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if the session ID is not a valid UUID", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/tokens/not-a-valid-uuid")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful session revocation", async () => {
                const token = generateToken();

                const response = await request
                    .delete(`/api/tokens/${SESSION_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(tokensService.revokeSessionById).toHaveBeenCalledWith(
                    expect.objectContaining({
                        id: SESSION_ID,
                        userId: TEST_USER_ID,
                    })
                );
            });

            it("Should pass the current refresh_token cookie to the service", async () => {
                const token = generateToken();

                const response = await request
                    .delete(`/api/tokens/${SESSION_ID}`)
                    .set("Authorization", `Bearer ${token}`)
                    .set("Cookie", `refresh_token=${MOCK_REFRESH_TOKEN}`);

                expect(response.statusCode).toBe(200);
                expect(tokensService.revokeSessionById).toHaveBeenCalledWith(
                    expect.objectContaining({ currentRefreshToken: MOCK_REFRESH_TOKEN })
                );
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                tokensService.revokeSessionById.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .delete(`/api/tokens/${SESSION_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("DELETE / (Revoke current session)", () => {
        beforeEach(() => {
            authService.logout.mockImplementation(() => {});
            tokensService.revokeSessionByToken.mockResolvedValue(null);
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 even without a refresh_token cookie", async () => {
                const response = await request.delete("/api/tokens");

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(tokensService.revokeSessionByToken).not.toHaveBeenCalled();
            });

            it("Should return 200 and revoke the token when refresh_token cookie is present", async () => {
                const response = await request
                    .delete("/api/tokens")
                    .set("Cookie", `refresh_token=${MOCK_REFRESH_TOKEN}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(tokensService.revokeSessionByToken).toHaveBeenCalledWith(MOCK_REFRESH_TOKEN);
            });

            it("Should work without authentication", async () => {
                const response = await request.delete("/api/tokens");

                expect(response.statusCode).toBe(200);
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                tokensService.revokeSessionByToken.mockRejectedValueOnce(new Error("Unexpected error"));

                const response = await request
                    .delete("/api/tokens")
                    .set("Cookie", `refresh_token=${MOCK_REFRESH_TOKEN}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
