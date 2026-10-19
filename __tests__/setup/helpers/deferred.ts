export function createDeferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}
