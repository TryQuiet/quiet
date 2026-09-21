# Test Quiet for Windows from Linux

Use a KVM-backed Windows VM for manual testing or the existing Electron E2E
onboarding tests. This recipe was tested on an x86-64 Ubuntu host with Windows 11
Enterprise Evaluation and Quiet **11.1.0-alpha.2**. The onboarding subset passed
all **10 tests**, including community creation, username registration, and sending
a message. This is not a full Windows E2E or multi-client test result.

## Create the VM

You need Docker Engine with Compose, access to `/dev/kvm` and `/dev/net/tun`, and
room for Windows and its tools. The example assigns 8 vCPUs, 16 GB RAM, and a
160 GB dynamically growing disk. Put the VM directory on a disk with sufficient
free space; verify an external drive is mounted before starting Docker Compose.

[Dockur Windows](https://github.com/dockur/windows) runs QEMU/KVM inside a
container and downloads Windows from Microsoft. `VERSION=11e` selects the
[Windows 11 Enterprise 90-day evaluation](https://www.microsoft.com/en-us/evalcenter/evaluate-windows-11-enterprise).
The evaluation expires; it is not a permanent Windows license.

In a new directory outside your Quiet checkout:

```bash
mkdir -p windows-quiet-vm/{storage,shared}
cd windows-quiet-vm
umask 077
printf 'VM_PASSWORD=%s\n' "$(openssl rand -hex 24)" > .env
```

Save this as `compose.yml`. The image digest is the version used for this recipe:

```yaml
services:
  windows:
    image: dockurr/windows@sha256:0cff9eb0e7aee9953e55bc682852ca4fdca233145a58ae1ec94f0b0c01a2ed30
    environment:
      VERSION: '11e'
      USERNAME: 'QuietTester'
      PASSWORD: '${VM_PASSWORD}'
      CPU_CORES: '8'
      RAM_SIZE: '16G'
      DISK_SIZE: '160G'
      DISK_FMT: 'qcow2'
      ALLOCATE: 'N'
    devices:
      - /dev/kvm
      - /dev/net/tun
    cap_add:
      - NET_ADMIN
    ports:
      - '127.0.0.1:8006:8006'
      - '127.0.0.1:3389:3389/tcp'
      - '127.0.0.1:3389:3389/udp'
    volumes:
      - ./storage:/storage
      - ./shared:/shared
    stop_grace_period: 2m
```

Run `docker compose up -d` and watch installation at <http://localhost:8006>.
Wait for the Windows desktop. Use `docker compose stop` to shut down gracefully;
`docker compose up -d` starts the same saved installation. Closing a viewer does
not stop Windows. The host's `shared/` folder appears as `\\host.lan\Data` in Windows.

## Connect with a clipboard-capable viewer

Use **RDP** for normal work. The QEMU VNC/browser console does not bridge the
Windows clipboard. On Ubuntu, install FreeRDP (`sudo apt install freerdp3-x11`)
and run this from a terminal in the Linux graphical desktop:

```bash
xfreerdp3 /v:127.0.0.1:3389 /u:QuietTester /d:. /from-stdin:force \
  /cert:tofu +clipboard +dynamic-resolution /size:1280x900 /title:"Quiet Windows VM"
```

Enter the generated password from `.env` when prompted. `/cert:tofu` remembers
the local VM's self-signed certificate; investigate an unexpected certificate
change. The password stays out of the command line.

For Chrome Remote Desktop, launch FreeRDP **inside that remote Linux desktop**.
If starting it over SSH, use the remote desktop's actual `DISPLAY` and
`XAUTHORITY` (not a hardcoded display number). The chain is your computer →
Chrome Remote Desktop → Linux clipboard → RDP → Windows. Enable clipboard access
in Chrome Remote Desktop too. Copy text again after connecting, then use Ctrl+V
inside Windows. Use the RDP window rather than the now-locked VNC console.

If the VNC console shows distorted graphics after resizing, turn off its
automatic resizing and select a standard Windows resolution, such as 1024×768.
RDP's own dynamic resizing avoids that console issue.

## Install Quiet

Inside Windows, download and run the Windows `.exe` from the desired
[Quiet desktop release](https://github.com/TryQuiet/quiet/releases). For an alpha,
choose a **desktop** prerelease, not a mobile release. The default per-user install
puts Quiet at `%LOCALAPPDATA%\Programs\@quietdesktop\Quiet.exe`, which is also the
path the E2E launcher expects. Open Quiet and check that its window responds.

For manual testing, that is all you need. The next section reproduces the smoke
test against the **11.1.0-alpha.2 installer**; use that installer for this example.

## Run the existing onboarding tests

Install [Node.js 20.20.1 for Windows](https://nodejs.org/dist/v20.20.1/) (includes
npm 10.8.2). Run the following in **Windows PowerShell in the logged-in desktop**,
not WSL or a Windows service session. It creates a separate harness with the
release's unchanged test sources and four internal packages. It does not require
Git, submodule credentials, native build tools, or a full monorepo bootstrap.

```powershell
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$version = '11.1.0-alpha.2'
$work = Join-Path $env:USERPROFILE 'quiet-windows-smoke'
if (Test-Path $work) { throw "Use a fresh directory: $work already exists" }
New-Item -ItemType Directory $work | Out-Null
Set-Location $work
$tag = [uri]::EscapeDataString("@quiet/desktop@$version")
Invoke-WebRequest -UseBasicParsing "https://api.github.com/repos/TryQuiet/quiet/zipball/$tag" -OutFile source.zip
Expand-Archive source.zip source
$source = (Get-ChildItem source -Directory | Select-Object -First 1).FullName

$packages = @('e2e-tests', 'common', 'logger', 'node-common', 'types')
foreach ($name in $packages) {
  New-Item -ItemType Directory "packages/$name" -Force | Out-Null
  Copy-Item "$source/packages/$name/src" "packages/$name/src" -Recurse
}
$e2e = Get-Content "$source/packages/e2e-tests/package.json" -Raw | ConvertFrom-Json
$deps = @{}
$groups = @($e2e.dependencies, $e2e.devDependencies)
foreach ($name in @('common', 'logger', 'node-common')) {
  $package = Get-Content "$source/packages/$name/package.json" -Raw | ConvertFrom-Json
  $groups += $package.dependencies
}
foreach ($group in $groups) {
  foreach ($dep in $group.PSObject.Properties) {
    if ($dep.Name -notlike '@quiet/*' -and $dep.Name -notin @('backend-bundle', 'lint-staged', 'electron-chromedriver-126')) {
      $deps[$dep.Name] = $dep.Value
    }
  }
}
# Match the release lockfile; newer Selenium versions require newer Node.
$deps['selenium-webdriver'] = '4.43.0'
$manifest = @{ name = 'quiet-windows-smoke'; version = '1.0.0'; private = $true; dependencies = $deps }
# Windows PowerShell's Set-Content -Encoding UTF8 adds a BOM; Jest's resolver rejects it.
[IO.File]::WriteAllText("$work/package.json", ($manifest | ConvertTo-Json -Depth 10))
@'
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/packages/e2e-tests/src'],
  testMatch: ['**/*.test.ts'],
  transform: {'^.+\\.tsx?$': ['ts-jest', {
    diagnostics: false,
    tsconfig: {isolatedModules: true, target: 'ES2020', module: 'commonjs', esModuleInterop: true}
  }]},
  moduleNameMapper: {'^@quiet/(common|logger|node-common|types)$': '<rootDir>/packages/$1/src/index.ts'},
  setupFilesAfterEnv: ['<rootDir>/packages/e2e-tests/src/setupTests.ts']
}
'@ | Set-Content jest.config.cjs -Encoding UTF8
npm.cmd install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed' }
```

Keep the generated `package-lock.json`; use `npm.cmd ci` to reinstall that exact
harness. From the same PowerShell window and directory:

```powershell
$env:TEST_MODE = 'true'
$env:IS_E2E = 'true'
$env:IS_CI = 'true'
$env:SE_SKIP_DRIVER_IN_PATH = 'true'
$env:LOG_TO_FILE = 'false'
$env:FILE_NAME = "Quiet Setup $version.exe"
node.exe node_modules/jest/bin/jest.js oneClient.test.ts --runInBand --detectOpenHandles --forceExit `
  --testNamePattern 'User opens app for the first time' --json --outputFile onboarding-results.json
if ($LASTEXITCODE -ne 0) { throw 'Onboarding tests failed; see onboarding-results.json' }
```

For this release, expect **10 passed, 23 skipped**. The skipped tests are outside
the selected onboarding group. The harness transpiles TypeScript; it is not a
typecheck. Tests use separate `e2e_*` data directories, retained under `%APPDATA%`
because `IS_CI=true`. Open a fresh PowerShell window before launching Quiet for
manual use so it does not inherit the test environment variables.

The full [Windows E2E workflow](../../../.github/workflows/e2e-win.yml) builds the
app and backend from source. This lightweight harness does not include the backend
bundle required by the hanging-backend test, so do not remove the test-name filter
and assume the full suite is supported. See also the [E2E README](../../e2e-tests/README.md).

If you later automate commands through the shared folder, run them in the logged-in
Windows session. To see host-created jobs promptly, we disabled SMB metadata caching
in an elevated PowerShell:

```powershell
Set-SmbClientConfiguration -DirectoryCacheLifetime 0 -FileInfoCacheLifetime 0 -FileNotFoundCacheLifetime 0 -Force
```

When collecting process exit codes,
retain the `Start-Process -PassThru` object's `.Handle` before `.WaitForExit()` and
read `.ExitCode`; `Start-Process -Wait` also waits for spawned GUI descendants.
