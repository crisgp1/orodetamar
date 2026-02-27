import puppeteer from 'puppeteer-core'

const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

// Homepage
console.log('1/6 Capturando homepage...')
await page.goto('https://www.taylorswines.com.au', { waitUntil: 'networkidle2', timeout: 30000 })
// Click age gate "Yes" button if present
try {
  const yesBtn = await page.$('button')
  if (yesBtn) {
    const text = await page.evaluate(el => el.textContent, yesBtn)
    if (text && text.trim().toLowerCase() === 'yes') {
      await yesBtn.click()
      await new Promise(r => setTimeout(r, 2000))
    }
  }
} catch (e) { /* age gate not present */ }
await page.screenshot({ path: 'docs/screenshots/taylors-home-full.png', fullPage: true })
await page.screenshot({ path: 'docs/screenshots/taylors-home-hero.png' })

// Collections / catalog page
console.log('2/6 Capturando catálogo...')
await page.goto('https://www.taylorswines.com.au/collections/all', { waitUntil: 'networkidle2', timeout: 30000 })
await page.screenshot({ path: 'docs/screenshots/taylors-catalog-full.png', fullPage: true })
await page.screenshot({ path: 'docs/screenshots/taylors-catalog-top.png' })

// Product detail page
console.log('3/6 Capturando producto...')
await page.goto('https://www.taylorswines.com.au/products/estate-label-sparkling-nv', { waitUntil: 'networkidle2', timeout: 30000 })
await page.screenshot({ path: 'docs/screenshots/taylors-product-full.png', fullPage: true })
await page.screenshot({ path: 'docs/screenshots/taylors-product-top.png' })

// Mobile views
console.log('4/6 Capturando mobile home...')
await page.setViewport({ width: 390, height: 844 })
await page.goto('https://www.taylorswines.com.au', { waitUntil: 'networkidle2', timeout: 30000 })
await page.screenshot({ path: 'docs/screenshots/taylors-home-mobile.png', fullPage: true })

console.log('5/6 Capturando mobile catálogo...')
await page.goto('https://www.taylorswines.com.au/collections/all', { waitUntil: 'networkidle2', timeout: 30000 })
await page.screenshot({ path: 'docs/screenshots/taylors-catalog-mobile.png', fullPage: true })

console.log('6/6 Capturando mobile producto...')
await page.goto('https://www.taylorswines.com.au/products/estate-label-sparkling-nv', { waitUntil: 'networkidle2', timeout: 30000 })
await page.screenshot({ path: 'docs/screenshots/taylors-product-mobile.png', fullPage: true })

await browser.close()
console.log('Listo! 8 capturas guardadas en docs/screenshots/')
