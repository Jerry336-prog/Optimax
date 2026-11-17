// Email confirmation may create an account without a session. Keep the photo on
// this device until its owner signs in; anonymous visitors cannot upload files.
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("optimax-signup-photo", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos", { keyPath: "email" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("This browser could not keep your signup photo. Skip the photo for now and add it in profile settings after signing in."));
  });
}
async function operation(mode, run) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("photos", mode);
      const request = run(transaction.objectStore("photos"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("The photo could not be saved on this device."));
    });
  } finally { db.close(); }
}
const key = email => email.trim().toLowerCase();
export async function queueSignupPhoto(email, file) {
  if (file) return operation("readwrite", store => store.put({ email: key(email), file, createdAt: Date.now() }));
  return clearSignupPhoto(email);
}
export function clearSignupPhoto(email) { return operation("readwrite", store => store.delete(key(email))); }
export async function pendingSignupPhoto(email) {
  const pending = await operation("readonly", store => store.get(key(email)));
  if (!pending) return null;
  if (Date.now() - pending.createdAt > MAX_AGE) { await clearSignupPhoto(email); return null; }
  return pending.file;
}
