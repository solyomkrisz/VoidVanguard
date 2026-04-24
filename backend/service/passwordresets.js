import crypto from "crypto";
import PasswordResets from "../sql/table/PasswordResets.js";
import * as CustomError from "../common/CustomError.js";
import * as users from "./users.js";
import Users from "../sql/table/Users.js";
import { pool } from "../sql/database.js";
import Password from "../common/Password.js";
import * as emails from "./emails.js";

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generatePasswordResetToken() {
  const buffer = crypto.randomBytes(32);
  const token = buffer.toString("base64url");
  const tokenHash = hashToken(token);

  return { token, tokenHash };
}

export async function resetPassword({ token, password }) {
  const tokenHash = hashToken(token);

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Find and lock token
    const [rows] = await conn.execute(
      `
      SELECT user_id
      FROM password_resets
      WHERE token_hash = ?
        AND expires_at > NOW()
      FOR UPDATE
      `,
      [tokenHash],
    );

    if (!rows.length) {
      await conn.rollback();
      throw CustomError.INVALID_RESET_TOKEN;
    }

    const userId = rows[0].user_id;

    const passwordHash = await Password.hash(password);

    const [updateResult] = await conn.execute(
      `
      UPDATE users
      SET password_hash = ?
      WHERE id = ?
      `,
      [passwordHash, userId],
    );

    if (updateResult.affectedRows !== 1) {
      await conn.rollback();
      throw CustomError.PASSWORD_UPDATE;
    }

    await conn.execute(
      `
      DELETE FROM password_resets
      WHERE token_hash = ?
      `,
      [tokenHash],
    );

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function createForUserWithEmail({ email }) {
  const user = await Users.selectByEmail(email);

  if (!user) return true;

  const { token, tokenHash } = generatePasswordResetToken();

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  // overwrite previous reset token since only one allowed per user
  await PasswordResets.upsert({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  try {
    await emails.sendResetEmail(user.email, token);
  } catch (err) {
    console.error("Failed to send reset email:", err);
  }

  return true;
}
