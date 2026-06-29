# Till Rebecca — vad jag behöver för att gå vidare med annonsdashboarden

Hej Rebecca!

Dashboarden är **klar och testad på exempeldata**: rapportering + kontoöversikt
(kontoöversikt), tvåspråkigt gränssnitt (svenska/engelska), budgetlarm per kund och
automatisk nattlig synk. Tekniken för **Meta, Google och Snapchat** finns redan på plats.

För att visa **riktig data** behöver jag tillgång till annonskontona. Allt är samlat här
nedan, i prioritetsordning. **Du behöver aldrig maila mig lösenord eller nycklar** — ge mig
behörighet i respektive plattform, så skapar jag säkra tokens själv. Inga nycklar hamnar i
koden, bara i en lokal `.env`-fil utanför Git (precis för att undvika en sådan läcka som vi
pratade om).

> Kontot jag använder är **lorenzo@savantmedia.se**. Om mitt Meta-/Google-konto har en
> annan adress säger jag till — men utgå från den här tills vidare.

---

## Snabb checklista (vad jag behöver)

| # | Vad | Plattform | Status |
|---|-----|-----------|--------|
| 1 | Admin-behörighet + åtkomst till annonskontona | **Meta** | 🔴 blockerar idag |
| 2 | Åtkomst till förvaltarkonto + utvecklartoken + konto-ID:n | **Google Ads** | 🟢 kan börja direkt |
| 3 | Lista: kund ↔ annonskonto ↔ månadsbudget + vad som räknas som konvertering | Affär | 🟡 behövs för budget-vyn |
| 4 | Åtkomst till Snapchats annonskonto | **Snapchat** | ⚪ senare, ingen brådska |

---

## 1. Meta (Facebook & Instagram) — högsta prioritet

**Varför:** det är det enda som blockerar mig just nu. Med åtkomsten skapar jag en säker
läs-token och synken börjar hämta riktig Meta-data.

**Vad du gör (ca 5 minuter):**
1. Gå till **business.facebook.com → Inställningar** (Företagsinställningar).
2. **Användare → Personer** → lägg till **lorenzo@savantmedia.se** som **Administratör**
   i Savants företagsportfölj.
3. **Konton → Annonskonton** → ge mig åtkomst till de annonskonton som ska synas i
   dashboarden (minst **läsbehörighet**).
4. Bekräfta vilken **Meta-app** jag får använda (t.ex. "Savant Media manager"). Finns ingen,
   ge mig utvecklarbehörighet så skapar jag en.

**Vad jag gör sedan själv:** skapar en **System User-token** med behörigheten **`ads_read`**
(läsbehörighet) och lägger den i `.env`. En System User-token är kopplad till *företaget*,
inte till en person — den slutar alltså inte fungera om någon byter jobb.

**Vad jag behöver i text av dig:** listan över **annonskonto-ID:n** (börjar oftast med `act_…`).

---

## 2. Google Ads — kan vi köra igång med direkt

**Varför:** andra plattformen. Här finns ingen lång väntan — grundåtkomsten (Basic/Explorer)
brukar godkännas snabbt.

**Vad du gör:**
1. Ge mitt Google-konto **lorenzo@savantmedia.se** **administratörsåtkomst** till ert
   **Google Ads-förvaltarkonto (MCC)** och till de annonskonton som ska läsas.
2. **Utvecklartoken (developer token):**
   - Har ni redan en — dela den med mig, eller
   - ge mig åtkomst till förvaltarkontots **API Center**, så ansöker/hämtar jag den själv
     (Basic access räcker för rapportering).
3. Skicka mig **konto-ID:n (customer-ID)**, 10 siffror i formatet `123-456-7890`, för de
   konton som ska in — samt **förvaltarkontots ID** om kontona ligger under en MCC.

**Vad jag gör sedan själv:** skapar OAuth-uppgifter (client-ID, secret, refresh-token) och
lägger allt i `.env`. Sedan kör jag synken och Google-datan dyker upp i dashboarden.

---

## 3. Affärsuppgifter — bara du har dessa

Behövs för panelen **"budget per kund"** och **budgetlarmen** (och för att siffrorna ska bli rätt).

**A) Koppling kund ↔ konto ↔ budget.** Fyll gärna i:

| Kund | Plattform | Annonskonto-ID | Månadsbudget | Valuta |
|------|-----------|----------------|--------------|--------|
|      | Meta      | act_…          |              | EUR/SEK |
|      | Google    | 123-456-7890   |              | EUR/SEK |
|      | Snapchat  | …              |              | EUR/SEK |

**B) Konverteringar.** Vad ska räknas som en *konvertering* per plattform — köp, leads,
registreringar? Det påverkar konverterings- och ROAS-siffrorna.

**C) Valuta.** Rapporterar vi allt i **EUR** eller **SEK**? (Påverkar hur beloppen visas.)

---

## 4. Snapchat — senare, ingen brådska

När vi vill ha med Snapchat behöver jag åtkomst till ert **Snapchat Ads Manager /
Business**-konto (organisationen), så jag kan skapa API-uppgifter. Vi kan ta det efter att
Meta och Google är igång — koden byggs på samma sätt som de andra.

---

## Säkerhet (kort)

- Du behöver **aldrig maila mig lösenord eller nycklar**. Ge behörighet i respektive
  plattform — jag skapar token *där*.
- Alla nycklar ligger **bara i en lokal `.env`-fil** utanför Git. Inget i koden.
- Meta-token blir en **System User-token** (kopplad till företaget, inte en person).

---

## Vad som händer när jag fått ovanstående

1. **Meta + Google:** jag kör synken och dashboarden visar **riktig data** (märkningen växlar
   från "testdata" till "live-data") — samma vyer, inga kodändringar behövs.
2. Jag **kopplar konton till kunder** så att budgetpanelen och larmen stämmer.
3. Jag slår på den **nattliga automatiska synken**.
4. För drift dygnet runt sätter jag upp databasen som en tjänst (rent tekniskt, sköter jag).

**Prioritet:** Meta blockerar mest (jag väntar bara på din admin-inbjudan). Google kan vi
köra parallellt direkt. Hör av dig så går vi igenom det live om något är oklart!

Tack,
Lorenzo
