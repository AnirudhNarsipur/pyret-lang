import { strict as assert } from 'assert';
import { setup } from './util/setup';
import * as TextMode from './util/TextMode';
import * as RHS from './util/RHS';
// const glob = require('glob');
// const tester = require("./test-util.js");

const TEST_TIMEOUT = 20000;
const COMPILER_TIMEOUT = 10000; // ms, for each compiler run
const STARTUP_TIMEOUT = 6000;


//
// NOTE(alex): All tests assume that the editor begins with an ***EMPTY*** file
//
describe("Testing browser simple-output programs", () => {

  jest.setTimeout(TEST_TIMEOUT);

  let driver;
  let ideURL;
  let refreshPagePerTest;

  // TODO(alex): Need to have empty file open before each test
  //   Easiest way to do that so far is to open a new Chrome instance
  //     which somehow doesn't persist the file (maybe this is a property
  //     of the ChromeDriver that does not save localstorage?)
  //
  //   If you ever figure out how to reset the IDE, you can swap back to
  //     a single Chrome instance using the following code
  //
  //beforeAll(() => {
  //  let setupResult = setup();
  //  driver = setupResult.driver;
  //  ideURL = setupResult.ideURL;
  //  refreshPagePerTest = setupResult.refreshPagePerTest;

  //  return driver.get(ideURL);
  //});

  //afterAll(() => {
  //  return driver.quit();
  //});

  beforeEach(() => {
    let setupResult = setup();
    driver = setupResult.driver;
    ideURL = setupResult.ideURL;
    refreshPagePerTest = setupResult.refreshPagePerTest;

    return driver.get(ideURL);
  });

  afterEach(() => {
    return driver.quit();
  });

  test("Append Input 1", async function(done) {

    await TextMode.toTextMode(driver);
    await TextMode.appendInput(driver, "include primitive-types\n");
    await TextMode.appendInput(driver, "123");

    await driver.sleep(3000);

    let result = await RHS.searchFor(driver, "123", false);

    expect(result).toBeTruthy();

    await done();
  });

  test("Append Input 2", async function(done) {

    await TextMode.toTextMode(driver);
    await TextMode.appendInput(driver, "include primitive-types");
    await TextMode.appendInput(driver, "\n\n\"abc\"");
    await TextMode.appendInput(driver, "\n\n1234");

    await driver.sleep(3000);

    let result = await RHS.searchFor(driver, "1234", false);

    expect(result).toBeTruthy();

    await done();
  });
});
