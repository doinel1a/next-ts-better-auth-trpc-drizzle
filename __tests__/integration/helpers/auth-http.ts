import { NextRequest } from 'next/server';

import { GET, POST } from '@/app/api/auth/[...all]/route';

import { testUserEmail } from './session';

const baseUrl = 'http://localhost:3000/api/auth';

export const testPassword = 'password1';
export const visitorAddress = '203.0.113.7';

export function fromAddress(address?: string): Record<string, string> {
  return address === undefined ? {} : { 'x-vercel-forwarded-for': address };
}

export function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new NextRequest(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body)
    })
  );
}

export function get(path: string, headers: Record<string, string> = {}) {
  return GET(new NextRequest(`${baseUrl}${path}`, { headers }));
}

export function signIn(address?: string, attemptedPassword = 'wrong-password') {
  return post(
    '/sign-in/email',
    { email: testUserEmail, password: attemptedPassword },
    fromAddress(address)
  );
}

export function signUp(index: number) {
  return post(
    '/sign-up/email',
    { name: 'Al', email: `visitor${index}@example.com`, password: testPassword },
    fromAddress(visitorAddress)
  );
}

export function getSession() {
  return GET(new NextRequest(`${baseUrl}/get-session`, { headers: fromAddress(visitorAddress) }));
}

export async function statusOf(request: Promise<Response>) {
  const response = await request;

  return response.status;
}

export async function statusesOf(count: number, request: () => Promise<Response>) {
  const statuses: number[] = [];
  for (let attempt = 0; attempt < count; attempt += 1) {
    statuses.push(await statusOf(request()));
  }

  return statuses;
}
