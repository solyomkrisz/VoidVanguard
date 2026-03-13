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

export async function createUserReaction({ userId, targetId, reactionType }) {
  if (
    (await Reactions.delete(userId, targetId, reactionType)).affectedRows > 0
  ) {
    return {
      reaction_type: reactionType,
    };
  }

  await Reactions.upsert(userId, targetId, reactionType);

  return {
    reaction_type: reactionType,
  };
}
