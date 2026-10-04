# JIS Proposed Dummy Dataset

> **Instructions:** Review the proposed dummy data below. You can edit names, emails, dates, charges, or statuses directly in this file (`docs/dummy-data.md`). Once you are satisfied with the data, let me know, and I will reset the database tables and reseed everything using this exact data.

---

## 1. User Accounts (`User` Model)

| ID / Key | Full Name | Email Address | Role | Default Password | Description |
|---|---|---|---|---|---|
| `user-reg-1` | Chief Judicial Registrar | `registrar@jis.in` | `REGISTRAR` | `Registrar@123` | Principal Registry Admin |
| `user-jdg-1` | Hon. Justice V. K. Sen | `judge@jis.in` | `JUDGE` | `Judge@123` | Senior Presiding Judge (Bench 1) |
| `user-jdg-2` | Hon. Justice Priya Sharma | `judge2@jis.in` | `JUDGE` | `Judge@123` | Presiding Judge (Bench 2) |
| `user-law-1` | Adv. Rajesh Raman | `lawyer@jis.in` | `LAWYER` | `Lawyer@123` | Senior Defense Counsel |
| `user-pro-1` | Adv. Vikram Malhotra | `prosecutor@jis.in` | `LAWYER` | `Lawyer@123` | Special Public Prosecutor |
| `user-law-2` | Adv. Meera Nair | `lawyer2@jis.in` | `LAWYER` | `Lawyer@123` | Associate Defense Counsel |

---

## 2. Courtroom Bench Allocations (`Courtroom` Model)

| ID / Key | Courtroom Name | Facility Location | Daily Max Slots | Active Status |
|---|---|---|---|---|
| `cr-101` | Courtroom 101 - Principal Bench | Block A, 1st Floor | 5 hearings / day | `true` |
| `cr-102` | Courtroom 102 - Civil Division | Block A, 1st Floor | 6 hearings / day | `true` |
| `cr-201` | Courtroom 201 - Criminal Bench | Block B, 2nd Floor | 4 hearings / day | `true` |
| `cr-202` | Courtroom 202 - Commercial Bench | Block B, 2nd Floor | 5 hearings / day | `true` |

---

## 3. Case Registry (`Case` Model)

| CIN | Defendant Name | Defendant Address | Legal Offense / Charge | Crime Location | Arresting Officer | Status | Judge | Prosecutor | Defense Counsel |
|---|---|---|---|---|---|---|---|---|---|
| `CIN-2026-001` | Alok Verma | 42 Park Street, Flat 4B, South Zone | BNS Sec 318 & 316 (Cheating & Criminal Breach of Trust) | Financial District Commercial Tower | Insp. Devendra Joshi (Crime Branch) | `REGISTERED` | Hon. Justice V. K. Sen | Adv. Vikram Malhotra | Adv. Rajesh Raman |
| `CIN-2026-002` | Sunita Mehta | 12 Railway Colony Road, Sector 3 | BNS Sec 303 & 317 (Theft & Receiving Stolen Property) | Central Railway Freight Yard, Warehouse 9 | SI Anand Kulkarni (RPF) | `PENDING` | Hon. Justice V. K. Sen | Adv. Vikram Malhotra | Adv. Rajesh Raman |
| `CIN-2026-003` | Deepak Rao | 78 Shanti Nagar, Lane 5, East District | BNS Sec 109 & 117 (Attempt to Murder & Grievous Hurt) | National Highway 48 Toll Plaza | Insp. Rakesh Sawant (City Police) | `PENDING` | Hon. Justice Priya Sharma | Adv. Vikram Malhotra | Adv. Meera Nair |
| `CIN-2026-004` | Sanjay Grover | 105 Crystal Plaza, Outer Ring Road | NI Act Sec 138 (Cheque Dishonour for Insufficient Funds) | Apex Mercantile Bank, Main Branch | SI Kavita Shinde (EOW) | `ADJOURNED` | Hon. Justice V. K. Sen | Adv. Vikram Malhotra | Adv. Rajesh Raman |
| `CIN-2026-005` | Arvind Swaminathan | B-201 Green Meadows, Cantonment | PC Act Sec 13 (Criminal Misconduct by Public Servant) | Municipal Treasury Office | DSP Pradeep Nair (Anti-Corruption) | `ADJOURNED` | Hon. Justice Priya Sharma | Adv. Vikram Malhotra | Adv. Meera Nair |
| `CIN-2026-006` | Ramesh Patel | 23 GIDC Industrial Area, Phase 2 | BNS Sec 281 & 125 (Rash Driving & Endangering Life) | Eastern Express Highway, Km 14 | SI Suresh Gaikwad (Traffic Division) | `RESOLVED` | Hon. Justice V. K. Sen | Adv. Vikram Malhotra | Adv. Rajesh Raman |
| `CIN-2026-007` | Vikram Singhania | 14 Altamount Heights, High Court Marg | BNS Sec 336 & 340 (Forgery & Fraudulent Conveyance) | Sub-Registrar Office of Land Records | Insp. Devendra Joshi (Crime Branch) | `CLOSED` | Hon. Justice V. K. Sen | Adv. Vikram Malhotra | Adv. Rajesh Raman |
| `CIN-2026-008` | Meera Deshmukh | 602 Silicon Residency, Electronic City | IT Act Sec 66C & 66D (Identity Theft & Impersonation) | Infotech Cyber Park, Server Room B | Insp. Neha Saxena (Cyber Crime Cell) | `CLOSED` | Hon. Justice Priya Sharma | Adv. Vikram Malhotra | Adv. Meera Nair |
| `CIN-2026-009` | Karan Oberoi | 88 Marine Drive, Sea Face Towers | BNS Sec 308 & 351 (Extortion & Criminal Intimidation) | Regal Hotel Banquet Hall, Colaba | ACP Ashok Kamble (Anti-Extortion) | `CLOSED` | Hon. Justice V. K. Sen | Adv. Vikram Malhotra | Adv. Rajesh Raman |
| `CIN-2026-010` | Harish Chawla | 54 Grain Market, Old Bazaar | BNS Sec 318(4) & 338 (Commercial Tax Evasion & Forgery) | Commercial Tax Assessment Office | SI Anand Kulkarni (Tax Enforcement) | `CLOSED` | Hon. Justice Priya Sharma | Adv. Vikram Malhotra | Adv. Rajesh Raman |

---

## 4. Court Hearings & Session Listings (`Hearing` Model)

| Case CIN | Courtroom | Hearing Date & Time | Status | Proceeding Summary | Adjournment Reason | Next Hearing Date |
|---|---|---|---|---|---|---|
| `CIN-2026-002` | Courtroom 101 - Principal Bench | **Today · 10:30 AM IST** | `SCHEDULED` | *(Live hearing session on today's Daily Cause List)* | — | — |
| `CIN-2026-003` | Courtroom 201 - Criminal Bench | **Today · 02:00 PM IST** | `SCHEDULED` | *(Live hearing session on today's Daily Cause List)* | — | — |
| `CIN-2026-003` | Courtroom 201 - Criminal Bench | 20 days ago | `COMPLETED` | Bail application dismissed; formal charge sheet framed under BNS Sec 109 & 117; summons issued to prosecution eyewitnesses. | — | Today · 02:00 PM |
| `CIN-2026-004` | Courtroom 102 - Civil Division | 35 days ago | `COMPLETED` | Plea recorded; defendant entered not guilty; complainant affidavit of evidence taken on record. | — | 5 days ago |
| `CIN-2026-004` | Courtroom 102 - Civil Division | 5 days ago | `ADJOURNED` | — | Absence of key forensic handwriting examiner due to medical hospitalization. | 14 days ahead |
| `CIN-2026-004` | Courtroom 102 - Civil Division | 14 days ahead | `SCHEDULED` | Hearing scheduled for examination of handwriting expert witness. | — | — |
| `CIN-2026-005` | Courtroom 201 - Criminal Bench | 40 days ago | `COMPLETED` | Preliminary audit registers and financial ledger copies placed on court record. | — | 3 days ago |
| `CIN-2026-005` | Courtroom 201 - Criminal Bench | 3 days ago | `ADJOURNED` | — | Prosecution requested 10 days to verify certified treasury ledger copies. | 10 days ahead |
| `CIN-2026-006` | Courtroom 101 - Principal Bench | 25 days ago | `COMPLETED` | Site inspection report by Motor Vehicles Inspector examined and marked as Exhibit P-1. | — | 6 days ago |
| `CIN-2026-006` | Courtroom 101 - Principal Bench | 6 days ago | `COMPLETED` | Final statutory summation concluded by both counsels. Judgment reserved. | — | — |
| `CIN-2026-007` | Courtroom 101 - Principal Bench | 80 days ago | `COMPLETED` | Prosecution opened arguments; 4 witness depositions recorded. | — | 50 days ago |
| `CIN-2026-007` | Courtroom 101 - Principal Bench | 50 days ago | `COMPLETED` | Defense witness cross-examinations concluded. | — | 15 days ago |
| `CIN-2026-007` | Courtroom 101 - Principal Bench | 15 days ago | `COMPLETED` | Final statutory summation delivered; judgment date designated. | — | — |
| `CIN-2026-008` | Courtroom 201 - Criminal Bench | 70 days ago | `COMPLETED` | Digital forensic hard drive contents examined in in-camera session. | — | 22 days ago |
| `CIN-2026-008` | Courtroom 201 - Criminal Bench | 22 days ago | `COMPLETED` | Cyber cell investigating officer cross-examined regarding IP log hash chain discrepancies. | — | — |
| `CIN-2026-009` | Courtroom 101 - Principal Bench | 100 days ago | `COMPLETED` | Voice sample acoustic spectrogram match verified by CFSL experts. | — | 50 days ago |
| `CIN-2026-009` | Courtroom 101 - Principal Bench | 50 days ago | `COMPLETED` | Final arguments concluded. Judgment reserved. | — | — |
| `CIN-2026-010` | Courtroom 201 - Criminal Bench | 130 days ago | `COMPLETED` | Tax assessment vouchers and invoices marked as court exhibits. | — | 75 days ago |
| `CIN-2026-010` | Courtroom 201 - Criminal Bench | 75 days ago | `COMPLETED` | Compounding deed between State and defendant placed on record. | — | — |

---

## 5. Judicial Decrees & Verdicts (`Judgment` Model)

| Case CIN | Judgment Date | Judicial Verdict / Decree Summary |
|---|---|---|
| `CIN-2026-006` | 5 days ago | The defendant pleaded guilty under summary judicial procedure. The Court hereby imposes a statutory judicial fine of ₹10,000/- with an official endorsement on driving credentials. Fine verified as deposited with the court treasury. Matter stands formally resolved. |
| `CIN-2026-007` | 12 days ago | Upon thorough evaluation of all 14 prosecution witness depositions and forensic document analysis confirming deliberate alteration of land title records, the Court finds the accused guilty beyond reasonable doubt under Section 336 read with Section 340 BNS. Sentenced to 2 years rigorous imprisonment and ₹50,000 statutory fine. Case docket officially closed. |
| `CIN-2026-008` | 18 days ago | The prosecution failed to establish an unbroken chain of custody regarding the seizure of the questioned digital apparatus and IP log mappings. In accordance with established criminal jurisprudence, the benefit of doubt is accorded to the defendant. The accused is hereby acquitted of all charges under the Information Technology Act. Case record closed. |
| `CIN-2026-009` | 45 days ago | The accused stands convicted under Section 308 BNS. Recorded audio communications corroborated by Central Forensic Science Laboratory acoustic spectrogram analysis. The Court sentences the convict to 18 months simple imprisonment. Case docket marked closed. |
| `CIN-2026-010` | 70 days ago | A compounded statutory settlement was reached between the State Revenue Department and the defendant under Section 320 BNSS. All defaulted tax liabilities and compounded judicial fees stand discharged in full. Final closing decree entered. |

---

## 6. Lawyer Precedent Access Records (`CaseView` Model)

*Demonstrates lawyer billing (₹50 per closed case dossier view)*

| Lawyer Account | Case CIN Viewed | Access Timestamp | Charge Amount |
|---|---|---|---|
| `lawyer@jis.in` (Adv. Rajesh Raman) | `CIN-2026-007` | 3 days ago | ₹50.00 |
| `lawyer@jis.in` (Adv. Rajesh Raman) | `CIN-2026-008` | 7 days ago | ₹50.00 |
| `lawyer@jis.in` (Adv. Rajesh Raman) | `CIN-2026-009` | 35 days ago (Last billing cycle) | ₹50.00 |

---

## 7. Administrative Audit Log Entries (`AuditLog` Model)

| Actor | Action | Entity Affected | Entity ID | Log Details | Timestamp |
|---|---|---|---|---|---|
| `registrar@jis.in` | `CASE_STATUS_CHANGED` | `Case` | `CIN-2026-007` | `{"status": "CLOSED", "remarks": "Decree executed; docket closed"}` | 12 days ago |
| `registrar@jis.in` | `JUDGMENT_RECORDED` | `Judgment` | `CIN-2026-008` | `{"summary": "Acquittal judgment entered into registry"}` | 18 days ago |
| `registrar@jis.in` | `HEARING_ADJOURNED` | `Hearing` | `CIN-2026-004` | `{"reason": "Expert witness medical leave"}` | 5 days ago |
| `registrar@jis.in` | `HEARING_SCHEDULED` | `Hearing` | `CIN-2026-002` | `{"courtroom": "Courtroom 101 - Principal Bench", "time": "10:30 IST"}` | 1 day ago |
| `registrar@jis.in` | `CASE_REGISTERED` | `Case` | `CIN-2026-001` | `{"defendant": "Alok Verma", "crime": "BNS 318 & 316"}` | 1 day ago |
