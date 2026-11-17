import assert from "node:assert/strict";
import {
  rowsToSpecifications,
  specificationsToRows,
  resolveMedia,
  validateImageFiles,
} from "../src/lib/productEditor.js";
assert.deepEqual(
  rowsToSpecifications([
    { name: " Resolution ", value: " 4K " },
    { name: "", value: "" },
  ]),
  { Resolution: "4K" },
);
assert.throws(
  () =>
    rowsToSpecifications([
      { name: "Resolution", value: "4K" },
      { name: "resolution", value: "1080p" },
    ]),
  /more than once/,
);
assert.throws(
  () => rowsToSpecifications([{ name: "Power", value: "" }]),
  /both/,
);
assert.deepEqual(rowsToSpecifications(specificationsToRows({ Voltage: 12 })), {
  Voltage: "12",
});
assert.throws(
  () => validateImageFiles([{ type: "application/pdf", size: 100 }]),
  /JPG/,
);
assert.throws(
  () => validateImageFiles([{ type: "image/png", size: 11 * 1024 * 1024 }]),
  /10 MB/,
);
const file = { type: "image/jpeg", size: 100 };
let uploaded = 0;
const result = await resolveMedia(
  [
    { url: "/existing.jpg" },
    { url: "blob:preview", file },
    { url: "/existing-2.jpg" },
  ],
  async (files) => {
    uploaded += files.length;
    return ["https://res.cloudinary.com/example/new.jpg"];
  },
);
assert.equal(uploaded, 1);
assert.deepEqual(result, [
  "/existing.jpg",
  "https://res.cloudinary.com/example/new.jpg",
  "/existing-2.jpg",
]);
assert.deepEqual(
  await resolveMedia([{ url: "/kept.jpg" }], async () => {
    throw new Error("Existing images must not be uploaded again.");
  }),
  ["/kept.jpg"],
);
console.log(
  "PASS specification fields, duplicate detection, file validation, upload ordering, and existing-image preservation",
);
