// Minimal pub-sub so multiple browser tabs/devices stay in sync in real
// time (new reports, admin verifications, etc.), the same job the frontend
// mock's subscribe()/emit() pair did for a single tab via localStorage.
const clients = new Set();

export function addClient(res) {
  clients.add(res);
}

export function removeClient(res) {
  clients.delete(res);
}

export function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}
