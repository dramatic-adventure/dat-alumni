export function truthy(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  return v === true || s === "true" || s === "1" || s === "yes";
}

export function boolCell(v: any) {
  return truthy(v) ? "true" : "";
}

export function isTrue(v: any) {
  return truthy(v);
}
