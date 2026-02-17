const STORAGE_KEY = "cx_theme"; // "light" | "dark" | "system"

export function getTheme() {
  return localStorage.getItem(STORAGE_KEY) || "system";
}

export function setTheme(mode) {
  localStorage.setItem(STORAGE_KEY, mode);
  applyTheme(mode);
}

export function applyTheme(mode) {
  const root = document.documentElement;

  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", isDark);
}

export function initTheme() {
  applyTheme(getTheme());

  // ถ้าเป็น system ให้ตาม OS เปลี่ยนแบบ realtime
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mq) return;

  const handler = () => {
    if (getTheme() === "system") applyTheme("system");
  };

  // modern browsers
  mq.addEventListener?.("change", handler);
  return () => mq.removeEventListener?.("change", handler);
}