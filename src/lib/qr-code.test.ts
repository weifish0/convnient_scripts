import { describe, expect, it } from "vitest";
import { buildQrPayload } from "./qr-code";

describe("buildQrPayload", () => {
  it("normalizes URLs without a protocol", () => {
    expect(buildQrPayload({ type: "url", url: "example.com" })).toEqual({
      payload: "https://example.com/",
      error: null,
    });
  });

  it("builds mailto payloads with encoded subject and body", () => {
    expect(
      buildQrPayload({
        type: "email",
        email: "hello@example.com",
        subject: "Hello QR",
        body: "Line 1",
      })
    ).toEqual({
      payload: "mailto:hello@example.com?subject=Hello+QR&body=Line+1",
      error: null,
    });
  });

  it("normalizes phone numbers for tel payloads", () => {
    expect(
      buildQrPayload({ type: "phone", phone: "+886 912-345-678" })
    ).toEqual({
      payload: "tel:+886912345678",
      error: null,
    });
  });

  it("builds escaped WPA Wi-Fi payloads", () => {
    expect(
      buildQrPayload({
        type: "wifi",
        ssid: "Cafe;Net",
        password: "pa:ss,word\\",
        security: "WPA",
        hidden: true,
      })
    ).toEqual({
      payload: "WIFI:T:WPA;S:Cafe\\;Net;P:pa\\:ss\\,word\\\\;H:true;;",
      error: null,
    });
  });

  it("builds WEP Wi-Fi payloads", () => {
    expect(
      buildQrPayload({
        type: "wifi",
        ssid: "Legacy",
        password: "abc123",
        security: "WEP",
        hidden: false,
      })
    ).toEqual({
      payload: "WIFI:T:WEP;S:Legacy;P:abc123;H:false;;",
      error: null,
    });
  });

  it("builds no-password Wi-Fi payloads", () => {
    expect(
      buildQrPayload({
        type: "wifi",
        ssid: "Guest",
        password: "",
        security: "nopass",
        hidden: false,
      })
    ).toEqual({
      payload: "WIFI:T:nopass;S:Guest;P:;H:false;;",
      error: null,
    });
  });
});
