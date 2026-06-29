"""
Mappa account → cliente: popola `accounts.client_id` (e opzionalmente il budget
mensile) per i dati reali, così il pannello "budget per cliente" usa dati veri.

Uso:
  python map_accounts.py --list
  python map_accounts.py --file accounts_map.json
  python map_accounts.py --account act_123 --client "Nordic Talent AB" --budget 8000 [--platform meta]

Il file JSON è una lista di oggetti, es.:
  [
    {"external_id": "act_1000000001", "client": "Nordic Talent AB", "monthly_budget": 8000},
    {"external_id": "123-456-7890",   "client": "Aurora Studios",   "platform": "google"}
  ]

Nota: per Google l'external_id salvato dal connettore è in sole cifre (senza trattini).
"""
from __future__ import annotations

import argparse
import json

import db


def main() -> None:
    p = argparse.ArgumentParser(description="Mappa account → cliente")
    p.add_argument("--list", action="store_true", help="mostra la mappatura attuale")
    p.add_argument("--file", help="file JSON con la lista dei mapping")
    p.add_argument("--account", help="external_id dell'account")
    p.add_argument("--client", help="nome del cliente")
    p.add_argument("--budget", type=float, help="budget mensile (opzionale)")
    p.add_argument("--platform", help="filtra per piattaforma (opzionale)")
    args = p.parse_args()

    if args.list:
        for r in db.list_account_mapping():
            budget = "" if r["monthly_budget"] is None else f"  budget {r['monthly_budget']}"
            print(f"{r['platform']:9} {r['external_id']:22} -> "
                  f"{r['client_name'] or '(nessuno)'}{budget}")
        return

    if args.file:
        with open(args.file, encoding="utf-8") as fh:
            entries = json.load(fh)
    elif args.account and args.client:
        entries = [{
            "external_id": args.account, "client": args.client,
            "monthly_budget": args.budget, "platform": args.platform,
        }]
    else:
        p.error("usa --list, oppure --file <json>, oppure --account ... --client ...")
        return

    total = 0
    for e in entries:
        n = db.assign_client(
            e["external_id"], e["client"],
            e.get("monthly_budget"), e.get("platform"),
        )
        total += n
        print(f"[map] {e['external_id']} -> {e['client']}: {n} account aggiornati")
    print(f"[map] totale account aggiornati: {total}")


if __name__ == "__main__":
    main()
