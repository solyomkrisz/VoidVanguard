import jwt from "jsonwebtoken";

jest.mock("../service/comments.js");

import express from "express";
import supertest from "supertest";
import cookieParser from "cookie-parser";
import commentsRouter from "../api/comments.js";
import * as commentsService from "../service/comments.js";
import * as CustomError from "../common/CustomError.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const COMMENT_ID = "770e8400-e29b-41d4-a716-446655440002";
const TARGET_ID = "880e8400-e29b-41d4-a716-446655440003";
const PARENT_ID = "990e8400-e29b-41d4-a716-446655440004";

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/comments", commentsRouter);
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

const mockComment = {
    id: COMMENT_ID,
    authorId: TEST_USER_ID,
    targetId: TARGET_ID,
    parentId: null,
    content: "Test comment",
};

const request = createApp();

describe("Comments API - /api/comments", () => {
    describe("GET / (List comments by target)", () => {
        beforeEach(() => {
            commentsService.lazySelectByTarget.mockResolvedValue({
                results: [mockComment],
                page: 1,
                limit: 20,
                total: 1,
                hasNext: false,
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 with comments when targetId is valid", async () => {
                const response = await request.get("/api/comments").query({ targetId: TARGET_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(commentsService.lazySelectByTarget).toHaveBeenCalledWith(
                    expect.objectContaining({ targetId: TARGET_ID })
                );
            });

            it("Should work without authentication", async () => {
                const response = await request.get("/api/comments").query({ targetId: TARGET_ID });

                expect(response.statusCode).toBe(200);
            });

            it("Should work with authentication", async () => {
                const token = generateToken();

                const response = await request
                    .get("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .query({ targetId: TARGET_ID });

                expect(response.statusCode).toBe(200);
            });

            it("Should use page and limit parameters when provided", async () => {
                const response = await request
                    .get("/api/comments")
                    .query({ targetId: TARGET_ID, page: 2, limit: 10 });

                expect(response.statusCode).toBe(200);
                expect(commentsService.lazySelectByTarget).toHaveBeenCalledWith(
                    expect.objectContaining({ page: 2, limit: 10 })
                );
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if targetId is missing", async () => {
                const response = await request.get("/api/comments");

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
                expect(commentsService.lazySelectByTarget).not.toHaveBeenCalled();
            });

            it("Should return 400 if targetId is not a valid UUID", async () => {
                const response = await request.get("/api/comments").query({ targetId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if page is 0 (not a positive integer)", async () => {
                const response = await request
                    .get("/api/comments")
                    .query({ targetId: TARGET_ID, page: 0 });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if limit exceeds 100", async () => {
                const response = await request
                    .get("/api/comments")
                    .query({ targetId: TARGET_ID, limit: 101 });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                commentsService.lazySelectByTarget.mockRejectedValueOnce(new Error("Unexpected error"));

                const response = await request.get("/api/comments").query({ targetId: TARGET_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("GET /:id (Get comment by ID)", () => {
        beforeEach(() => {
            commentsService.select.mockResolvedValue(mockComment);
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 with comment when ID is valid", async () => {
                const response = await request.get(`/api/comments/${COMMENT_ID}`);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(commentsService.select).toHaveBeenCalledWith(
                    expect.objectContaining({ commentId: COMMENT_ID })
                );
            });

            it("Should work without authentication", async () => {
                const response = await request.get(`/api/comments/${COMMENT_ID}`);

                expect(response.statusCode).toBe(200);
            });

            it("Should work with authentication", async () => {
                const token = generateToken();

                const response = await request
                    .get(`/api/comments/${COMMENT_ID}`)
                    .set("Authorization", `Bearer ${token}`);

                expect(response.statusCode).toBe(200);
            });
        });

        describe("Server errors (404, 500)", () => {
            it("Should return 404 if comment is not found", async () => {
                commentsService.select.mockRejectedValueOnce(CustomError.COMMENT_NOT_FOUND);

                const response = await request.get(`/api/comments/${COMMENT_ID}`);

                expect(response.statusCode).toBe(404);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                commentsService.select.mockRejectedValueOnce(new Error("Unexpected error"));

                const response = await request.get(`/api/comments/${COMMENT_ID}`);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("POST / (Create comment)", () => {
        const validBody = {
            targetId: TARGET_ID,
            content: "Hello, this is a test comment!",
        };

        beforeEach(() => {
            commentsService.createComment.mockResolvedValue(COMMENT_ID);
            commentsService.select.mockResolvedValue(mockComment);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request.post("/api/comments").send(validBody);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(commentsService.createComment).not.toHaveBeenCalled();
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful comment creation", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send(validBody);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(commentsService.createComment).toHaveBeenCalledWith(
                    expect.objectContaining({
                        authorId: TEST_USER_ID,
                        targetId: TARGET_ID,
                        content: validBody.content,
                    })
                );
            });

            it("Should return 200 with optional parentId", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, parentId: PARENT_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if targetId is missing", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ content: validBody.content });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if targetId is not a valid UUID", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, targetId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if content is missing", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ targetId: TARGET_ID });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if content is empty", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, content: "" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if content exceeds 500 characters", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, content: "a".repeat(501) });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if parentId is provided but not a valid UUID", async () => {
                const token = generateToken();

                const response = await request
                    .post("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, parentId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Server errors (500)", () => {
            it("Should return 500 on unexpected service error", async () => {
                commentsService.createComment.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .post("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send(validBody);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("PATCH / (Update comment)", () => {
        const validBody = {
            commentId: COMMENT_ID,
            content: "Updated comment content",
        };

        beforeEach(() => {
            commentsService.updateComment.mockResolvedValue(true);
            commentsService.select.mockResolvedValue({ ...mockComment, content: validBody.content });
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request.patch("/api/comments").send(validBody);

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(commentsService.updateComment).not.toHaveBeenCalled();
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if commentId is missing", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ content: validBody.content });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if commentId is not a valid UUID", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, commentId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if content is missing", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ commentId: COMMENT_ID });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if content is empty", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, content: "" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if content exceeds 500 characters", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ ...validBody, content: "a".repeat(501) });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful comment update", async () => {
                const token = generateToken();

                const response = await request
                    .patch("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send(validBody);

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(commentsService.updateComment).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: TEST_USER_ID,
                        commentId: COMMENT_ID,
                        content: validBody.content,
                    })
                );
            });
        });

        describe("Server errors (404, 500)", () => {
            it("Should return 404 if comment is not found", async () => {
                commentsService.updateComment.mockRejectedValueOnce(CustomError.COMMENT_NOT_FOUND);
                const token = generateToken();

                const response = await request
                    .patch("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send(validBody);

                expect(response.statusCode).toBe(404);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                commentsService.updateComment.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .patch("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send(validBody);

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe("DELETE / (Delete comment)", () => {
        beforeEach(() => {
            commentsService.deleteComment.mockResolvedValue(null);
        });

        describe("Authorization (401)", () => {
            it("Should return 401 if not authenticated", async () => {
                const response = await request
                    .delete("/api/comments")
                    .send({ commentId: COMMENT_ID });

                expect(response.statusCode).toBe(401);
                expect(response.body.success).toBe(false);
                expect(commentsService.deleteComment).not.toHaveBeenCalled();
            });
        });

        describe("Input validation (400)", () => {
            it("Should return 400 if commentId is missing", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({});

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it("Should return 400 if commentId is not a valid UUID", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ commentId: "not-a-uuid" });

                expect(response.statusCode).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe("Happy paths (200)", () => {
            it("Should return 200 on successful deletion", async () => {
                const token = generateToken();

                const response = await request
                    .delete("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ commentId: COMMENT_ID });

                expect(response.statusCode).toBe(200);
                expect(response.body.success).toBe(true);
                expect(commentsService.deleteComment).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: TEST_USER_ID,
                        commentId: COMMENT_ID,
                    })
                );
            });
        });

        describe("Server errors (404, 500)", () => {
            it("Should return 404 if comment is not found", async () => {
                commentsService.deleteComment.mockRejectedValueOnce(CustomError.COMMENT_NOT_FOUND);
                const token = generateToken();

                const response = await request
                    .delete("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ commentId: COMMENT_ID });

                expect(response.statusCode).toBe(404);
                expect(response.body.success).toBe(false);
            });

            it("Should return 500 on unexpected service error", async () => {
                commentsService.deleteComment.mockRejectedValueOnce(new Error("Unexpected error"));
                const token = generateToken();

                const response = await request
                    .delete("/api/comments")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ commentId: COMMENT_ID });

                expect(response.statusCode).toBe(500);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
