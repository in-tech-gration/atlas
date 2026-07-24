import TurndownService from 'turndown';

/**
 * ⚠️ WORK IN PROGRESS
 */
export default async function downloadHTMLAsMarkdown(options){

  const turndownService = new TurndownService();
  const URL = options[0]
  const response = await fetch(URL);
  const html = await response.text();
  const markdown = turndownService.turndown(html);

  console.log(markdown);

}