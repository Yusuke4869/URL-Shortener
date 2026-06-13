const IPv4_PATTERN =
  /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export const normalizeIpAddress = (address: string | undefined) => {
  if (!address) return;

  const prefix = "::ffff:";
  const lower = address.toLowerCase();
  if (!lower.startsWith(prefix)) return address;

  const mapped = address.slice(prefix.length);
  if (IPv4_PATTERN.test(mapped)) return mapped;

  // ::ffff:7f00:1 -> 127.0.0.1
  const parts = mapped.split(":");
  if (
    parts.length === 2 &&
    parts.every((part) => /^[0-9a-fA-F]{1,4}$/.test(part))
  ) {
    const high = Number.parseInt(parts[0], 16);
    const low = Number.parseInt(parts[1], 16);

    return [
      (high >> 8) & 0xff,
      high & 0xff,
      (low >> 8) & 0xff,
      low & 0xff,
    ].join(".");
  }

  return address;
};
