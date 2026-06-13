import { assertEquals } from "@std/assert";

import { normalizeIpAddress } from "./ip.ts";

Deno.test("normalizeIpAddress keeps IPv4 as-is", () => {
  assertEquals(normalizeIpAddress("127.0.0.1"), "127.0.0.1");
  assertEquals(normalizeIpAddress("192.168.1.10"), "192.168.1.10");
  assertEquals(normalizeIpAddress("10.0.0.5"), "10.0.0.5");
  assertEquals(normalizeIpAddress("172.16.0.20"), "172.16.0.20");
});

Deno.test("normalizeIpAddress converts IPv4-mapped IPv6 dotted form", () => {
  assertEquals(normalizeIpAddress("::ffff:127.0.0.1"), "127.0.0.1");
  assertEquals(normalizeIpAddress("::ffff:192.168.1.10"), "192.168.1.10");
  assertEquals(normalizeIpAddress("::ffff:10.0.0.5"), "10.0.0.5");
  assertEquals(normalizeIpAddress("::ffff:172.16.0.20"), "172.16.0.20");
});

Deno.test("normalizeIpAddress converts IPv4-mapped IPv6 hex form", () => {
  // 7f00:1 = 127.0.0.1
  assertEquals(normalizeIpAddress("::ffff:7f00:1"), "127.0.0.1");

  // 192.168.1.10 = c0a8:010a
  assertEquals(normalizeIpAddress("::ffff:c0a8:010a"), "192.168.1.10");

  // 10.0.0.5 = 0a00:0005
  assertEquals(normalizeIpAddress("::ffff:0a00:0005"), "10.0.0.5");
});

Deno.test("normalizeIpAddress keeps normal IPv6 as-is", () => {
  assertEquals(normalizeIpAddress("::1"), "::1");
  assertEquals(normalizeIpAddress("fc00:db8::1"), "fc00:db8::1");
});
