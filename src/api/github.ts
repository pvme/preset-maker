export async function rawGithubGetRequest (url: string): Promise<Response> {
  const res = await fetch(url, {
    method: 'GET'
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res;
}

export async function rawGithubJSONRequest (url: string): Promise<any> {
  const res = await rawGithubGetRequest(url);
  return await res.json();
}
