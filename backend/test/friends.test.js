/**
 * Kezdobarat magyarazat:
 * Fajl: backend/test/friends.test.js
 * Szerep: Backend teszt: automatizalt ellenorzes, hogy valtozas utan is helyes maradjon a viselkedes.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import jwt from "jsonwebtoken";

jest.mock("../service/friends.js");

import express from "express";
import supertest from "supertest";
import cookieParser from "cookie-parser";
import friendsRouter from "../api/friends.js";
import * as friendsService from "../service/friends.js";
import * as CustomError from "../common/CustomError.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_USER_ID = "660e8400-e29b-41d4-a716-446655440001";

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/friends", friendsRouter);
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

const mockFriendList = {
    results: [{ id: OTHER_USER_ID, username: "friend1" }],
    page: 1,
    limit: 20,
    total: 1,
    hasNext: false,
};

const mockSummary = {
    friendCount: 5,
    isFriend: true,
    isPending: false,
};

const request = createApp();

describe("Friends API - /api/friends", () => {
    describe("GET / (List friends)", () => {
        beforeEach(() => {
            friendsService.lazySelectByTarget.mockResolvedValue(mockFriendList);
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 without authentication", async () => {
                const response = await request
                    .get("/api/friends")
                    .query({ targetId: OTHER_USER_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(friendsService.lazySelectByTarget).toHaveBeenCalledWith(
                    expect.objectContaining({ targetId: OTHER_USER_ID })
                );
            });

            it("Should return 200 with authentication", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .query({ targetId: OTHER_USER_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it("Should pass page and limit parameters to the service", async () => {
                const response = await request
                    .get("/api/friends")
                    .query({ targetId: OTHER_USER_ID, page: 2, limit: 10 });

                expect(response.statusCode).toBe(200);
                expect(friendsService.lazySelectByTarget).toHaveBeenCalledWith(
                    expect.objectContaining({ page: 2, limit: 10 })
                );
            });

            it("Should pass status and direction filters to the service", async () => {
                const response = await request
                    .get("/api/friends")
                    .query({ targetId: OTHER_USER_ID, status: "pending", direction: "sent" });

                expect(response.statusCode).toBe(200);
                expect(friendsService.lazySelectByTarget).toHaveBeenCalledWith(
                    expect.objectContaining({ status: "pending", direction: "sent" })
                );
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                friendsService.lazySelectByTarget.mockRejectedValueOnce(new Error("Unexpected error"));

                const response = await request
                    .get("/api/friends")
                    .query({ targetId: OTHER_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("GET /:id (Get friend summary)", () => {
        beforeEach(() => {
            friendsService.getSummary.mockResolvedValue(mockSummary);
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 without authentication", async () => {
                const response = await request.get(`/api/friends/${OTHER_USER_ID}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(friendsService.getSummary).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: OTHER_USER_ID })
                );
            });

            it("Should return 200 with authentication", async () => {
                const token = generateToken();

                const response = await request
                    .get(`/api/friends/${OTHER_USER_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it("Should pass include query parameter to the service", async () => {
                const response = await request
                    .get(`/api/friends/${OTHER_USER_ID}`)
                    .query({ include: "friendCount,isFriend" });

                expect(response.statusCode).toBe(200);
                expect(friendsService.getSummary).toHaveBeenCalledWith(
                    expect.objectContaining({ include: ["friendCount", "isFriend"] })
                );
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                friendsService.getSummary.mockRejectedValueOnce(new Error("Unexpected error"));

                const response = await request.get(`/api/friends/${OTHER_USER_ID}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("POST / (Send friend request)", () => {
        beforeEach(() => {
            friendsService.sendFriendRequest.mockResolvedValue(null);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request
                    .post("/api/friends")
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(friendsService.sendFriendRequest).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful friend request", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(friendsService.sendFriendRequest).toHaveBeenCalledWith(
                    expect.objectContaining({
                        initiatorId: TEST_USER_ID,
                        recipientId: OTHER_USER_ID,
                    })
                );
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if userId is missing", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({});

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if userId is not a valid UUID", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Service errors (400, 404, 500)", () => {
            it("Should return 404 if the target user does not exist", async () => {
                friendsService.sendFriendRequest.mockRejectedValueOnce({ code: "ER_NO_REFERENCED_ROW_2" });
                const token = generateToken();

                const response = await request
                    .post("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(404);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if a friend request or friendship already exists", async () => {
                friendsService.sendFriendRequest.mockRejectedValueOnce({ code: "ER_DUP_ENTRY" });
                const token = generateToken();

                const response = await request
                    .post("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 if user tries to friend themselves", async () => {
                friendsService.sendFriendRequest.mockRejectedValueOnce(CustomError.CANNOT_FRIEND_YOURSELF);
                const token = generateToken();

                const response = await request
                    .post("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: TEST_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                friendsService.sendFriendRequest.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .post("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("PATCH / (Accept friend request)", () => {
        beforeEach(() => {
            friendsService.acceptFriendRequest.mockResolvedValue(null);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request
                    .patch("/api/friends")
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(friendsService.acceptFriendRequest).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful accept", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(friendsService.acceptFriendRequest).toHaveBeenCalledWith(
                    expect.objectContaining({
                        initiatorId: OTHER_USER_ID,
                        recipientId: TEST_USER_ID,
                    })
                );
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if userId is missing", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({});

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if userId is not a valid UUID", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Service errors (500)", () => {
            it("Should return 500 if the friend request does not exist", async () => {
                friendsService.acceptFriendRequest.mockRejectedValueOnce(CustomError.UNABLE_TO_ACCEPT_FR_REQ);
                const token = generateToken();

                const response = await request
                    .patch("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                friendsService.acceptFriendRequest.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .patch("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("DELETE / (Remove friend)", () => {
        beforeEach(() => {
            friendsService.deleteFriendship.mockResolvedValue(null);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request
                    .delete("/api/friends")
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(friendsService.deleteFriendship).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful removal", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(friendsService.deleteFriendship).toHaveBeenCalledWith(
                    expect.objectContaining({
                        aId: TEST_USER_ID,
                        bId: OTHER_USER_ID,
                    })
                );
            });
        });

        describe("Service errors (500)", () => {
            it("Should return 500 if the friendship does not exist", async () => {
                friendsService.deleteFriendship.mockRejectedValueOnce(CustomError.UNABLE_TO_REMOVE_FRIEND);
                const token = generateToken();

                const response = await request
                    .delete("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                friendsService.deleteFriendship.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .delete("/api/friends")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ userId: OTHER_USER_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
