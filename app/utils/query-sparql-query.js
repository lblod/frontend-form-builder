export async function queryDB(query, sparqlEndpoint = '/sparql') {
  const encodedQuery = escape(query);
  const endpoint = `${sparqlEndpoint}?query=${encodedQuery}`;
  const response = await fetch(endpoint, {
    headers: { Accept: 'application/sparql-results+json' },
  });

  if (response.ok) {
    let jsonResponds = await response.json();
    return jsonResponds.results.bindings;
  } else {
    throw new Error(
      `Request was unsuccessful: [${response.status}] ${response.statusText}`
    );
  }
}
