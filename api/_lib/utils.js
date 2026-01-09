import crypto from "crypto";
import slugify from "slugify";

export function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch (e) { reject(e); }
    });
  });
}

export function randomPassword() {
  return crypto.randomBytes(8).toString("hex"); // 16 chars
}

export function makeSlug(nome, email) {
  const base = (nome || email || "corretor").toString().trim().toLowerCase();
  const slug = slugify(base, { lower: true, strict: true });
  // garante unicidade mínima
  const suffix = crypto.randomBytes(2).toString("hex");
  return `${slug}-${suffix}`;
}
