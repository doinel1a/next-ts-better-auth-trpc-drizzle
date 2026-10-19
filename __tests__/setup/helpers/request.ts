export const currentRequest = { headers: new Headers() };

export function visitWith(cookie?: string) {
  currentRequest.headers = new Headers(cookie === undefined ? {} : { cookie });
}
