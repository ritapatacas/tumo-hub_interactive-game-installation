import * as defaultInterface from "../change-me/app.js";
import * as doorInterface from "../door/app.js";

const INTERFACES = {
  default: defaultInterface,
  door: doorInterface,
};

export function resolveInterfaceConfig(name) {
  const key = typeof name === "string" ? name.trim().toLowerCase() : "default";
  return INTERFACES[key] ?? INTERFACES.default;
}
