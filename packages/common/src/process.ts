import { type SupportedPlatform } from '@quiet/types'

/**
 *  Commands should output hanging backend pid
 */
export const hangingBackendProcessCommand = ({
  backendBundlePath,
  dataDir,
}: {
  backendBundlePath: string
  dataDir: string
}): string => {
  const byPlatform = {
    android: `pgrep -af "${backendBundlePath}" | grep -v pgrep | grep -e "${dataDir}$" -e "${dataDir}[[:space:]]" | awk '{print $1}'`,
    linux: `pgrep -af "${backendBundlePath}" | grep -v egrep | grep -e "${dataDir}$" -e "${dataDir}[[:space:]]" | awk '{print $1}'`,
    darwin: `ps -A | grep "${backendBundlePath}" | grep -v egrep | grep -e "${dataDir}$" -e "${dataDir}[[:space:]]" | awk '{print $1}'`,
    win32: `powershell "Get-WmiObject Win32_process -Filter {commandline LIKE '%${backendBundlePath.replace(
      /\\/g,
      '\\\\'
    )}%' and commandline LIKE '%${dataDir.replace(
      /\\/g,
      '\\\\'
    )}%' and name = 'Quiet.exe'} | Format-Table ProcessId -HideTableHeaders"`,
  }
  return byPlatform[process.platform as SupportedPlatform]
}
