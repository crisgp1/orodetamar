import puppeteer, { type Browser } from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'

const CHROMIUM_REMOTE_URL =
  'https://github.com/nichochar/chromium-binaries/raw/main/chromium-v131.0.1-pack.tar'

export async function getBrowser(): Promise<Browser> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const executablePath = await chromium.executablePath(CHROMIUM_REMOTE_URL)
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720 },
      executablePath,
      headless: true,
    })
  }

  return puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath:
      process.env.CHROME_EXECUTABLE_PATH ||
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    headless: true,
  })
}
