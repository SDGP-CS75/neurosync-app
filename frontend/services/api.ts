import { BACKEND_URL } from '@env';

export async function getHealth() {
  const res = await fetch(`${BACKEND_URL}/health`);
  return res.json();
}
