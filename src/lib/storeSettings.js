export function prepareStoreSettings(fields) {
  const values = { ...fields, store_open: fields.store_open === "true" };
  const phone = (fields.whatsapp || "").trim();
  values.whatsapp = phone.replace(/[+\s().-]/g, "");
  values.closure_reason = (fields.closure_reason || "").trim();
  if (phone && (!/^[+\d\s().-]+$/.test(phone) || !/^[0-9]{8,15}$/.test(values.whatsapp)))
    return { field: "whatsapp", error: "Enter a WhatsApp number with country code, for example +234 803 633 8604." };
  if (!values.store_open && !values.closure_reason)
    return { field: "closure_reason", error: "Enter a closure message for customers. There is no minimum message length." };
  if (!values.store_open && !values.whatsapp)
    return { field: "whatsapp", error: "Enter the team’s number in the WhatsApp contact number field below the closure message." };
  return { values };
}
