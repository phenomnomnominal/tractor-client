export class TractorPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css('tractor-app h1')).getText();
  }
}
