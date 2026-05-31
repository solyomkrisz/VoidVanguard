/**
 * Kezdobarat magyarazat:
 * Fajl: backend/service/comments.js
 * Szerep: Service reteg: uzleti logika, adatmuveletek, tobb komponens osszefuzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as CustomError from "../common/CustomError.js";
import Comments from "../sql/table/Comments.js";
import { v4 as uuidv4 } from "uuid";
import * as block from "./blocks.js";
import Role from "../common/Role.js";

export async function deleteComment({ userId, role, commentId }) {
  // Admin szerepkorrel mas torlesi utat hasznalunk, mert ott nem kell tulajdonjog szerint szukiteni.
  if (role >= Role.ADMIN) {
    if ((await Comments.adminDelete(commentId)).affectedRows === 0) {
      throw CustomError.TEST;
    }
    return null;
  }

  if ((await Comments.delete(userId, commentId)).affectedRows === 0) {
    throw CustomError.TEST;
  }
  return null;
}

export async function commentExists(commentId) {
  // A valasz-hozzaszolasoknal elobb leellenorizzuk, hogy a szulo komment egyaltalan megvan-e.
  const result = await Comments.exists(commentId);
  return result;
}

export async function createComment({
  authorId,
  targetId,
  parentId = null,
  content,
}) {
  // Komment letrehozas elott ervenyesitjuk a szulo-komment letezeset es a blokkolasi szabalyokat is.
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
  // A listaeredmenyhez a kommenteken kivul a lapozasi metaadat is itt epul fel.
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
  // Egyetlen komment lekeresenel mar itt dobunk hibat, hogy a controllernek ne kelljen kulon null-ellenorzesekkel foglalkoznia.
  const row = await Comments.select(requesterId, commentId);

  if (!row) {
    throw CustomError.COMMENT_NOT_FOUND;
  }

  return row;
}

export async function updateComment({ userId, commentId, content }) {
  // A frissites csak akkor sikeres, ha a felhasznalo sajat kommentjet tudta modositani.
  if (!(await Comments.update(userId, commentId, content))) {
    throw CustomError.TEST;
  }

  return null;
}
