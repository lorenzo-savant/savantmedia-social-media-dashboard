"""
Configurazione centralizzata.

REGOLA: nessun segreto nel codice. Tutto arriva da variabili d'ambiente
(file .env in locale, secret manager in produzione). Questo è esattamente
ciò che ha causato la fuga di chiavi su GitHub di cui parlava Rebecca:
qui i token NON toccano mai il repo.
"""
import os
import pathlib


def _load_dotenv() -> None:
    """Carica il file .env dalla root del progetto, senza dipendenze esterne.

    Non sovrascrive variabili già presenti nell'ambiente reale (os.environ vince
    sempre): così in produzione i segreti arrivano dal secret manager, non dal file.
    """
    env_path = pathlib.Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_dotenv()


def _require(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(
            f"Variabile d'ambiente mancante: {name}. "
            f"Copiala da .env.example in .env e valorizzala."
        )
    return val


# --- Database ---------------------------------------------------------------
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://localhost:5432/savant_ads"
)

# --- Meta Marketing API -----------------------------------------------------
# Il token lo incolli QUI (via .env) quando Rebecca ti dà l'accesso admin e
# generi il System User token. Fino ad allora resta vuoto e il connettore Meta
# semplicemente non gira: il resto della dashboard funziona lo stesso.
META_API_VERSION = os.environ.get("META_API_VERSION", "v25.0")
META_ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN", "")
# Lista di ad account da leggere, separati da virgola: "act_123,act_456"
META_AD_ACCOUNTS = [
    a.strip() for a in os.environ.get("META_AD_ACCOUNTS", "").split(",") if a.strip()
]

# Quanti giorni indietro ri-scaricare a ogni sync. 28 = finestra di attribuzione
# di Meta, che aggiorna i dati storici man mano che le conversioni maturano.
LOOKBACK_DAYS = int(os.environ.get("LOOKBACK_DAYS", "28"))

# Soglia (%) di utilizzo rate limit oltre la quale rallentiamo. Meta dà errore 17
# al 100%; teniamoci sotto.
RATE_LIMIT_THROTTLE_PCT = int(os.environ.get("RATE_LIMIT_THROTTLE_PCT", "80"))


def meta_is_configured() -> bool:
    return bool(META_ACCESS_TOKEN and META_AD_ACCOUNTS)


# --- Google Ads API ---------------------------------------------------------
# Explorer Access è disponibile subito (nessuna approvazione lenta). Credenziali
# OAuth2 + developer token via .env; nessun segreto nel codice.
GOOGLE_API_VERSION = os.environ.get("GOOGLE_API_VERSION", "v24")
GOOGLE_DEVELOPER_TOKEN = os.environ.get("GOOGLE_DEVELOPER_TOKEN", "")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REFRESH_TOKEN = os.environ.get("GOOGLE_REFRESH_TOKEN", "")
# Manager account (MCC) sotto cui girano le query, solo cifre. Opzionale.
GOOGLE_LOGIN_CUSTOMER_ID = os.environ.get("GOOGLE_LOGIN_CUSTOMER_ID", "")
# Account da leggere, separati da virgola: "123-456-7890,987-654-3210"
GOOGLE_CUSTOMER_IDS = [
    a.strip() for a in os.environ.get("GOOGLE_CUSTOMER_IDS", "").split(",") if a.strip()
]


def google_is_configured() -> bool:
    return bool(
        GOOGLE_DEVELOPER_TOKEN and GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
        and GOOGLE_REFRESH_TOKEN and GOOGLE_CUSTOMER_IDS
    )
