param([Parameter(Mandatory=$true)][string]$Directory, [switch]$Cleanup)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
# Actions may launch us from PowerShell 7: load only Windows PowerShell's own modules.
$env:PSModulePath = Join-Path $PSHOME 'Modules'
Import-Module (Join-Path $PSHOME 'Modules/Microsoft.PowerShell.Security/Microsoft.PowerShell.Security.psd1') -ErrorAction Stop
Import-Module (Join-Path $PSHOME 'Modules/PKI/PKI.psd1') -ErrorAction Stop
$tracking = Join-Path $Directory 'test-certificates.json'
if ($Cleanup) {
  if (Test-Path $tracking) {
    foreach ($thumbprint in (Get-Content $tracking | ConvertFrom-Json)) {
      foreach ($store in @('CurrentUser\My', 'LocalMachine\Root', 'CurrentUser\TrustedPublisher')) {
        $certificate = "Cert:\$store\$thumbprint"
        if (Test-Path $certificate) { Remove-Item $certificate -Force }
      }
    }
  }
  exit 0
}
$certificates = @()
try {
  foreach ($name in @('Quiet Updater Test', 'Other Updater Test')) {
    $certificate = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=$name, O=$name" -CertStoreLocation Cert:\CurrentUser\My -NotAfter (Get-Date).AddDays(1)
    $certificates += $certificate
    ConvertTo-Json @($certificates | ForEach-Object Thumbprint) | Set-Content $tracking
    $public = Join-Path $Directory "$name.cer"
    Export-Certificate -Cert $certificate -FilePath $public | Out-Null
    # User Root imports require a confirmation UI. The disposable Windows CI runner
    # is elevated; use its machine Root store and remove only our tracked certificate.
    Import-Certificate -FilePath $public -CertStoreLocation Cert:\LocalMachine\Root | Out-Null
    Import-Certificate -FilePath $public -CertStoreLocation Cert:\CurrentUser\TrustedPublisher | Out-Null
  }
  $unsigned = Join-Path $Directory 'unsigned.exe'
  Add-Type -TypeDefinition 'public class QuietInstallerFixture { public static void Main() { var p = System.Environment.GetEnvironmentVariable("QUIET_TEST_INSTALLED"); if (p != null) System.IO.File.WriteAllText(p, "installed"); } }' -OutputAssembly $unsigned -OutputType ConsoleApplication
  foreach ($entry in @(@('valid.exe', $certificates[0]), @('wrong.exe', $certificates[1]))) {
    $destination = Join-Path $Directory $entry[0]
    Copy-Item $unsigned $destination
    $signature = Set-AuthenticodeSignature -FilePath $destination -Certificate $entry[1] -HashAlgorithm SHA256
    if ($signature.Status -ne 'Valid') { throw "Fixture signing failed: $($signature.Status)" }
  }
} catch {
  & $PSCommandPath -Directory $Directory -Cleanup
  throw
}
