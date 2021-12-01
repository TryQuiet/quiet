import { ClientFunction } from 'testcafe'

export const getPageHTML = ClientFunction(() => {
    // Debugging purposes
    return document.documentElement.outerHTML;
  }); 
  