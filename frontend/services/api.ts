const BASE_URL = "http://YOUR_PC_IP:3000";

export async function getHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}
