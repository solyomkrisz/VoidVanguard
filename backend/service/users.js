import * as CustomError from "../common/CustomError.js";
import Users from "../sql/table/Users.js";
import Password from "../common/Password.js";
import Permission from "../common/Permission.js";
import { v4 as uuidv4 } from "uuid";

export async function searchFor({ query, page = 1, limit = 6 }) {
  const offset = (page - 1) * limit;

  let results, total;

  try {
    results = await Users.search(query, { offset, limit });
    total = await Users.countForSearch(query);
  } catch (error) {
    console.log(error);

    results = [];
    total = 0;
  }

  return {
    results,
    page,
    limit,
    total,
    hasNext: offset + results.length < total,
  };
}

export async function getUser({ userId }) {
  const user = await Users.select(userId);
  return user;
}

export async function createUser({ username, email, gender, password }) {
  const id = uuidv4();
  const passwordHash = await Password.hash(password);

  await Users.create({ id, username, email, gender, passwordHash });

  return id;
}

export async function deleteUser({ id }) {
  if ((await Users.delete(id)).affectedRows === 0) {
    throw CustomError.USER_NOT_FOUND;
  }

  return null;
}

export async function updateUser({ userId, role, body }) {
  const user = await Users._select(userId);

  if (!user) {
    throw CustomError.USER_NOT_FOUND;
  }

  const updates = {};

  for (const column in body) {
    if (!Users.hasPermission(column, role, Permission.W)) {
      continue;
    }

    if (column === "password") {
      const same = await Password.compare(body.password, user.password_hash);

      if (!same) {
        updates.password_hash = await Password.hash(body.password);
      }

      continue;
    }

    if (body[column] !== user[column]) {
      updates[column] = body[column];
    }
  }

  if (!Object.keys(updates).length) {
    throw CustomError.NO_DATA_CHANGE;
  }

  const result = await Users.update(userId, updates);

  // update failed
  if (!result) {
    throw CustomError.TEST;
  }

  return result;
}
