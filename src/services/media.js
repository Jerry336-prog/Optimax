import { validateImageFiles } from "../lib/productEditor";
import { requireBackend, resultOf } from "../lib/supabase";
export async function uploadImages(files) {
  validateImageFiles(files);
  const client = requireBackend();
  const { user } = resultOf(await client.auth.getUser());
  if (!user) throw new Error("Please sign in before uploading images.");
  const bucket = client.storage.from("product-images");
  const urls = [];
  for (const file of files) {
    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    resultOf(await bucket.upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false }));
    urls.push(bucket.getPublicUrl(path).data.publicUrl);
  }
  return urls;
}
