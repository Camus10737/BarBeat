"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type QRCodeDisplayProps = {
  slug: string;
};

export function QRCodeDisplay({ slug }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const url = `https://barbeat.app/bar/${slug}`;

  function handleDownload() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `barbeat-qr-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={canvasRef} className="bg-white p-4 rounded-lg">
        <QRCodeCanvas value={url} size={200} level="H" />
      </div>
      <p className="text-sm text-muted-foreground">{url}</p>
      <Button onClick={handleDownload} variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Télécharger en PNG
      </Button>
    </div>
  );
}
