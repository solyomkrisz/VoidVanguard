/**
 * Kezdobarat magyarazat:
 * Fajl: backend/service/reactions.js
 * Szerep: Service reteg: uzleti logika, adatmuveletek, tobb komponens osszefuzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Reactions from "../sql/table/Reactions.js";

export async function getUserReaction({ userId, targetId }) {
  const result = await Reactions.select(userId, targetId);

  if (!result) {
    return {
      target_id: targetId,
    };
  }

  return result;
}

// export async function createUserReaction({ userId, targetId, reactionType }) {
//   if (
//     (await Reactions.delete(userId, targetId, reactionType)).affectedRows > 0
//   ) {
//     return {
//       type: reactionType,
//     };
//   }

//   await Reactions.upsert(userId, targetId, reactionType);

//   return {
//     type: reactionType,
//   };
// }

export async function createUserReaction({ userId, targetId, reactionType }) {
  const existing = await Reactions.select(userId, targetId);

  let nextState = null;

  if (!existing) {
    nextState = reactionType;
  } else if (existing.type === reactionType) {
    nextState = null;
  } else {
    nextState = reactionType;
  }

  if (nextState === null) {
    await Reactions.deleteByUserAndTarget(userId, targetId);
  } else if (!existing) {
    await Reactions.create(userId, targetId, nextState);
  } else {
    await Reactions.update(userId, targetId, nextState);
  }

  return {
    type: nextState,
  };
}
