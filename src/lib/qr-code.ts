export type QrContentType = "url" | "text" | "email" | "phone" | "wifi";

export type WifiSecurity = "WPA" | "WEP" | "nopass";

export type QrPayloadInput =
  | {
      type: "url";
      url: string;
    }
  | {
      type: "text";
      text: string;
    }
  | {
      type: "email";
      email: string;
      subject?: string;
      body?: string;
    }
  | {
      type: "phone";
      phone: string;
    }
  | {
      type: "wifi";
      ssid: string;
      password?: string;
      security: WifiSecurity;
      hidden: boolean;
    };

export interface QrPayloadResult {
  payload: string;
  error: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s().-]{3,}$/;

export function buildQrPayload(input: QrPayloadInput): QrPayloadResult {
  switch (input.type) {
    case "url":
      return buildUrlPayload(input.url);
    case "text":
      return buildTextPayload(input.text);
    case "email":
      return buildEmailPayload(input.email, input.subject, input.body);
    case "phone":
      return buildPhonePayload(input.phone);
    case "wifi":
      return buildWifiPayload(
        input.ssid,
        input.password,
        input.security,
        input.hidden
      );
  }
}

function buildUrlPayload(rawUrl: string): QrPayloadResult {
  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) {
    return { payload: "", error: "請輸入網址" };
  }

  const normalizedUrl = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  try {
    const url = new URL(normalizedUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      return { payload: "", error: "網址必須以 http 或 https 開頭" };
    }

    return { payload: url.toString(), error: null };
  } catch {
    return { payload: "", error: "網址格式不正確" };
  }
}

function buildTextPayload(text: string): QrPayloadResult {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return { payload: "", error: "請輸入文字內容" };
  }

  return { payload: text, error: null };
}

function buildEmailPayload(
  rawEmail: string,
  subject = "",
  body = ""
): QrPayloadResult {
  const email = rawEmail.trim();

  if (!email) {
    return { payload: "", error: "請輸入 Email" };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { payload: "", error: "Email 格式不正確" };
  }

  const params = new URLSearchParams();
  const trimmedSubject = subject.trim();
  const trimmedBody = body.trim();

  if (trimmedSubject) {
    params.set("subject", trimmedSubject);
  }

  if (trimmedBody) {
    params.set("body", trimmedBody);
  }

  const queryString = params.toString();

  return {
    payload: queryString ? `mailto:${email}?${queryString}` : `mailto:${email}`,
    error: null,
  };
}

function buildPhonePayload(rawPhone: string): QrPayloadResult {
  const phone = rawPhone.trim();

  if (!phone) {
    return { payload: "", error: "請輸入電話號碼" };
  }

  if (!PHONE_PATTERN.test(phone)) {
    return { payload: "", error: "電話格式不正確" };
  }

  const normalizedPhone = phone.replace(/[\s().-]/g, "");

  return { payload: `tel:${normalizedPhone}`, error: null };
}

function buildWifiPayload(
  rawSsid: string,
  rawPassword = "",
  security: WifiSecurity,
  hidden: boolean
): QrPayloadResult {
  const ssid = rawSsid.trim();
  const password = rawPassword.trim();

  if (!ssid) {
    return { payload: "", error: "請輸入 Wi-Fi 名稱" };
  }

  if (security !== "nopass" && !password) {
    return { payload: "", error: "請輸入 Wi-Fi 密碼" };
  }

  const securityValue = security === "nopass" ? "nopass" : security;

  return {
    payload: `WIFI:T:${securityValue};S:${escapeWifiValue(
      ssid
    )};P:${escapeWifiValue(password)};H:${hidden ? "true" : "false"};;`,
    error: null,
  };
}

export function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}
