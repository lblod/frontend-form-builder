import Service from '@ember/service';

const SPARQL_ENDPOINT = '/sparql';

export default class DatabaseService extends Service {
  async query(query, { method = 'GET', format = 'application/json' } = {}) {
    const encodedQuery = escape(query);
    const endpoint = `${SPARQL_ENDPOINT}?query=${encodedQuery}&format=${escape(
      format
    )}`;
    const response = await fetch(endpoint, { method });
    if (response.ok) {
      return response;
    } else {
      throw new Error(
        `Request was unsuccessful: [${response.status}] ${response.statusText}`
      );
    }
  }

  // TODO
  async update(query, { method = 'POST', format = 'application/json' } = {}) {
    return await this.query(query, { method, format });
  }
}
