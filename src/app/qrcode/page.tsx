"use client";

import type QRCodeStyling from "qr-code-styling";
import type {
  CornerDotType,
  CornerSquareType,
  DotType,
  FileExtension,
  Options,
} from "qr-code-styling";
import {
  Download,
  ImageIcon,
  Link2,
  Mail,
  Phone,
  QrCode,
  Trash2,
  Type,
  Upload,
  Wifi,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  buildQrPayload,
  type QrContentType,
  type QrPayloadInput,
  type WifiSecurity,
} from "@/lib/qr-code";

type DotStyle = "square" | "rounded" | "dots";

const contentTypeOptions: {
  value: QrContentType;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { value: "url", label: "網址", icon: Link2 },
  { value: "text", label: "文字", icon: Type },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "電話", icon: Phone },
  { value: "wifi", label: "Wi-Fi", icon: Wifi },
];

const dotStyleOptions: { value: DotStyle; label: string; description: string }[] =
  [
    { value: "square", label: "方塊", description: "最穩定的經典樣式" },
    { value: "rounded", label: "圓角", description: "柔和但保留辨識度" },
    { value: "dots", label: "點狀", description: "更有設計感的點陣" },
  ];

const qrSize = 320;
const fileName = "custom-qr-code";

export default function QrCodePage() {
  const [contentType, setContentType] = useState<QrContentType>("url");
  const [url, setUrl] = useState("https://example.com");
  const [text, setText] = useState("這是一段 QR Code 文字內容");
  const [email, setEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [phone, setPhone] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState<WifiSecurity>("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);
  const [foregroundColor, setForegroundColor] = useState("#111827");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [dotStyle, setDotStyle] = useState<DotStyle>("rounded");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [isQrReady, setIsQrReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);

  const payloadInput = useMemo<QrPayloadInput>(() => {
    switch (contentType) {
      case "url":
        return { type: "url", url };
      case "text":
        return { type: "text", text };
      case "email":
        return {
          type: "email",
          email,
          subject: emailSubject,
          body: emailBody,
        };
      case "phone":
        return { type: "phone", phone };
      case "wifi":
        return {
          type: "wifi",
          ssid: wifiSsid,
          password: wifiPassword,
          security: wifiSecurity,
          hidden: wifiHidden,
        };
    }
  }, [
    contentType,
    email,
    emailBody,
    emailSubject,
    phone,
    text,
    url,
    wifiHidden,
    wifiPassword,
    wifiSecurity,
    wifiSsid,
  ]);

  const payloadResult = useMemo(
    () => buildQrPayload(payloadInput),
    [payloadInput]
  );
  const canDownload = Boolean(payloadResult.payload && !payloadResult.error);

  useEffect(() => {
    let isActive = true;

    async function renderQrCode() {
      if (!containerRef.current || payloadResult.error || !payloadResult.payload) {
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
        qrCodeRef.current = null;
        setIsQrReady(false);
        return;
      }

      setIsQrReady(false);

      const { default: QRCodeStylingConstructor } = await import(
        "qr-code-styling"
      );

      if (!isActive || !containerRef.current) {
        return;
      }

      const options = buildQrOptions({
        data: payloadResult.payload,
        foregroundColor,
        backgroundColor,
        dotStyle,
        logoDataUrl,
      });

      if (!qrCodeRef.current) {
        qrCodeRef.current = new QRCodeStylingConstructor(options);
        qrCodeRef.current.append(containerRef.current);
      } else {
        qrCodeRef.current.update(options);
      }

      setIsQrReady(true);
    }

    renderQrCode().catch((error) => {
      console.error(error);
      toast.error("QR Code 產生失敗");
      setIsQrReady(false);
    });

    return () => {
      isActive = false;
    };
  }, [
    backgroundColor,
    dotStyle,
    foregroundColor,
    logoDataUrl,
    payloadResult.error,
    payloadResult.payload,
  ]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("請上傳圖片檔案");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoDataUrl(String(reader.result));
      setLogoName(file.name);
      toast.success("Logo 已加入 QR Code");
    };
    reader.onerror = () => {
      toast.error("Logo 讀取失敗");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleDownload = async (extension: FileExtension) => {
    if (!canDownload || !qrCodeRef.current) {
      toast.error(payloadResult.error ?? "請先輸入有效內容");
      return;
    }

    try {
      await qrCodeRef.current.download({ name: fileName, extension });
      toast.success(`${extension.toUpperCase()} 已開始下載`);
    } catch (error) {
      console.error(error);
      toast.error("下載失敗，請稍後再試");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative z-10">
      <div className="absolute top-0 right-10 w-96 h-96 bg-emerald-200/40 dark:bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-pulse pointer-events-none" />

      <header className="flex flex-col gap-4 pb-6 border-b border-slate-200 dark:border-white/10 relative">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
          <QrCode className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            客製化 QR Code
          </h1>
          <p className="max-w-2xl text-slate-600 dark:text-slate-400 leading-relaxed">
            產生可下載的網址、文字、Email、電話與 Wi-Fi QR Code，並調整顏色、背景、樣式與中央 logo。
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] gap-8 items-start">
        <section className="rounded-3xl bg-white/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] backdrop-blur-2xl shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-6 md:p-8 space-y-8">
          <div className="space-y-4">
            <Label className="text-base text-slate-800 dark:text-slate-100">
              內容類型
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {contentTypeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = contentType === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setContentType(option.value)}
                    className={`h-20 rounded-2xl border text-sm font-medium transition-all flex flex-col items-center justify-center gap-2 ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                        : "bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-400/40"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base text-slate-800 dark:text-slate-100">
              QR Code 內容
            </Label>
            {renderContentFields({
              contentType,
              url,
              setUrl,
              text,
              setText,
              email,
              setEmail,
              emailSubject,
              setEmailSubject,
              emailBody,
              setEmailBody,
              phone,
              setPhone,
              wifiSsid,
              setWifiSsid,
              wifiPassword,
              setWifiPassword,
              wifiSecurity,
              setWifiSecurity,
              wifiHidden,
              setWifiHidden,
            })}
            {payloadResult.error && (
              <p className="text-sm font-medium text-red-500" role="alert">
                {payloadResult.error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="foreground-color">QR 顏色</Label>
              <ColorControl
                id="foreground-color"
                value={foregroundColor}
                onChange={setForegroundColor}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="background-color">背景色</Label>
              <ColorControl
                id="background-color"
                value={backgroundColor}
                onChange={setBackgroundColor}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base text-slate-800 dark:text-slate-100">
              點陣樣式
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {dotStyleOptions.map((option) => {
                const isSelected = dotStyle === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDotStyle(option.value)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                        : "bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-400/40"
                    }`}
                  >
                    <span className="block font-semibold">{option.label}</span>
                    <span
                      className={`mt-1 block text-sm ${
                        isSelected
                          ? "text-indigo-100"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base text-slate-800 dark:text-slate-100">
              中央 Logo
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-white dark:border-white/10 dark:bg-black/20 dark:text-slate-300 dark:hover:bg-white/5">
                <Upload className="size-4" aria-hidden="true" />
                上傳圖片
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="sr-only"
                />
              </label>

              {logoDataUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setLogoDataUrl(null);
                    setLogoName(null);
                  }}
                  className="h-10 rounded-xl"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  移除 Logo
                </Button>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {logoName
                ? `目前使用：${logoName}`
                : "Logo 會以安全比例置中，確保 QR Code 保持可掃描。"}
            </p>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 rounded-3xl bg-white/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] backdrop-blur-2xl shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                即時預覽
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                有效內容會自動更新 QR Code。
              </p>
            </div>
            <ImageIcon
              className="size-5 text-slate-400"
              aria-hidden="true"
            />
          </div>

          <div className="relative aspect-square w-full max-w-[360px] mx-auto rounded-3xl bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 p-5 flex items-center justify-center">
            <div
              ref={containerRef}
              aria-label="QR Code 預覽"
              className={`size-full flex items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>canvas]:h-full [&>canvas]:w-full ${
                isQrReady ? "opacity-100" : "opacity-40"
              } transition-opacity`}
            />
            {!canDownload && (
              <div className="absolute text-center text-sm text-slate-500 dark:text-slate-400 px-6">
                請輸入有效內容
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              type="button"
              size="lg"
              onClick={() => handleDownload("png")}
              disabled={!canDownload}
              className="h-11 rounded-xl"
            >
              <Download className="size-4" aria-hidden="true" />
              下載 PNG
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => handleDownload("svg")}
              disabled={!canDownload}
              className="h-11 rounded-xl"
            >
              <Download className="size-4" aria-hidden="true" />
              下載 SVG
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function renderContentFields(props: {
  contentType: QrContentType;
  url: string;
  setUrl: (value: string) => void;
  text: string;
  setText: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  emailSubject: string;
  setEmailSubject: (value: string) => void;
  emailBody: string;
  setEmailBody: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  wifiSsid: string;
  setWifiSsid: (value: string) => void;
  wifiPassword: string;
  setWifiPassword: (value: string) => void;
  wifiSecurity: WifiSecurity;
  setWifiSecurity: (value: WifiSecurity) => void;
  wifiHidden: boolean;
  setWifiHidden: (value: boolean) => void;
}) {
  switch (props.contentType) {
    case "url":
      return (
        <Input
          value={props.url}
          onChange={(event) => props.setUrl(event.target.value)}
          placeholder="https://example.com"
          aria-label="網址"
          className="h-11 rounded-xl"
        />
      );
    case "text":
      return (
        <Textarea
          value={props.text}
          onChange={(event) => props.setText(event.target.value)}
          placeholder="輸入要放進 QR Code 的文字"
          aria-label="文字內容"
          className="min-h-32 rounded-xl"
        />
      );
    case "email":
      return (
        <div className="grid gap-3">
          <Input
            type="email"
            value={props.email}
            onChange={(event) => props.setEmail(event.target.value)}
            placeholder="hello@example.com"
            aria-label="Email"
            className="h-11 rounded-xl"
          />
          <Input
            value={props.emailSubject}
            onChange={(event) => props.setEmailSubject(event.target.value)}
            placeholder="主旨，可留空"
            aria-label="Email 主旨"
            className="h-11 rounded-xl"
          />
          <Textarea
            value={props.emailBody}
            onChange={(event) => props.setEmailBody(event.target.value)}
            placeholder="內容，可留空"
            aria-label="Email 內容"
            className="min-h-28 rounded-xl"
          />
        </div>
      );
    case "phone":
      return (
        <Input
          type="tel"
          value={props.phone}
          onChange={(event) => props.setPhone(event.target.value)}
          placeholder="+886 912 345 678"
          aria-label="電話號碼"
          className="h-11 rounded-xl"
        />
      );
    case "wifi":
      return (
        <div className="grid gap-3">
          <Input
            value={props.wifiSsid}
            onChange={(event) => props.setWifiSsid(event.target.value)}
            placeholder="Wi-Fi 名稱"
            aria-label="Wi-Fi 名稱"
            className="h-11 rounded-xl"
          />
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
            <select
              value={props.wifiSecurity}
              onChange={(event) =>
                props.setWifiSecurity(event.target.value as WifiSecurity)
              }
              aria-label="Wi-Fi 加密方式"
              className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">無密碼</option>
            </select>
            <Input
              type="password"
              value={props.wifiPassword}
              onChange={(event) => props.setWifiPassword(event.target.value)}
              placeholder={
                props.wifiSecurity === "nopass" ? "無密碼可留空" : "Wi-Fi 密碼"
              }
              aria-label="Wi-Fi 密碼"
              disabled={props.wifiSecurity === "nopass"}
              className="h-11 rounded-xl"
            />
          </div>
          <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={props.wifiHidden}
              onChange={(event) => props.setWifiHidden(event.target.checked)}
              className="size-4 accent-indigo-600"
            />
            隱藏網路
          </label>
        </div>
      );
  }
}

function ColorControl({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const colorInputValue = /^#[0-9a-f]{6}$/i.test(value) ? value : "#111827";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 p-2">
      <input
        id={id}
        type="color"
        value={colorInputValue}
        onChange={(event) => onChange(event.target.value)}
        className="size-10 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent"
      />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`${id} hex 色碼`}
        className="h-10 rounded-lg font-mono uppercase"
      />
    </div>
  );
}

function buildQrOptions({
  data,
  foregroundColor,
  backgroundColor,
  dotStyle,
  logoDataUrl,
}: {
  data: string;
  foregroundColor: string;
  backgroundColor: string;
  dotStyle: DotStyle;
  logoDataUrl: string | null;
}): Partial<Options> {
  const styleOptions = getQrStyleOptions(dotStyle, foregroundColor);

  return {
    width: qrSize,
    height: qrSize,
    type: "svg",
    data,
    image: logoDataUrl ?? undefined,
    margin: 12,
    qrOptions: {
      errorCorrectionLevel: "H",
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.25,
      margin: 6,
    },
    backgroundOptions: {
      color: backgroundColor,
    },
    ...styleOptions,
  };
}

function getQrStyleOptions(
  dotStyle: DotStyle,
  color: string
): Pick<Options, "dotsOptions" | "cornersSquareOptions" | "cornersDotOptions"> {
  const dotsType: Record<DotStyle, DotType> = {
    square: "square",
    rounded: "rounded",
    dots: "dots",
  };
  const cornersSquareType: Record<DotStyle, CornerSquareType> = {
    square: "square",
    rounded: "extra-rounded",
    dots: "dot",
  };
  const cornersDotType: Record<DotStyle, CornerDotType> = {
    square: "square",
    rounded: "dot",
    dots: "dot",
  };

  return {
    dotsOptions: {
      color,
      type: dotsType[dotStyle],
    },
    cornersSquareOptions: {
      color,
      type: cornersSquareType[dotStyle],
    },
    cornersDotOptions: {
      color,
      type: cornersDotType[dotStyle],
    },
  };
}
