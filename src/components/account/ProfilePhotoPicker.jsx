import { useEffect, useId, useState } from "react";
import { Camera } from "lucide-react";
import Avatar from "../ui/Avatar";
import { validateProfilePhoto } from "../../lib/avatar";
export default function ProfilePhotoPicker({ value = "", file, onChange, onRemove, busy = false, name }) {
  const id = useId();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const src = file && preview?.file === file ? preview.url : value;
  return (
    <div className="profile-photo-picker">
      <Avatar src={src} name={name} size={88} />
      <div>
        <strong>Profile photo</strong>
        <p id={`${id}-help`}>Optional · JPG, PNG or WebP · up to 5 MB</p>
        <label className={`button secondary photo-upload-label${busy ? " is-disabled" : ""}`} htmlFor={id}><Camera size={16} />{src ? "Change photo" : "Upload photo"}</label>
        <input className="photo-file-input" id={id} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload profile photo" aria-describedby={`${id}-help`} disabled={busy} onChange={event => {
          const selected = event.target.files?.[0];
          event.target.value = "";
          if (!selected) return;
          try {
            validateProfilePhoto(selected);
            setError("");
            onChange(selected);
          } catch (failure) { setError(failure.message); }
        }} />
        {src && <button type="button" className="text-link photo-remove" disabled={busy} onClick={() => { onRemove(); setError(""); }}>Remove photo</button>}
      </div>
      {error && <p className="auth-field-error" role="alert">{error}</p>}
    </div>
  );
}
