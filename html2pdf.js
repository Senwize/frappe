#!/usr/bin/env node
const puppeteer = require('puppeteer')
const fs = require('fs/promises')

async function printPDF(html) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.addStyleTag({
    content: `
    body {
      padding: 15mm;
    }
  `})

  const pdf = await page.pdf({ format: 'A4' });

  await browser.close();
  return pdf
}

async function bootstrap() {
  if (process.argv.length < 4) {
    throw "Requires atleast 2 args"
  }
  const input = process.argv[2]
  const output = process.argv[3]

  let html = '';
  if (input === '-') {
    process.stdin.on('data', (data) => {
      html += data.toString()
    })

    // Wait on stdin to end
    await new Promise(r => process.stdin.on('end', r))
  } else {
    html = await fs.readFile(input)
  }

  const pdf = await printPDF(html.toString())

  if (output === '-') {
    process.stdout.write(pdf);
  } else {
    await fs.writeFile(output, pdf)
  }
}

bootstrap().catch(e => {
  process.stderr.write(e + "\n")
  process.exit(1);
});
