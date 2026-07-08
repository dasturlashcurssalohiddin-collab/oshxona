import React, { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accept?: string; // e.g. "image/*" or "image/*,video/*"
  className?: string;
}

// Universal rasm/media kiritish maydoni:
// 1) Link (URL) yozish
// 2) Kompyuterdan fayl tanlash (Upload tugmasi)
// 3) Nusxalangan rasmni joylash (Ctrl+V / Cmd+V)
// 4) Rasmni tortib olib tashlash (drag & drop)
export default function ImageInput({
  label,
  value,
  onChange,
  placeholder,
  accept = "image/*",
  className = "",
}: ImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const readFileAsDataUrl = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
      setIsLoading(false);
    };
    reader.onerror = () => setIsLoading(false);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFileAsDataUrl(file);
    e.target.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          readFileAsDataUrl(file);
        }
        return;
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFileAsDataUrl(file);
  };

  const isPreviewableImage =
    !!value &&
    (value.startsWith("data:image") ||
      /\.(jpe?g|png|gif|webp|svg|avif)(\?|$)/i.test(value) ||
      value.startsWith("http"));

  return (
    <div className={className}>
      <label className="text-[10px] font-bold text-zinc-400 block mb-1">{label}</label>
      <div
        onPaste={handlePaste}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        tabIndex={0}
        className={`flex items-center gap-2 px-2 py-1.5 bg-zinc-950 border rounded-xl transition-colors outline-none ${
          isDragging ? "border-amber-500 ring-2 ring-amber-500" : "border-zinc-800 focus-within:ring-2 focus-within:ring-amber-500"
        }`}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Link kiriting, rasmni joylang (Ctrl+V) yoki fayl tanlang"}
          className="flex-1 bg-transparent px-1 py-1 text-xs text-white outline-none min-w-0"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Kompyuterdan / telefondan fayl tanlash"
          className="shrink-0 p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-300 transition-colors"
        >
          <Upload size={14} />
        </button>
        {!!value && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Tozalash"
            className="shrink-0 p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="mt-1.5 flex items-center gap-2 min-h-[16px]">
        {isLoading && <span className="text-[9px] text-amber-500">Yuklanmoqda...</span>}
        {!isLoading && isPreviewableImage && (
          <>
            <img
              src={value}
              alt="preview"
              className="w-12 h-12 object-cover rounded-lg border border-zinc-800"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="text-[9px] text-zinc-500 flex items-center gap-1">
              <ImageIcon size={10} /> Ko'rinish
            </span>
          </>
        )}
      </div>
    </div>
  );
}
