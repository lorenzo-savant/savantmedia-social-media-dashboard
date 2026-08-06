# Till Rebecca — annonsdashboarden är klar att visa, det här behövs för skarp data

Hej Rebecca!

**Dashboarden är byggd och går att titta på redan nu.** Den kör på genererad
demodata, så vi kan gå igenom vyerna, siffrorna och begreppen tillsammans utan att
vänta på någonting. Det som återstår är åtkomsten till annonskontona — då byts
demodatan mot riktiga siffror **utan att någonting i gränssnittet ändras**.

Det här dokumentet är i tre delar:

1. [Vad som finns nu](#1-vad-som-finns-nu) — så att du vet vad du får
2. [Vad jag behöver av dig](#2-vad-jag-behöver-av-dig) — checklistan, i prioritetsordning
3. [Vad som händer sedan](#3-vad-som-händer-sedan) — tidslinjen efter att jag fått åtkomsten

> Kontot jag använder är **lorenzo@savantmedia.se**. Om mitt Meta- eller
> Google-konto ligger på en annan adress säger jag till — utgå från den här tills
> vidare.

**Du behöver aldrig mejla mig lösenord eller nycklar.** Ge mig behörighet i
respektive plattform, så skapar jag säkra tokens själv, där. Inga nycklar hamnar i
koden — bara i en lokal fil utanför Git, precis för att undvika den typ av läcka vi
pratade om.

---

## 1. Vad som finns nu

### Sex vyer, på svenska och engelska, byggd för mobilen först

| Vy | Vad den svarar på |
|---|---|
| **Översikt** | Hur går det totalt? Kostnad, konverteringar, ROAS, klick, visningar — med förändring mot föregående period, kostnadskurva per plattform och budgetläget för alla kunder |
| **Kampanjer** | Vilken kampanj drar pengar och vilken levererar? Sorterbar och sökbar, med en detaljvy per kampanj |
| **Kunder** | Ligger kunden i fas med sin månadsbudget? Prognos för hela månaden, inte bara "hittills" |
| **Insikter** | Var visas annonserna och för vem? Placering, enhet, ålder, kön, land |
| **Konton** | Är allt anslutet och synkat? Status per annonskonto |
| **Datakällor** | Var kommer varje siffra ifrån? Fält för fält, mot respektive API |

Gränssnittet växlar mellan **svenska och engelska** med en knapp, och har **ljust
och mörkt läge**. Det fungerar lika bra i telefonen som på skärmen — bottenmeny i
mobilen, sidomeny på datorn.

### Budgetpanelen — den du bad om

Per kund visas:

- **hittills i månaden**, **prognos för hela månaden**, och **avtalad
  månadsbudget**
- en mätare med ett litet streck som visar var kostnaden *borde* ligga idag om
  budgeten förbrukades jämnt. Utan det strecket säger "62 % av budgeten"
  ingenting — 62 % är utmärkt den 20:e och alarmerande den 8:e
- status: **Över budget · Nära gränsen · I fas · Under budget**

Larmet sätts på **prognosen**, inte på det som redan är spenderat. Det är
skillnaden mellan att få veta den 12:e att det håller på att spåra ur, och att få
veta den 30:e att det redan gjort det.

### Att siffrorna ska gå att lita på

Jag har byggt efter en regel: **allt som visas måste motsvara ett fält som
faktiskt går att hämta ur plattformarnas API:er.** Inga uppskattningar. Sidan
**Datakällor** är beviset — där står varje mätvärde med sitt exakta fältnamn.

Fyra ställen där det syns direkt, och som är värda att känna till innan vi läser
siffrorna tillsammans:

**ROAS står som "–", aldrig som 0, för leadkunder.**
ROAS går bara att räkna om konverteringen har ett *värde* i plattformen. Ett köp
har ett ordervärde; en jobbansökan har det oftast inte. En nolla skulle betyda
"kampanjen gav ingenting tillbaka", vilket är fel om den levererar leads billigt.
För de kunderna är **CPA** — kostnad per konvertering — nyckeltalet.

**De senaste dagarnas konverteringar är inte färdiga.**
Meta räknar en konvertering till annonsen i upp till 7 dagar efter klicket. Det
betyder att gårdagens siffror alltid är **för låga** och justeras uppåt i
efterhand. Grafen markerar de fyra senaste dagarna, och synken hämtar om 28 dagar
varje natt just för att fånga upp det. Det är alltså normalt, inte ett fel — men
det är bra att veta innan man drar slutsatser av "igår".

**Räckvidd summeras inte, och saknas helt för Google.**
Samma person som ser annonsen tre dagar i rad är *en* person. Google Ads API ger
ingen räckvidd per kampanj och dag alls — den kolumnen är tom istället för
gissad. Och det går inte att räkna unik räckvidd *över* plattformarna: ingen
plattform kan deduplicera mot en annan.

**Kvoter räknas på summor.**
CTR för en månad är totala klick delat med totala visningar — inte medelvärdet av
de dagliga CTR-talen, som skulle väga en dag med 10 visningar lika tungt som en
dag med två miljoner.

### Så tittar du på den

Om du vill klicka runt själv säger du till, så visar jag på skärmen eller sätter
upp den på en intern adress. Att köra den lokalt kräver ett kommando i terminalen
(`npm run dev` i mappen `web`) — men det ska du inte behöva göra.

---

## 2. Vad jag behöver av dig

| # | Vad | Plattform | Läge | Tidsåtgång för dig |
|---|---|---|---|---|
| 1 | Admin i företagsportföljen + åtkomst till annonskontona | **Meta** | 🔴 blockerar | ~5 min |
| 2 | Åtkomst till förvaltarkonto + utvecklartoken + konto-ID | **Google Ads** | 🟢 kan starta direkt | ~10 min |
| 3 | Lista: kund ↔ annonskonto ↔ månadsbudget ↔ vad som är en konvertering | Affär | 🟡 behövs för budgetvyn | ~20 min |
| 4 | Åtkomst till Snapchats annonskonto | **Snapchat** | ⚪ senare | ~5 min |

Punkt 1 och 2 kan gå parallellt. Punkt 3 är den enda där jag är helt beroende av
information som bara finns hos er.

---

### 1. Meta (Facebook & Instagram) — högsta prioritet

**Varför:** det är det enda som blockerar mig just nu.

**Vad du gör:**

1. Gå till **business.facebook.com → Inställningar** (Företagsinställningar).
2. **Användare → Personer** → lägg till **lorenzo@savantmedia.se** som
   **Administratör** i Savants företagsportfölj.
3. **Konton → Annonskonton** → ge mig åtkomst till de annonskonton som ska synas
   i dashboarden. **Läsbehörighet räcker** — jag behöver aldrig kunna ändra en
   kampanj.
4. Bekräfta vilken **Meta-app** jag får använda (t.ex. "Savant Media manager").
   Finns ingen app, ge mig utvecklarbehörighet så skapar jag en.

**Vad jag behöver i text:** listan över **annonskonto-ID:n** (börjar med `act_…`).
De hittar du under Konton → Annonskonton.

**Vad jag gör sedan:** skapar en **System User-token** med behörigheten
**`ads_read`** och lägger den i den lokala miljöfilen. En System User-token är
kopplad till *företaget*, inte till en person — den slutar alltså inte fungera om
någon byter jobb. `ads_read` är rena läsrättigheter.

**Om något går fel:** Meta har en kvot som baseras på annonskontots kostnad
(felkod 17). Systemet hanterar det redan genom att vänta och försöka igen, så
första historiska hämtningen kan ta en stund. Inget du behöver göra.

---

### 2. Google Ads — kan vi köra igång med direkt

**Varför:** ingen lång väntan här. Grundåtkomsten till API:et brukar godkännas
snabbt, och tekniken är redan skriven och testad.

**Vad du gör:**

1. Ge **lorenzo@savantmedia.se** **administratörsåtkomst** till ert
   **Google Ads-förvaltarkonto (MCC)** och till de annonskonton som ska läsas.
2. **Utvecklartoken (developer token):** antingen
   - dela den ni redan har, eller
   - ge mig åtkomst till förvaltarkontots **API Center**, så ansöker jag om den
     själv. **Basic access räcker** för rapportering — vi behöver ingen högre nivå.
3. Skicka **kund-ID:n (customer ID)** — 10 siffror i formatet `123-456-7890` —
   för de konton som ska in, **samt förvaltarkontots ID** om kontona ligger under
   en MCC.

**Vad jag gör sedan:** skapar OAuth-uppgifter (client-ID, secret, refresh-token),
lägger dem lokalt och kör synken. Google-datan dyker upp i dashboarden direkt.

---

### 3. Affärsuppgifter — bara ni har dessa

Det här behövs för att **budgetpanelen och larmen ska stämma**, och för att
konverteringssiffrorna ska betyda rätt sak. Utan det kan systemet visa kostnad och
klick, men inte om en kund ligger rätt mot sin budget.

**A) Koppling kund ↔ annonskonto ↔ månadsbudget**

| Kund | Plattform | Annonskonto-ID | Månadsbudget | Valuta |
|------|-----------|----------------|--------------|--------|
|      | Meta      | act_…          |              | SEK    |
|      | Google    | 123-456-7890   |              | SEK    |
|      | Snapchat  | …              |              | SEK    |

Ett annonskonto hör till exakt en kund. En kund kan ha flera konton (ett per
plattform) — budgeten sätts per **kund**, inte per konto, och panelen summerar
över plattformarna.

**B) Vad räknas som en konvertering — per kund?**

Det här är den viktigaste raden i hela dokumentet, för den styr CPA och ROAS.

- Är det ett **köp**, ett **lead**, en **bokning**, en **registrering**?
- Om det är flera saker: räknas alla, eller bara en av dem?
- **Har konverteringen ett värde** konfigurerat i plattformen? För e-handel finns
  ordervärdet automatiskt. För leads måste någon ha satt ett värde manuellt — och
  har ingen gjort det går ROAS inte att räkna (då visar dashboarden "–" och vi
  tittar på CPA istället).

Det räcker med en rad per kund, ungefär: *"Kund X: köp, värde från e-handeln"*
eller *"Kund Y: ifyllt kontaktformulär, inget värde satt"*.

**C) Valuta**

Rapporterar vi allt i **SEK**? Dashboarden är byggd för SEK just nu, och gör
medvetet **ingen valutaomräkning** — att summera konton i olika valutor utan
växelkurs är ett av de vanligaste sätten att få fel tal i en annonsrapport. Har vi
konton som rapporterar i EUR behöver vi bestämma kurs och kursdatum först.

**D) Vem ska kunna se dashboarden?**

Bara du och jag, hela teamet, eller ska kunderna få egna vyer? Det påverkar var
den ska publiceras och om vi behöver inloggning.

---

### 4. Snapchat — senare, ingen brådska

När vi vill ha med Snapchat behöver jag åtkomst till ert **Snapchat Ads Manager /
Business**-konto (organisationen), så att jag kan skapa API-uppgifter.

Vi tar det efter att Meta och Google är igång. Koden byggs på exakt samma sätt som
de andra två — dashboarden har redan en plats för Snapchat, den är bara tom.

En sak att känna till: Snapchat kallar klick för **swipes** och har egna
åldersintervall (13–17, 18–20, 21–24, 25–34, 35+) som inte matchar Metas. Systemet
översätter swipes till klick i den gemensamma modellen, men åldersgrupperna hålls
isär i vyn Insikter — att slå ihop dem skulle ge tal som ser jämförbara ut utan
att vara det.

---

## 3. Vad som händer sedan

**Direkt när jag fått Meta- och Google-åtkomsten (dag 1)**
Jag skapar tokens och kör den första synken. Dashboarden byter från demodata till
riktiga siffror. **Samma vyer, inga kodändringar** — märkningen "DEMO" försvinner
bara.

**När jag fått affärsuppgifterna (punkt 3)**
Jag kopplar konton till kunder och lägger in månadsbudgetarna. Budgetpanelen och
larmen börjar visa rätt.

**Samma vecka**
Jag slår på den **nattliga automatiska synken** (kör 03:00 varje natt och hämtar
om de senaste 28 dagarna, så att sena konverteringar kommer med).

**Därefter**
Jag sätter upp databasen så att den startar med maskinen — annars slutar den
nattliga körningen tyst att fungera efter en omstart. Rent tekniskt, sköter jag.

**När vi vill**
Publicera dashboarden på en intern adress så att fler kan öppna den i webbläsaren
utan att starta något. Och koppla på Snapchat.

---

## Säkerheten, kort

- Du behöver **aldrig mejla lösenord eller nycklar**. Ge behörighet i plattformen
  — token skapas där.
- Alla nycklar ligger **bara i en lokal fil utanför Git**. Ingenting i koden,
  ingenting i repot.
- Meta-token blir en **System User-token**, kopplad till företaget och inte till
  en person.
- Allt jag begär är **läsbehörighet**. Systemet kan inte pausa en annons, ändra en
  budget eller röra en kampanj — inte ens av misstag.
- Dashboardens sida **Konton** visar vilka nycklar som saknas, men bara namnen på
  variablerna — aldrig värdena.

---

**Prioritet:** Meta blockerar mest — jag väntar bara på din admin-inbjudan. Google
kan vi köra parallellt direkt. Punkt 3 kan du fylla i när du har en lugn stund;
den behövs först när de första siffrorna är inne.

Hör av dig så bokar vi en kvart där jag visar dashboarden live och vi går igenom
punkt 3 tillsammans — det är snabbare än att skriva ihop listan i mejl.

Tack!
Lorenzo
