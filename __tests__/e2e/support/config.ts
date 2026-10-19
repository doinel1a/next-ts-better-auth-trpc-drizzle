const port = 3100;

/**
  The e2e tests run their own copy of the app, on a port of its own and on a database of its own, so
  that they never touch the development server or its data.
*/
export const e2eConfig = {
  port,
  baseURL: `http://localhost:${port}`,
  databaseName: 'db_e2e'
} as const;

const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
  Derives the addresses of the e2e database from `DATABASE_URL`: same server and credentials, but
  another database. `adminUrl` points at the maintenance database used to create and drop it.
*/
export function getDatabaseUrls() {
  const source = process.env['DATABASE_URL'];
  if (source === undefined || source === '') {
    throw new Error('DATABASE_URL is needed to create the database of the e2e tests');
  }

  const url = new URL(source);
  if (!localHosts.has(url.hostname)) {
    throw new Error(
      `Refusing to create or drop a database on "${url.hostname}": the e2e tests only run on a local database`
    );
  }

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';

  const databaseUrl = new URL(url);
  databaseUrl.pathname = `/${e2eConfig.databaseName}`;

  return { adminUrl: adminUrl.href, databaseUrl: databaseUrl.href };
}
