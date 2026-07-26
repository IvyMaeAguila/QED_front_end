export function generateUsername(role: string, firstName: string, lastName: string) {
  const first = firstName.trim().toLowerCase().replace(/\s+/g, "");
  const last = lastName.trim().toLowerCase().replace(/\s+/g, "");

  switch (role.toLowerCase()) {
    case "teacher":
      return `TC_${first}.${last}`;
    case "principal":
      return `PRN.${first}.${last}`;
    case "parent":
      return `PRT_${first}.${last}`;
    default:
      return `${first}.${last}`;
  }
}

export function generateRandomPassword(length = 10) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array); // more secure than Math.random()
  return Array.from(array, (n) => chars[n % chars.length]).join("");
}