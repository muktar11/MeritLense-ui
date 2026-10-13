// Switching language changes the [locale] URL segment, which remounts the
// page - anything typed into a form was lost. Just before the switch we
// save the visible form fields; the page in the new language puts them back.
// Passwords and files are never saved.

const STORAGE_KEY = "ml-locale-switch-form";
const MAX_AGE_MS = 30_000;

type SavedField = { key: string; value?: string; checked?: boolean };
type Snapshot = { path: string; savedAt: number; fields: SavedField[] };

const SKIPPED_TYPES = new Set(["password", "file", "hidden", "submit", "button", "reset", "image"]);

function pathWithoutLocale(pathname: string): string {
  return pathname.split("/").slice(2).join("/");
}

function fieldKey(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, index: number): string {
  // Prefer stable identifiers; fall back to position among form fields.
  if (el.id) return `id:${el.id}`;
  if (el.name) {
    if (el instanceof HTMLInputElement && el.type === "radio") return `radio:${el.name}:${el.value}`;
    return `name:${el.name}`;
  }
  return `idx:${index}`;
}

function formFields() {
  return Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "main input, main textarea, main select, form input, form textarea, form select",
  )).filter((el, i, all) => all.indexOf(el) === i && !(el instanceof HTMLInputElement && SKIPPED_TYPES.has(el.type)));
}

export function saveFormStateForLocaleSwitch(pathname: string) {
  try {
    const fields = formFields()
      .map((el, i): SavedField | null => {
        const key = fieldKey(el, i);
        if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
          return { key, checked: el.checked };
        }
        return el.value ? { key, value: el.value } : null;
      })
      .filter((f): f is SavedField => f !== null);
    if (!fields.length) return;
    const snapshot: Snapshot = { path: pathWithoutLocale(pathname), savedAt: Date.now(), fields };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage unavailable - the switch still works, the fields just start empty.
  }
}

// React tracks input values itself; set through the native setter and fire
// the events React listens to, so controlled inputs pick the value up.
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function setNativeChecked(el: HTMLInputElement, checked: boolean) {
  if (el.checked !== checked) el.click();
}

/** Restore saved fields on the new-language page. Fields can render after
 *  data loads, so keep trying briefly. Returns a cleanup function. */
export function restoreFormStateAfterLocaleSwitch(pathname: string): () => void {
  let snapshot: Snapshot | null = null;
  try {
    snapshot = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return () => {};
  }
  if (!snapshot || snapshot.path !== pathWithoutLocale(pathname) || Date.now() - snapshot.savedAt > MAX_AGE_MS) {
    return () => {};
  }
  const pending = new Map(snapshot.fields.map((f) => [f.key, f]));
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    formFields().forEach((el, i) => {
      const saved = pending.get(fieldKey(el, i));
      if (!saved) return;
      if (saved.checked !== undefined && el instanceof HTMLInputElement) setNativeChecked(el, saved.checked);
      else if (saved.value !== undefined) setNativeValue(el, saved.value);
      pending.delete(saved.key);
    });
    if (!pending.size || attempts >= 20) {
      window.clearInterval(timer);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, 100);
  return () => window.clearInterval(timer);
}
