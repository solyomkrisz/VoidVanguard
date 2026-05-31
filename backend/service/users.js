/**
 * Kezdobarat magyarazat:
 * Fajl: backend/service/users.js
 * Szerep: Service reteg: uzleti logika, adatmuveletek, tobb komponens osszefuzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as CustomError from "../common/CustomError.js";
import Users from "../sql/table/Users.js";
import Password from "../common/Password.js";
import Permission from "../common/Permission.js";
import { v4 as uuidv4 } from "uuid";

// Felhasznalokat keres lapozhato formatumban, a hibakat ures listara fogva vissza.
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

// Egy felhasznalo rekordjat keri le ID alapjan.
export async function getUser({ userId }) {
  const user = await Users.select(userId);
  return user;
}

// Uj felhasznalot hoz letre, a jelszo hash-eleset is itt intezve.
export async function createUser({ username, email, password }) {
  const id = uuidv4();
  const passwordHash = await Password.hash(password);

  await Users.create({ id, username, email, passwordHash });

  return id;
}

// Torli a megadott felhasznalot, vagy USER_NOT_FOUND hibaval leall.
export async function deleteUser({ id }) {
  if ((await Users.delete(id)).affectedRows === 0) {
    throw CustomError.USER_NOT_FOUND;
  }

  return null;
}

// Jogosultsag alapjan csak a megengedett mezoket frissiti, es a jelszot kulon hash-eli.
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

// Kizarolag jelszocserehez valo roviditett helper.
export async function updatePassword({ id, password }) {
  const passwordHash = await Password.hash(password);
  const result = await Users.updatePassword(id, passwordHash);
  return result.affectedRows > 0;
}
