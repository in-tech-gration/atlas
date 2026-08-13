export default async function wikipedia(options, globalOptions, cliInstance) {

  if (!options) {
    return;
  }

  const query = options[0];

  if (!query) {
    return;
  }

  try {

    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // TODO -> FIX: "Multiple results found. Try a more specific term."
    if (data.type === 'disambiguation') {

      console.log('Multiple results found. Try a more specific term.');
      return null;

    }

    console.log();
    console.log("==================");
    console.log("Wikipedia Results:");
    console.log("==================");
    console.log('Title:', data.title);
    console.log('Description:', data.description);
    console.log('Extract:', data.extract);
    console.log('URL:', data.content_urls?.desktop?.page || data.thumbnail?.source);
    console.log();

    return data;

  } catch (error) {

    console.error('Error fetching Wikipedia data:', error.message);
    return null;

  }

}