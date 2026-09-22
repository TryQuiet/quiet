import fs from 'fs'
import path from 'path'

/** Read only newly written application log text, including daily log rotation. */
export class ApplicationLogReader {
  private offsets = new Map<string, number>()

  constructor(private readonly directory: string) {}

  readNew(): string {
    if (!fs.existsSync(this.directory)) return ''
    const output: string[] = []
    for (const name of fs
      .readdirSync(this.directory)
      .filter(name => /^log_.*\.log$/.test(name))
      .sort()) {
      const content = fs.readFileSync(path.join(this.directory, name), 'utf8')
      const previous = this.offsets.get(name) ?? 0
      // A truncated file starts a new stream, just like a newly rotated file.
      output.push(content.slice(previous <= content.length ? previous : 0))
      this.offsets.set(name, content.length)
    }
    return output.join('')
  }

  reset(): void {
    // Advance each existing file to its current end without retaining its text.
    this.readNew()
  }
}
