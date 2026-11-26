# ENGage: udhëzuesi praktik

## Si nis

Dy klikime mbi `start.cmd`. Hapet `http://localhost:5173`. Për ta ndalur, mbyll dy dritaret që hapen.

## Si hyn

- User-at: `pmo`, `management`, `additional`, `linemanager`, `techlead`, `employee`, `hr`. Të gjithë kanë të njëjtin fjalëkalim.
- Fjalëkalimi nuk është në kod: gjendet te `backend/runtime/password.txt`, ose vendoset me `ENGAGE_PASSWORD`. Butonat e roleve te faqja e hyrjes e plotësojnë formën.
- Secili sheh vetëm dashboard-in e rolit të vet, me menu anash. Për të ndërruar rol: **Sign out**.

## Rrjedha (shembull: një new hire për projektin Atlas)

| Nr. | Kush | Çfarë bën | Ku |
|---|---|---|---|
| 1 | Additional Manager | kërkon një person | Ask HR → Ask HR for people |
| 2 | HR | e gjen dhe e dërgon | Requests → Send to Additional Manager |
| 3 | Additional Manager | cakton projektin dhe ekipin | Assign projects → Assign project |
| 4 | Technical Lead | jep detyra dhe plan mësimi | zgjedh personin → Assign task; Open case → Record an update → Set the learning plan |
| 5 | Employee | konfirmon aksesin, kryen detyrat | zgjedh personin; My work → It works; My profile → Mark as done |
| 6 | Technical Lead | konfirmon gatishmërinë, raporton | Open case → Record an update → Record activity progress; Validate readiness; Report to Line Manager |
| 7 | Line Manager | heq pengesat, raporton | Blockers → Assign owner and date, Mark as fixed; Progress → Report to Additional Manager |
| 8 | Additional Manager | raporton | Needs my action → Report to Management |
| 9 | Management dhe PMO | shohin rezultatin | Overview |

## Rolet

| Rol | Përgjegjësia |
|---|---|
| PMO | sheh të gjitha punët, sipas projektit dhe sipas punonjësit |
| Management | lexon raportet e Additional Manager dhe rreziqet |
| Additional Manager | kërkon punonjës, cakton projekte, raporton te Management |
| Line Manager | ndjek progresin dhe heq pengesat praktike |
| Technical Lead | jep detyra teknike dhe konfirmon gatishmërinë |
| Employee | sheh profilin, CV-në, projektet, detyrat dhe vlerësimet |
| HR | gjen personin e kërkuar, përshkrimet dhe CV-të |

## Pengesa praktike (blocker)

Diçka konkrete që e ndalon punonjësin: akses që mungon, kërkesë pa përgjigje, status "Blocked" pa arsye.

1. **Assign owner and date**: kush merret me të dhe kur kontrollohet. Pengesa mbetet e hapur.
2. Ndiqet në datën e caktuar.
3. **Mark as fixed**: vetëm kur është zgjidhur vërtet.

## Ku ruhen të dhënat

- Çdo regjistrim mbetet dhe nuk mbishkruhet; shihet te Evidence në faqen e rastit.
- **Pa databazë:** ruhen në `backend/runtime/state.json` (nuk shkon në Git) dhe mbeten edhe pas rindezjes. Për ta filluar demon nga e para: ndalo backend-in, fshi skedarin, nise sërish.
- **Me PostgreSQL:** krijo `backend/.env` me `DATABASE_URL`, pastaj `npm run build`, `npm run db:setup` dhe `npm run start` nga folderi `backend`. Hapat e plotë janë te [README](../README.md).
- **Të dhëna për demo:** me backend-in të ndezur, `npm run demo:data` nga folderi `backend`.

## Kufizime që duhen thënë hapur

- Hyrja është vetëm për demo: vendos cili dashboard shfaqet, por API-ja nuk e kontrollon, prandaj kufizimet sipas rolit nuk janë siguri.
- Problemet dhe hapat e radhës dalin nga rregulla fikse, jo nga AI. Analiza te Eva Stone është e simuluar; mesazhet janë shabllone dhe nuk dërgohen.
- Të gjitha të dhënat janë fiktive. Kontaktet e projekteve, raportet dhe vlerësimet e demos i ka shtuar ekipi.
