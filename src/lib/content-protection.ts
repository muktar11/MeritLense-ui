"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Casual copy-protection deterrents, applied platform-wide (public pages
 * and authenticated dashboards alike).
 *
 * IMPORTANT - what this is and isn't: every mechanism here runs in the
 * browser and can be bypassed by disabling JavaScript, using devtools, or
 * inspecting network responses directly. None of it is a substitute for
 * server-side access control - it only raises the effort required for
 * casual copying (right-click save, Ctrl+C, drag-out) by an ordinary user
 * who isn't deliberately circumventing it. Real protection for sensitive
 * data lives in the backend's permission checks.
 *
 * Every listener below exempts form controls and links (see
 * isExemptTarget) so typing, pasting, copying your own input, and
 * navigating via right-click/"open in new tab" all keep working normally.
 */

const EXEMPT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION"]);

function isExemptTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  let el: Element | null = target;
  while (el) {
    if (EXEMPT_TAGS.has(el.tagName)) return true;
    if (el.getAttribute("contenteditable") === "true") return true;
    // Links need their native context menu (copy link address, open in
    // new tab) and native drag (drag a link to a new tab/bookmark bar) to
    // keep working - blocking those breaks normal navigation, not copying.
    if (el.tagName === "A" && el.hasAttribute("href")) return true;
    // Explicit escape hatch for the rare value that's meant to be copied
    // (e.g. a verification code, invoice number) - opt in per-element
    // with className="allow-select" rather than disabling protection
    // broadly.
    if (el.classList?.contains("allow-select")) return true;
    el = el.parentElement;
  }
  return false;
}

function isCopyShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  const mod = event.ctrlKey || event.metaKey;
  if (!mod) return false;
  // 'c' (copy), 'a' (select all), 'x' (cut), 's' (save page), 'p' (print),
  // 'u' (view source). Paste ('v') is deliberately never blocked - it's
  // how legitimate form-filling works, including pasting from a password
  // manager.
  return ["c", "a", "x", "s", "p", "u"].includes(key);
}

function isDevToolsShortcut(event: KeyboardEvent): boolean {
  if (event.key === "F12") return true;
  const mod = event.ctrlKey || event.metaKey;
  if (!mod) return false;
  const key = event.key.toLowerCase();
  // Ctrl/Cmd+Shift+I/J/C - inspector/console/element-picker.
  return event.shiftKey && ["i", "j", "c"].includes(key);
}

export function useContentProtection() {
  useEffect(() => {
    const handleCopyShortcuts = (event: KeyboardEvent) => {
      if (isExemptTarget(event.target)) return;
      if (isCopyShortcut(event) || isDevToolsShortcut(event)) {
        event.preventDefault();
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (isExemptTarget(event.target)) return;
      event.preventDefault();
    };

    const handleDragStart = (event: DragEvent) => {
      // Only images/media are worth blocking drag on - blocking drag
      // everywhere would also break drag-to-select text selection ranges
      // in browsers that implement it via dragstart, and there's no
      // drag-and-drop upload zone anywhere in this app to protect against
      // interfering with.
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.tagName !== "IMG" && !target.classList.contains("protect-drag")) return;
      if (isExemptTarget(target)) return;
      event.preventDefault();
    };

    // PrintScreen can only ever be *detected* after the OS has already
    // captured the screenshot - there is no browser API that can prevent
    // or intercept it. This is a visible reminder, not a block.
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "PrintScreen") {
        toast.warning("Screenshots of this page may contain confidential information.", {
          description: "Please don't redistribute captured content without authorization.",
        });
      }
    };

    document.addEventListener("keydown", handleCopyShortcuts);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleCopyShortcuts);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
}
