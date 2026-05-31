/**
 * Kezdobarat magyarazat:
 * Fajl: backend/common/Token.js
 * Szerep: JWT tokenek letrehozasat, ellenorzeset es hash-eleset vegzo kozos helper.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { accessTokenLifetimeMin } from "./common.js";

class Token {
  static get(
    payload,
    iat = Math.floor(Date.now() / 1000),
    exp = Math.floor(Date.now() / 1000) + accessTokenLifetimeMin * 60,
    secret = process.env.ACCESS_TOKEN_SECRET,
    options = {},
  ) {
    // Itt keszul a teljes JWT payload: a hivo altal adott adatok melle bekerul a kiadas, lejarat es az egyedi jti is.
    const fullPayload = {
      ...payload,
      iat,
      exp,
      // A jti minden tokennek egyedi azonosítót ad, így később külön is nyomon követhető.
      jti: crypto.randomUUID(),
    };

    return jwt.sign(fullPayload, secret, options);
  }

  static verify(token, secret) {
    // A verify a jwt konyvtar hibajat tovabbdobja, ezt a hivo middleware vagy service kezeli le sajat szabaly szerint.
    return jwt.verify(token, secret);
  }

  static hash(token) {
    // A refresh tokent fix kulccsal HMAC-eljük, így összevethető marad, de a nyers érték nem tárolódik.
    return crypto
      .createHmac("sha256", process.env.REFRESH_TOKEN_HASH_SECRET)
      .update(token)
      .digest("hex");
  }
}

export default Token;
