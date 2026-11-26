// Demo login: one username per role and one shared password for all of them.
// The password is never written in the code or in Git. It comes from ENGAGE_PASSWORD, or from
// backend/runtime/password.txt (ignored by Git), which is created with a random value on first use.
import { Injectable } from "@nestjs/common";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const USERS: Record<string, { role: string; name: string }> = {
  pmo: { role: "PMO", name: "PMO" },
  management: { role: "MANAGEMENT", name: "Management" },
  additional: { role: "ADDITIONAL_MANAGER", name: "Additional Manager" },
  linemanager: { role: "LINE_MANAGER", name: "Line Manager" },
  techlead: { role: "TECH_LEAD", name: "Technical Lead" },
  employee: { role: "EMPLOYEE", name: "Employee" },
  hr: { role: "HR", name: "HR" },
};

const passwordFile = join(__dirname, "../../runtime/password.txt");
const digest = (value: string) => createHash("sha256").update(value).digest();

@Injectable()
export class AuthService {
  private password(): string {
    if (process.env.ENGAGE_PASSWORD) return process.env.ENGAGE_PASSWORD;
    if (!existsSync(passwordFile)) {
      mkdirSync(dirname(passwordFile), { recursive: true });
      writeFileSync(passwordFile, randomBytes(6).toString("base64url"));
    }
    return readFileSync(passwordFile, "utf8").trim();
  }

  // The role accounts for the demo buttons. The password is handed out only when it is the local
  // demo one; a password set through ENGAGE_PASSWORD is never sent to the browser.
  demo() {
    return {
      users: Object.entries(USERS).map(([username, user]) => ({ username, name: user.name })),
      password: process.env.ENGAGE_PASSWORD ? "" : this.password(),
    };
  }

  login(username: unknown, password: unknown) {
    if (typeof username !== "string" || typeof password !== "string") return null;
    const key = username.trim().toLowerCase();
    // Compared as digests so the time taken does not depend on how much of the password matches.
    const matches = timingSafeEqual(digest(password), digest(this.password()));
    return matches && Object.hasOwn(USERS, key) ? { username: key, ...USERS[key] } : null;
  }
}
