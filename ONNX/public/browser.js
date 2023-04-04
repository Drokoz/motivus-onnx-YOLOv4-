const playwright = require("playwright");

// Parse command line arguments
const args = process.argv.slice(2);
const model = args[0];
const mode = args[1];
const backend = args[2];

(async () => {
  const browser = await playwright.chromium.launch({
    headless: true,
    args: [
      "--disable-extensions",
      "--disable-infobars",
      "--disable-web-security",
      "--disable-features=WebGLDraftExtensions",
      "--disable-features=WebGL2ComputeRenderingContext"
    ]
  });
  const page = await browser.newPage();
  await page.goto("https://get.webgl.org/");
  const result = await page.evaluate(() => {
    return (
      !!document.querySelector("#feedback") &&
      document.querySelector("#feedback").textContent.indexOf("Success") >= 0
    );
  });
  console.log("WebGL support:", result);

  await page.goto("http://localhost:3000/");

  // Listen for all console events and handle errors
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`Error text: "${msg.text()}"`);
    else console.log(msg.text());
  });

  input_image = await page.locator("#input_image");
  load_button = await page.locator("#load_button");
  image_url = await page.locator("#image_url");
  model_select = await page.locator("#model_select");
  mode_select = await page.locator("#mode_select");
  backend_select = await page.locator("#backend_select");
  run_button = await page.locator("#run_button");
  predictions = await page.locator("#predictions");
  messages = await page.locator("#messages");

  await load_button.click();
  await model_select.selectOption(model);
  await mode_select.selectOption(mode);
  await backend_select.selectOption(backend);
  await run_button.click();

  await browser.close();
})();
