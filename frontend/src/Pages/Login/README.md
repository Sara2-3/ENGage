# Login

Own folders, to avoid merge conflicts: `frontend/src/auth/` and `backend/src/auth/`.
Only two existing files are wired to them: `frontend/src/main.tsx` and `backend/src/app.module.ts`.

## Usernames

`pmo`, `management`, `additional`, `linemanager`, `techlead`, `employee`, `hr`

All use the same password. It is not stored in the code or in Git:

- on first sign-in the backend creates `backend/runtime/password.txt` with a random value;
- edit that file to choose your own, or set `ENGAGE_PASSWORD` before starting the backend.

## Limits

The login protects the screens only. Each user sees only their own role's dashboard, but the API
does not check the login. It is a demo entry door, not security.

The role buttons under the form fill in the username and the local demo password, which the
backend hands to the page (`GET /auth/demo`). So anyone who can open the page can sign in. A
password set with `ENGAGE_PASSWORD` is never sent to the browser and the buttons then fill only the
username.
