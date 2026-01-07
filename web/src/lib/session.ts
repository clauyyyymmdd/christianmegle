export type Role = "sinner" | "priest";

const ROLE_KEY = "cm_role";
const PRIEST_OK_KEY = "cm_priest_ok"; // later replaced by server JWT

export function setRole(role: Role) {
  localStorage.setItem(ROLE_KEY, role);
}

export function getRole(): Role | null {
  const v = localStorage.getItem(ROLE_KEY);
  return v === "sinner" || v === "priest" ? v : null;
}

export function setPriestOk(ok: boolean) {
  localStorage.setItem(PRIEST_OK_KEY, ok ? "1" : "0");
}

export function isPriestOk() {
  return localStorage.getItem(PRIEST_OK_KEY) === "1";
}

export function clearSession() {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(PRIEST_OK_KEY);
}
