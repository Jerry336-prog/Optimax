export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export function validateImageFiles(files) {
  for (const file of files) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > MAX_IMAGE_BYTES
    )
      throw new Error("Choose JPG, PNG or WebP images under 10 MB each.");
  }
  return files;
}
export function specificationsToRows(specifications = {}) {
  const rows = Object.entries(specifications).map(([name, value], index) => ({
    id: `existing-${index}`,
    name,
    value: String(value),
  }));
  return rows.length ? rows : [{ id: "initial", name: "", value: "" }];
}
export function rowsToSpecifications(rows) {
  const entries = [];
  const seen = new Set();
  for (const row of rows) {
    const name = row.name.trim();
    const value = row.value.trim();
    if (!name && !value) continue;
    if (!name || !value)
      throw new Error(
        "Enter both a specification name and its value, or remove the empty row.",
      );
    const key = name.toLowerCase();
    if (seen.has(key))
      throw new Error(`The specification “${name}” is listed more than once.`);
    seen.add(key);
    entries.push([name, value]);
  }
  return Object.fromEntries(entries);
}
export async function resolveMedia(items, upload) {
  const files = items.filter((item) => item.file).map((item) => item.file);
  validateImageFiles(files);
  const uploaded = files.length ? await upload(files) : [];
  if (uploaded.length !== files.length)
    throw new Error("Not all images uploaded. Please try again.");
  let index = 0;
  return items.map((item) => (item.file ? uploaded[index++] : item.url));
}
