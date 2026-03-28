import * as CustomError from "../common/CustomError.js";
import Comments from "../sql/table/Comments.js";
import { v4 as uuidv4 } from "uuid";
import * as block from "./blocks.js";

export async function deleteComment({ userId, commentId }) {
  if ((await Comments.delete(userId, commentId)).affectedRows === 0) {
    throw CustomError.TEST;
  }

  return null;
}

export async function commentExists(commentId) {
  const result = await Comments.exists(commentId);
  return result;
}

export async function createComment({
  authorId,
  targetId,
  parentId = null,
  content,
}) {
  if (parentId && !(await commentExists(parentId))) {
    throw CustomError.TEST;
  }

  // throws
  await block.checkBlockStatus({
    initiatorId: authorId,
    recipientId: targetId,
  });

  const id = uuidv4();

  await Comments.create(id, authorId, targetId, content, parentId);

  return id;
}

export async function lazySelectByTarget({
  targetId,
  page = 1,
  limit = 20,
  requesterId = null,
}) {
  const offset = (page - 1) * limit;

  const comments = await Comments.lazySelectByTarget(
    requesterId,
    targetId,
    limit,
    offset,
  );
  const total = await Comments.getTotalCommentsForTarget(targetId);

  return {
    comments,
    page,
    limit,
    total,
    hasNext: offset + comments.length < total,
  };
}

export async function select({ requesterId = null, commentId }) {
  const row = Comments.select(requesterId, commentId);

  if (!row) {
    throw CustomError.TEST;
  }

  return row;
}

export async function updateComment({ userId, commentId, content }) {
  if (!(await Comments.update(userId, commentId, content))) {
    throw CustomError.ERROR;
  }

  return null;
}
