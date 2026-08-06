import { NextResponse, type NextRequest } from "next/server";

/**
 * Cancello a password per la demo pubblicata.
 *
 * Perché non la Deployment Protection di Vercel: sul piano attuale
 * l'autenticazione Vercel copre le preview e gli URL di deployment, ma NON il
 * dominio di produzione — quello richiede l'add-on "Advanced Deployment
 * Protection". Siccome la dashboard, per quanto contenga solo dati fittizi,
 * assomiglia a un pannello con dati di clienti, il link non deve essere
 * apribile da chiunque lo riceva.
 *
 * Basic Auth è volutamente la scelta più semplice: funziona in ogni browser,
 * non richiede a chi guarda un account Vercel, e si disattiva togliendo una
 * variabile d'ambiente.
 *
 * Se `DEMO_PASSWORD` non è impostata il proxy si toglie di mezzo, quindi
 * in locale (`npm run dev`) non chiede nulla.
 */

const REALM = 'Basic realm="Savant Ads — demo", charset="UTF-8"';

/** Confronto a tempo costante: evita di far dedurre la password un byte alla volta. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function proxy(request: NextRequest) {
  const expected = process.env.DEMO_PASSWORD;
  if (!expected) return NextResponse.next();

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      // Formato "utente:password" — l'utente non ci interessa, conta la password.
      const password = decoded.slice(decoded.indexOf(":") + 1);
      if (safeEqual(password, expected)) return NextResponse.next();
    } catch {
      /* header malformato: cade nel 401 qui sotto */
    }
  }

  return new NextResponse("Åtkomst kräver lösenord.", {
    status: 401,
    headers: {
      "WWW-Authenticate": REALM,
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  // Gli asset statici restano fuori: sono già serviti con hash nel nome e
  // farli passare dal proxy rallenterebbe ogni richiesta senza motivo.
  matcher: ["/((?!_next/static|_next/image|mark.svg|favicon.ico).*)"],
};
