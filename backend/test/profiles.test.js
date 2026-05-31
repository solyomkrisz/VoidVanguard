/**
 * Kezdobarat magyarazat:
 * Fajl: backend/test/profiles.test.js
 * Szerep: Backend teszt: automatizalt ellenorzes, hogy valtozas utan is helyes maradjon a viselkedes.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import jwt from "jsonwebtoken";

jest.mock("../service/profiles.js");

import express from "express";
import supertest from "supertest";
import cookieParser from "cookie-parser";
import profilesRouter from "../api/profiles.js";
import * as profilesService from "../service/profiles.js";
import * as CustomError from "../common/CustomError.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_USER_ID = "660e8400-e29b-41d4-a716-446655440001";

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/profiles", profilesRouter);
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

const mockProfile = {
    id: TEST_USER_ID,
    display_name: "Test User",
    description: "Test description",
    avatar: "/image/defaultPfp.png",
    visibility: "public",
};

const request = createApp();

describe("Profiles API - /api/profiles", () => {
    describe("GET /:id (Get profile by user ID)", () => {
        beforeEach(() => {
            profilesService.getProfile.mockResolvedValue(mockProfile);
            profilesService.getFullProfile.mockResolvedValue(mockProfile);
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 without authentication", async () => {
                const response = await request.get(`/api/profiles/${TEST_USER_ID}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(profilesService.getProfile).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TEST_USER_ID, requesterId: null })
                );
            });

            it("Should return 200 with authentication", async () => {
                const token = generateToken();

                const response = await request
                    .get(`/api/profiles/${TEST_USER_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(profilesService.getProfile).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TEST_USER_ID, requesterId: TEST_USER_ID })
                );
            });

            it("Should return 200 with admin view when requested by admin", async () => {
                const adminToken = generateAdminToken();

                const response = await request
                    .get(`/api/profiles/${TEST_USER_ID}`)
                    .set("Authorization", `Bearer ${adminToken}`)
                    .query({ view: "admin" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(profilesService.getFullProfile).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TEST_USER_ID })
                );
            });
        });

        describe("Authorization (400, 403)", () => {
            it("Should return 400 if the user ID is not a valid UUID", async () => {
                const response = await request.get("/api/profiles/not-a-valid-uuid");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 403 if regular user requests admin view", async () => {
                const token = generateToken();

                const response = await request
                    .get(`/api/profiles/${TEST_USER_ID}`)
                    .set("Authorization", `Bearer ${token}`)
                    .query({ view: "admin" });

                expect(response.statusCode).toBe(403);
                expect(response.body.success).toBe(false);
            });

            it("Should return 403 if unauthenticated user requests admin view", async () => {
                const response = await request
                    .get(`/api/profiles/${TEST_USER_ID}`)
                    .query({ view: "admin" });

                expect(response.statusCode).toBe(403);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Server errors (404, 500)", () => {
            it("Should return 404 if profile is not found", async () => {
                profilesService.getProfile.mockRejectedValueOnce(CustomError.PROFILE_NOT_FOUND);

                const response = await request.get(`/api/profiles/${TEST_USER_ID}`);

                expect(response.statusCode).toBe(404);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                profilesService.getProfile.mockRejectedValueOnce(new Error("Unexpected error"));

                const response = await request.get(`/api/profiles/${TEST_USER_ID}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("GET / (Search profiles)", () => {
        beforeEach(() => {
            profilesService.searchFor.mockResolvedValue({
                results: [mockProfile],
                page: 1,
                limit: 20,
                total: 1,
                hasNext: false,
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 with results when search query is provided", async () => {
                const response = await request.get("/api/profiles").query({ search: "test" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(profilesService.searchFor).toHaveBeenCalledWith(
                    expect.objectContaining({ query: "test" })
                );
            });

            it("Should work without authentication", async () => {
                const response = await request.get("/api/profiles").query({ search: "test" });

                expect(response.statusCode).toBe(200);
            });

            it("Should use page and limit parameters when provided", async () => {
                const response = await request
                    .get("/api/profiles")
                    .query({ search: "test", page: 2, limit: 10 });

                expect(response.statusCode).toBe(200);
                expect(profilesService.searchFor).toHaveBeenCalledWith(
                    expect.objectContaining({ query: "test", page: 2, limit: 10 })
                );
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if no search query is provided", async () => {
                const response = await request.get("/api/profiles");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
                expect(profilesService.searchFor).not.toHaveBeenCalled();
            });

            it("Should return 400 if search query is only whitespace", async () => {
                const response = await request.get("/api/profiles").query({ search: "   " });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                profilesService.searchFor.mockRejectedValueOnce(new Error("Unexpected error"));

                const response = await request.get("/api/profiles").query({ search: "test" });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("POST / (Create profile)", () => {
        const validBody = {
            display_name: "My Profile",
        };

        beforeEach(() => {
            profilesService.createProfile.mockResolvedValue(mockProfile);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request.post("/api/profiles").send(validBody);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(profilesService.createProfile).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful profile creation", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send(validBody);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(profilesService.createProfile).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TEST_USER_ID })
                );
            });

            it("Should return 200 with optional avatar from allowed list", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, avatar: "/image/defaultPfp.png" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it("Should return 200 with optional description", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, description: "A short bio" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it("Should return 200 with valid visibility value", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, visibility: "private" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if display_name is missing", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({});

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if display_name is empty", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ display_name: "" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if display_name exceeds 60 characters", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, display_name: "a".repeat(61) });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if description exceeds 250 characters", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, description: "a".repeat(251) });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if avatar is not from the allowed list", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, avatar: "/image/custom.png" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if visibility is an invalid value", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, visibility: "secret" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Conflicts and server errors (400, 500)", () => {
            it("Should return 400 if a profile already exists for this user", async () => {
                profilesService.createProfile.mockRejectedValueOnce({ code: "ER_DUP_ENTRY" });
                const token = generateToken();

                const response = await request
                    .post("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send(validBody);

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                profilesService.createProfile.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .post("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send(validBody);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("PATCH / (Update profile)", () => {
        beforeEach(() => {
            profilesService.updateProfile.mockResolvedValue(true);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request
                    .patch("/api/profiles")
                    .send({ display_name: "New Name" });

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(profilesService.updateProfile).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful display_name update", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ display_name: "New Name" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(profilesService.updateProfile).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TEST_USER_ID })
                );
            });

            it("Should return 200 on successful visibility update", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ visibility: "friends-only" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it("Should return 200 on successful avatar update", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ avatar: "/image/defaultPfp3.png" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it("Should return 200 on successful description update", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ description: "Updated bio" });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if display_name is empty string", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ display_name: "" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if display_name exceeds 60 characters", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ display_name: "a".repeat(61) });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if description exceeds 250 characters", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ description: "a".repeat(251) });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if avatar is not from the allowed list", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ avatar: "/image/custom.png" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if visibility is an invalid value", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ visibility: "hidden" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Server errors (404, 500)", () => {
            it("Should return 404 if profile is not found", async () => {
                profilesService.updateProfile.mockRejectedValueOnce(CustomError.PROFILE_NOT_FOUND);
                const token = generateToken();

                const response = await request
                    .patch("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ display_name: "New Name" });

                expect(response.statusCode).toBe(404);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                profilesService.updateProfile.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .patch("/api/profiles")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ display_name: "New Name" });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("DELETE / (Delete profile)", () => {
        beforeEach(() => {
            profilesService.deleteProfile.mockResolvedValue(null);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request.delete("/api/profiles");

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(profilesService.deleteProfile).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful deletion", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/profiles")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(profilesService.deleteProfile).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: TEST_USER_ID })
                );
            });
        });

        describe("Server errors (404, 500)", () => {
            it("Should return 404 if profile is not found", async () => {
                profilesService.deleteProfile.mockRejectedValueOnce(CustomError.PROFILE_NOT_FOUND);
                const token = generateToken();

                const response = await request
                    .delete("/api/profiles")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(404);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                profilesService.deleteProfile.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .delete("/api/profiles")
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
