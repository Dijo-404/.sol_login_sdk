import jwt from "jsonwebtoken";

/**
 * Express middleware to verify .sol Login session tokens.
 * Usage: app.get('/protected', verifySolSession(JWT_SECRET), handler)
 *
 * Populates req.solIdentity with { wallet, domain }.
 */
export function verifySolSession(jwtSecret) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing .sol Login session token" });
    }
    try {
      const payload = jwt.verify(header.slice(7), jwtSecret);
      req.solIdentity = { wallet: payload.wallet, domain: payload.domain };
      next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
  };
}

export { verifySolSession as requireSolAuth };
