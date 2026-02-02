Electron build notes (Windows)

Summary
-------
When building the Windows installer with `electron-builder` on Windows, the builder downloads and extracts helper tools (e.g., winCodeSign). During extraction, some archives contain symbolic links; extracting those archives requires a privilege to create symlinks on Windows. If extraction fails with a message like:

  "ERROR: Cannot create symbolic link : A required privilege is not held by the client"

then the build cannot complete.

Workarounds
-----------
- Option A (recommended): Run the build in an elevated Administrator PowerShell or CMD prompt. Example:
  - Right-click PowerShell → Run as administrator, then run `npm run electron:build`.
- Option B: Enable Windows Developer Mode (Settings → Update & Security → For developers) to allow creating symlinks without elevation.

Notes about signing & publishing
--------------------------------
- The app is configured to publish to GitHub Releases (see `package.json` `build.publish` - provider: "github").
- To publish using `electron-builder --publish=always` or CI, you need to set `GH_TOKEN` in your environment with appropriate repository permissions.
- Auto-update is integrated using `electron-updater` in `electron/main.js`. For end-to-end testing of updates, create a GitHub release and upload the generated artifacts (the builder can publish automatically when `GH_TOKEN` is present).

What I did in the repository
----------------------------
- Added backend files to packaged files (so the packaged app can spawn the backend server).
- Added `asarUnpack` for `backend/**` so backend files can be executed at runtime.
- Wired a basic `autoUpdater` flow in `electron/main.js` (checks for updates on startup when app is packaged).

If you want, I can attempt a build in an elevated session now (if you can provide elevated environment or run the command interactively).

Build attempt results
---------------------
- I attempted an elevated build from this environment, but the process couldn't extract the `winCodeSign` helper archives due to Windows symlink permission errors. Disabling signing and changing the target to `zip` still triggered the same extraction and failed with:

  "ERROR: Cannot create symbolic link : A required privilege is not held by the client"

- Root cause: extracting helper archives containing symbolic links requires either an Administrator session (UAC elevation) or Developer Mode enabled on Windows. See "Workarounds" below.

CI workflow
-----------
- I added a GitHub Actions workflow `.github/workflows/release.yml` that triggers on `v*` tags and builds on `windows-latest`, `macos-latest`, and `ubuntu-latest`.
- The workflow will publish artifacts to GitHub Releases automatically when `GH_TOKEN` is provided as a repository secret.

Workarounds & next steps
------------------------
- Local: open an **Administrator PowerShell** and run `npm run electron:build` (or enable Windows Developer Mode to allow symlink creation without elevation).
- CI: Use the provided GitHub Actions workflow and add a `GH_TOKEN` secret to the repository. Runners can extract helper archives and produce signed/unsigned artifacts depending on supplied secrets.
- I added a GitHub Actions workflow `.github/workflows/release.yml` that is tag-triggered and supports per-OS signing via repository secrets (see details below).

CI & Signing (recommended setup)
--------------------------------
1) Required secrets:
   - `GH_TOKEN` — GitHub token with `repo` write permissions. Used for publishing releases.
   - For Windows signing (optional, for signed NSIS or EXE builds):
     - `WINDOWS_PFX_BASE64` — Base64-encoded PFX certificate (export your PFX and encode with base64).
     - `WINDOWS_PFX_PASSWORD` — Password of the PFX file.
   - For macOS signing (optional):
     - `MAC_CERT_BASE64` — Base64-encoded macOS P12 certificate (if using).
     - `MAC_CERT_PASSWORD` — Password for the P12.
   - (Optional) For macOS notarization you may also provide `APPLE_ID` and `APP_SPECIFIC_PASSWORD`.

Embedded backend (zero-dependency installers)
--------------------------------------------
- The CI now builds platform-native backend binaries (using `pkg`) and includes them in installer artifacts so end-users do not need Node installed.
- Where the installer/copied resources are placed:
  - `electron/binaries/win/backend.exe` → packaged into `resources/binaries/win/backend.exe`
  - `electron/binaries/mac/backend` → packaged into `resources/binaries/mac/backend` (marked executable)
  - `electron/binaries/linux/backend` → packaged into `resources/binaries/linux/backend` (marked executable)
- The app's `main` process prefers an embedded backend binary at runtime when available, otherwise it falls back to running the JS server (`backend/server.js`).

Smoke tests in CI
-----------------
- The `test-build` workflow now runs a quick smoke test after building the embedded backend binary:
  - Starts the built binary on the runner briefly
  - Hits `GET /api/health` and expects the returned JSON to include `"mode":"embedded"`
  - Kills the binary
- This gives early feedback that the embedded binary runs and serves the offline endpoints.

PWA vs Electron (desktop vs mobile)
----------------------------------
- Goal: **Electron for desktop** and **PWA install for mobile only**.
- Implementation summary:
  - Frontend now checks for Electron (`navigator.userAgent` and `window.electronAPI`) and **prevents** service worker registration and install prompts when running inside Electron.
  - The `pwa-install.js` now detects Electron and disables the PWA install UI in desktop builds.
  - Each page's service worker registration is guarded with an Electron check so desktop won't register a service worker or show PWA UI.

How to test locally
-------------------
1. Desktop (Electron):
   - Run the packaged app or `npm run electron:dev`.
   - Confirm no PWA install button appears and the console logs `Running in Electron — PWA install disabled`.
2. Mobile/browser:
   - Open the site on a mobile device or emulator.
   - Confirm the install button appears on supported browsers or the iOS manual instructions appear.

This ensures users get the right install behavior depending on platform.
CI changes
----------
- The release workflow (`.github/workflows/release.yml`) and test workflow (`.github/workflows/test-build.yml`) run `pkg` on each platform before packaging to create the appropriate backend binary and add it to `electron/binaries/*`.
- These binaries are packaged as `extraResources` so they appear in `process.resourcesPath/binaries/...` at runtime.

Testing
-------
- Locally you can run `node tools/test-backend.js` (fast) or build the backend binary and run it directly. Example commands:

  - Windows (build): `npx pkg backend/server.js --targets node18-win-x64 --output electron/binaries/win/backend.exe`
  - Windows (run): `electron/binaries/win/backend.exe` (or run via PowerShell `Start-Process electron\\binaries\\win\\backend.exe`)

  - macOS (build): `npx pkg backend/server.js --targets node18-macos-x64 --output electron/binaries/mac/backend`
  - macOS (run): `./electron/binaries/mac/backend`

  - Linux (build): `npx pkg backend/server.js --targets node18-linux-x64 --output electron/binaries/linux/backend`
  - Linux (run): `./electron/binaries/linux/backend`

  After running, verify `GET /api/health` returns JSON with `"mode":"embedded"` to confirm embedded mode. For example: `curl http://localhost:5002/api/health`.

2) How to generate and add secrets (example for Windows PFX):
   - Export your code-sign certificate as a `.p12` or `.pfx` file from your signing provider.
   - On Unix/macOS: run `base64 -w 0 mycert.p12 > mycert.p12.b64` to generate a single-line base64 string.
   - On Windows (PowerShell): `Get-Content -Encoding Byte mycert.p12 | [System.Convert]::ToBase64String($_) > mycert.p12.b64` (or use a small Node script to encode).
   - Add the base64 string as the secret `WINDOWS_PFX_BASE64` and the certificate password as `WINDOWS_PFX_PASSWORD` in GitHub repository secrets.

3) How the workflow uses secrets:
   - The workflow decodes the base64 secret to a local file (e.g., `windows.p12`) and sets `CSC_LINK` and `CSC_KEY_PASSWORD` so `electron-builder` can sign the artifacts.
   - If `GH_TOKEN` is present, the workflow will call `electron-builder --publish=always` to create a GitHub release and upload artifacts; `electron-updater` can then use GitHub Releases for in-app updates.

Testing & validation
--------------------
- To test the full flow, push a tag like `v1.0.0`: `git tag v1.0.0 && git push origin v1.0.0`.
- The workflow will run, build platform artifacts, and (if `GH_TOKEN` is configured) publish a GitHub Release with the artifacts.
- Once a release is published, the packaged app (with `autoUpdater` integrated) can detect the update when run by a user and download/install updates as configured.

Notes and caveats
-----------------
- CI macOS signing and notarization require additional Apple credentials; this example workflow covers P12-based signing only.
- If you prefer not to store binary certs in secrets, consider hosting the certificate in a secure storage (S3 with a presigned URL) and set `CSC_LINK` to that URL.
- If you want, I can add optional workflow paths for creating a draft release first (for manual verification) before publishing automatically.

Next step: I can push a test `v0.0.1` tag to trigger the workflow once you confirm `GH_TOKEN` and any signing secrets you want to test are set in the repository. If you want me to proceed, say "Trigger test release".
