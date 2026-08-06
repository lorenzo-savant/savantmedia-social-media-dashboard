import { cookies } from "next/headers";
import type { Lang } from "./format";

export const LANG_COOKIE = "savant-lang";
export const THEME_COOKIE = "savant-theme";

/**
 * La lingua sta in un cookie, non nello stato React: così il server rende già
 * la pagina nella lingua giusta e non c'è il lampo di testo inglese prima che
 * l'idratazione corregga. Default svedese — il pubblico della dashboard è a
 * Stoccolma.
 */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const v = store.get(LANG_COOKIE)?.value;
  return v === "en" ? "en" : "sv";
}
