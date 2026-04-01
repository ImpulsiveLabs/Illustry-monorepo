/* eslint-disable no-console */
const makeRequest = <T>(
  request: RequestInfo,
  tags: string[]
): Promise<T> => fetch(request, {
  cache: 'no-store',
  next: {
    tags
  }
})
  .then(async (response) => {
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error = typeof payload === 'object' && payload && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed with status ${response.status}`;
      throw new Error(error);
    }

    return payload as T;
  });

export default makeRequest;
