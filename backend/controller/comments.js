/**
 * Kezdobarat magyarazat:
 * Fajl: backend/controller/comments.js
 * Szerep: Hozzaszolas-listak es kommentmuveletek HTTP-szintu kezelese egységes valaszformaval.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as service from "../service/comments.js";
import { createResponse, handleCaughtError } from "../common/common.js";

export async function lazySelectComments(request, response) {
  try {
    // A kommentlista endpoint itt alakitja at a query parametereket service-kompatibilis szamokka.
    const result = await service.lazySelectByTarget({
      requesterId: request?.targetUser?.id ?? null,
      targetId: request.query.targetId,
      page: Number(request.query?.page || 1),
      limit: Number(request.query?.limit || 20),
    });

    response
      .status(200)
      .json(createResponse(true, result, "Hozzászólások sikeresen lekérve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function getComment(request, response) {
  try {
    // Egyetlen komment lekerese akkor is ugyanabba a valaszformatumba kerul, mint a tobbi endpointon.
    const result = await service.select({
      requesterId: request?.targetUser?.id ?? null,
      commentId: request.params.id,
    });

    response
      .status(200)
      .json(createResponse(true, result, "Hozzászólás sikeresen lekérve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function createComment(request, response) {
  try {
    // Letrehozas utan azonnal vissza is kerjuk a kesz kommentet, hogy a frontend az uj allapotot kapja meg, ne csak az uj id-t.
    const commentId = await service.createComment({
      authorId: request.targetUser.id,
      targetId: request.body.targetId,
      // A parentId opcionális: csak valasz-kommentnel erkezik a body-ban.
      parentId: request.body.parentId,
      content: request.body.content,
    });

    const comment = await service.select({ commentId });

    response
      .status(200)
      .json(createResponse(true, comment, "A hozzászólás sikeresen elküldve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function updateComment(request, response) {
  try {
    // Frissites utan ugyanugy ujra lekerjuk a kommentet, hogy a kliens a frissitett szerkezetet kapja vissza.
    await service.updateComment({
      userId: request.targetUser.id,
      commentId: request.body.commentId,
      content: request.body.content,
    });

    const updatedComment = await service.select({
      commentId: request.body.commentId,
    });

    response
      .status(200)
      .json(
        createResponse(
          true,
          updatedComment,
          "A hozzászólás sikeresen frissítve",
        ),
      );
  } catch (error) {
    handleCaughtError(response, error);
  }
}

export async function deleteComment(request, response) {
  try {
    // Torlesnel mar nincs visszakuldendo entitas, eleg egy sikeres ures valasz.
    await service.deleteComment({
      userId: request.targetUser.id,
      role: request.user.role,
      commentId: request.body.commentId,
    });

    response
      .status(200)
      .json(createResponse(true, null, "A hozzászólás sikeresen törölve"));
  } catch (error) {
    handleCaughtError(response, error);
  }
}
