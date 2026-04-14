import jwt from "jsonwebtoken";
import { accessTokenLifetimeMin } from "./common.js";

class Token {
  static get(
    payload,
    iat = Math.floor(Date.now() / 1000),
    exp = Math.floor(Date.now() / 1000) + accessTokenLifetimeMin * 60,
    secret = process.env.ACCESS_TOKEN_SECRET,
    options = {},
  ) {
    payload.iat = iat;
    payload.exp = exp;

    return jwt.sign(payload, secret, options);
  }

  static verify(token, secret) {
    return jwt.verify(token, secret);
  }
}

export default Token;
