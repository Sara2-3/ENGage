# ENGage: udhëzuesi praktik

## Si nis

Dy klikime mbi `start.cmd`. Hapet `http://localhost:5173`. Për ta ndalur, mbyll dy dritaret që hapen.

## Rrjedha (shembull: një new hire për projektin Atlas)

| Nr. | Kush | Çfarë bën | Ku |
|---|---|---|---|
| 1 | Additional Manager | kërkon një person | Ask HR for people |
| 2 | HR | e gjen dhe e dërgon | New hires → Send to Additional Manager |
| 3 | Additional Manager | cakton projektin dhe ekipin | Waiting for a project → Assign project |
| 4 | Technical Lead | jep detyra dhe plan mësimi | Assign task; Open case → Record an update → Set the learning plan |
| 5 | Employee | konfirmon aksesin, kryen detyrat | My work → It works; My profile → Mark as done |
| 6 | Technical Lead | konfirmon gatishmërinë, raporton | Record activity progress; Review evidence and decide; Report to Line Manager |
| 7 | Line Manager | heq pengesat, raporton | Assign owner and date; Mark as fixed; Report to Additional Manager |
| 8 | Additional Manager | raporton | Report to Management |
| 9 | Management dhe PMO | shohin rezultatin | Dashboard |

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

- Gjithçka që futet (kërkesa, caktime, detyra, raporte, vlerësime, pengesa, CV të ngarkuara) ruhet në `backend/runtime/state.json` dhe **mbetet edhe pas rindezjes**.
- Asgjë nuk fshihet dhe nuk mbishkruhet: çdo regjistrim mbetet dhe shihet te Evidence në faqen e rastit.
- Skedari nuk shkon në Git.
- **Për të filluar demon nga e para:** ndalo backend-in, fshi `backend/runtime/state.json`, nise sërish.

## Kufizime që duhen thënë hapur

- Nuk ka login: roli zgjidhet në ekran, prandaj kufizimet sipas rolit nuk janë siguri.
- Problemet dhe hapat e radhës dalin nga rregulla fikse, jo nga AI. Analiza te Eva Stone është e simuluar; mesazhet janë shabllone dhe nuk dërgohen.
- Të gjitha të dhënat janë fiktive.
