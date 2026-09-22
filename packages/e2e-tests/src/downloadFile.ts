import { execFileSync } from 'child_process'

export const downloadFile = (url: string, destination: string): void => {
  // HTTP errors must throw before an error page can be used as an installer.
  execFileSync('curl', ['--fail', '--location', '--output', destination, url])
}
