# PhishDestroy UI Wireframes

## 1. Campaign Detail: Damage Ledger Card

Displays per-currency financial impact.

```text
+-------------------------------------------------------------+
| Damage Ledger                                               |
|-------------------------------------------------------------|
| Total Claimed: $1,250,000 USD                               |
| Total Confirmed: $840,000 USD                               |
|                                                             |
| Breakdown:                                                  |
| - BTC:  15.2 (Confirmed: 10.1)                              |
| - ETH: 145.0 (Confirmed: 120.0)                             |
| - XMR: 450.0 (Confirmed: 450.0)                             |
+-------------------------------------------------------------+
```

## 2. Campaign Detail: Infrastructure Profile Card

Displays technical indicators and setup details.

```text
+-------------------------------------------------------------+
| Infrastructure Profile                                      |
|-------------------------------------------------------------|
| Tech Stack:          Nginx, React, Node.js                  |
| Auth Model:          OAuth2 Phishing Reverse Proxy          |
| Source Maps:         EXPOSED                                |
| Subdomain Roles:                                            |
|   - auth.xyz.*   : Credential Harvesting                    |
|   - static.xyz.* : Payload Delivery                         |
+-------------------------------------------------------------+
```

## 3. /actors List View

Table view of tracked threat actors.

```text
+-----------------------------------------------------------------------------------+
| Threat Actors                                                         [Search...] |
|-----------------------------------------------------------------------------------|
| ID       | Aliases          | Status   | Primary Motivation | Linked Campaigns    |
|----------|------------------|----------|--------------------|---------------------|
| ACT-001  | "Pudding", "P1"  | Active   | Financial          | CAM-102, CAM-104    |
| ACT-002  | "NeonProxy"      | Inactive | Espionage          | CAM-099             |
+-----------------------------------------------------------------------------------+
```

## 4. /actors/[id] Detail View

Comprehensive profile of a single actor.

```text
+-----------------------------------------------------------------------------------+
| ACT-001 ("Pudding")                                       [Unlock PII - Audited]  |
|-----------------------------------------------------------------------------------|
| IDENTITY PANEL                                                                    |
| Real Name: [LOCKED]                                                               |
| Email(s):  [LOCKED]                                                               |
| Location:  Eastern Europe (Inferred)                                              |
|                                                                                   |
| LINKED CAMPAIGNS                     CO-MEMBERSHIP GRAPH                          |
| - CAM-102: Operation Phish           [ ACT-001 ] ---- [ ACT-004 ]                 |
| - CAM-104: Finance Target                 |                                       |
|                                      [ ACT-005 ]                                  |
|                                                                                   |
| SCREENSHOT GALLERY                                                                |
| [ IMG 1 ] [ IMG 2 ] [ IMG 3 ]                                                     |
+-----------------------------------------------------------------------------------+
```
