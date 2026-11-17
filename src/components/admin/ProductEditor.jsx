import { useEffect, useId, useRef, useState } from "react";
import {
  UploadCloud,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  ImagePlus,
} from "lucide-react";
import { collections } from "../../lib/collections";
import {
  validateImageFiles,
  specificationsToRows,
  rowsToSpecifications,
} from "../../lib/productEditor";
function ImagePicker({ label, items, onChange, disabled, onFiles }) {
  const id = useId();
  function move(index, direction) {
    const next = [...items];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    onChange(next);
  }
  return (
    <div className="image-picker">
      <label
        className={`image-dropzone${disabled ? " is-disabled" : ""}`}
        htmlFor={id}
      >
        <UploadCloud size={25} />
        <strong>{label}</strong>
        <span>Choose images from your device</span>
        <small>JPG, PNG or WebP · up to 10 MB each</small>
        <input
          id={id}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="visually-hidden"
          disabled={disabled}
          onChange={(event) => {
            onFiles([...event.target.files]);
            event.target.value = "";
          }}
        />
      </label>
      {items.length > 0 && (
        <div className="editor-image-grid">
          {items.map((item, index) => (
            <div className="editor-image" key={item.id}>
              <img src={item.url} alt={`${label} preview ${index + 1}`} />
              <span className="image-position">
                {label.includes("360")
                  ? `Frame ${index + 1}`
                  : index === 0
                    ? "Cover"
                    : index + 1}
              </span>
              <button
                type="button"
                className="image-remove"
                aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
                disabled={disabled}
                onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              >
                <X size={14} />
              </button>
              <div className="image-reorder">
                <button
                  type="button"
                  aria-label={`Move image ${index + 1} earlier`}
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronLeft size={15} />
                </button>
                <span>
                  {index + 1} / {items.length}
                </span>
                <button
                  type="button"
                  aria-label={`Move image ${index + 1} later`}
                  disabled={disabled || index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function existingImages(urls = []) {
  return urls.map((url, index) => ({ id: `existing-${index}`, url }));
}
export default function ProductEditor({ product, busy, onSave, onCancel }) {
  const [images, setImages] = useState(() => existingImages(product?.images));
  const [frames, setFrames] = useState(() =>
    existingImages(product?.spin_images),
  );
  const [specs, setSpecs] = useState(() =>
    specificationsToRows(product?.specifications),
  );
  const [error, setError] = useState("");
  const previews = useRef(new Set());
  useEffect(() => {
    const urls = previews.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);
  function addFiles(files, setItems) {
    try {
      validateImageFiles(files);
      setError("");
      setItems((current) => [
        ...current,
        ...files.map((file) => {
          const url = URL.createObjectURL(file);
          previews.current.add(url);
          return { id: crypto.randomUUID(), file, url };
        }),
      ]);
    } catch (error) {
      setError(error.message);
    }
  }
  function changeSpec(id, key, value) {
    setSpecs((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  }
  function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const fields = new FormData(event.currentTarget);
      const values = {
        name: fields.get("name").trim(),
        category: fields.get("category"),
        price: Number(fields.get("price")),
        stock: Number(fields.get("stock")),
        description: fields.get("description").trim(),
        active: fields.get("active") === "on",
        specifications: rowsToSpecifications(specs),
      };
      if (values.active && !images.length)
        throw new Error("Add at least one product image before publishing.");
      if (frames.length === 1)
        throw new Error(
          "A 360° view needs at least two frames. Add another frame or remove this one.",
        );
      onSave({ ...values, gallery: images, frames });
    } catch (error) {
      setError(error.message);
    }
  }
  return (
    <form className="admin-form product-editor" onSubmit={submit}>
      <label>
        Product name
        <input
          name="name"
          defaultValue={product?.name || ""}
          required
          maxLength={180}
        />
      </label>
      <label>
        Collection
        <select
          name="category"
          defaultValue={product?.category || collections[0].slug}
        >
          {collections.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="form-pair">
        <label>
          Price (NGN)
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={product?.price ?? ""}
          />
        </label>
        <label>
          Stock quantity
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.stock ?? 0}
          />
        </label>
      </div>
      <label>
        Description
        <textarea
          name="description"
          rows={5}
          defaultValue={product?.description || ""}
        />
      </label>
      <div>
        <h3 className="editor-field-title">
          <ImagePlus size={18} />
          Product photos
        </h3>
        <p className="editor-help">
          The first image is your cover. Reorder or remove images before saving.
        </p>
        <ImagePicker
          label="Upload product photos"
          items={images}
          onChange={setImages}
          disabled={busy}
          onFiles={(files) => addFiles(files, setImages)}
        />
      </div>
      <fieldset className="spec-editor">
        <legend>
          Specifications <span>Optional</span>
        </legend>
        <p className="editor-help">
          Add useful details such as resolution, power source, or connectivity.
        </p>
        {specs.map((row) => (
          <div className="spec-editor-row" key={row.id}>
            <input
              aria-label="Specification name"
              placeholder="e.g. Resolution"
              value={row.name}
              maxLength={100}
              disabled={busy}
              onChange={(e) => changeSpec(row.id, "name", e.target.value)}
            />
            <input
              aria-label="Specification value"
              placeholder="e.g. 4K Ultra HD"
              value={row.value}
              maxLength={500}
              disabled={busy}
              onChange={(e) => changeSpec(row.id, "value", e.target.value)}
            />
            <button
              type="button"
              className="icon-button"
              aria-label="Remove specification"
              disabled={busy}
              onClick={() =>
                setSpecs((rows) => rows.filter((i) => i.id !== row.id))
              }
            >
              <X size={17} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-link"
          disabled={busy}
          onClick={() =>
            setSpecs((rows) => [
              ...rows,
              { id: crypto.randomUUID(), name: "", value: "" },
            ])
          }
        >
          <Plus size={15} />
          Add specification
        </button>
      </fieldset>
      <details
        className="optional-editor"
        open={product?.spin_images?.length > 0 || undefined}
      >
        <summary>
          360° product view <span>Optional</span>
        </summary>
        <p className="editor-help">
          Only needed if you have photographs of the same product from different
          angles. Upload them in rotation order, then use the arrows to arrange
          them.
        </p>
        <ImagePicker
          label="Upload 360° frames"
          items={frames}
          onChange={setFrames}
          disabled={busy}
          onFiles={(files) => addFiles(files, setFrames)}
        />
      </details>
      <label className="check-label">
        <input
          name="active"
          type="checkbox"
          defaultChecked={product?.active || false}
          disabled={busy}
        />
        Publish product
      </label>
      {error && (
        <p className="editor-error" role="alert">
          {error}
        </p>
      )}
      <div className="inline-actions">
        <button className="button primary" disabled={busy}>
          {busy
            ? "Saving product…"
            : product
              ? "Save changes"
              : "Create product"}
        </button>
        {product && (
          <button
            type="button"
            className="button secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel edit
          </button>
        )}
      </div>
    </form>
  );
}
