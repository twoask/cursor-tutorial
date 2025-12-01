"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TextBox } from "@/lib/schema";
import { TextBox as TextBoxComponent } from "./TextBox";

const BOX_PADDING = 12;

interface MemeCanvasProps {
  imageSource: string | null;
  textBoxes: TextBox[];
  onTextBoxesChange: (boxes: TextBox[]) => void;
  initialTextBoxes?: TextBox[];
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export function MemeCanvas({
  imageSource,
  textBoxes,
  onTextBoxesChange,
  initialTextBoxes,
  canvasRef: externalCanvasRef,
}: MemeCanvasProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const overlayRef = useRef<HTMLDivElement>(null);
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });
  const [activeTextBoxId, setActiveTextBoxId] = useState<string | null>(null);
  const [zIndexCursor, setZIndexCursor] = useState(1);

  const updateOverlaySize = useCallback(() => {
    if (overlayRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      setOverlaySize({ width: rect.width, height: rect.height });
    }
  }, []);

  const normalizeText = useCallback((value: string) => {
    return value.replace(/\u00A0/g, " ").replace(/\r/g, "");
  }, []);

  const wrapText = useCallback(
    (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
      if (!text) return [""];
      if (!maxWidth || maxWidth <= 0) return [text];

      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = words.shift() || "";

      words.forEach((word) => {
        const testLine = `${currentLine} ${word}`.trim();
        const metrics = context.measureText(testLine);

        if (metrics.width > maxWidth && currentLine.length) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine.length) {
        lines.push(currentLine);
      }

      return lines.length ? lines : [""];
    },
    []
  );

  const splitTextIntoLines = useCallback(
    (text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string[] => {
      const normalized = normalizeText(text);
      if (!normalized.length) return [];

      const paragraphs = normalized.split("\n");
      const lines: string[] = [];

      paragraphs.forEach((paragraph) => {
        if (!paragraph.trim()) {
          lines.push("");
        } else {
          wrapText(ctx, paragraph, maxWidth).forEach((line) => lines.push(line));
        }
      });

      return lines;
    },
    [normalizeText, wrapText]
  );

  const drawTextBoxToCanvas = useCallback(
    (
      box: TextBox,
      ctx: CanvasRenderingContext2D,
      stage: { width: number; height: number }
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scaleX = canvas.width / stage.width;
      const scaleY = canvas.height / stage.height;
      const scale = (scaleX + scaleY) / 2;

      const boxWidth = box.widthRatio * canvas.width;
      const paddingX = BOX_PADDING * scale;
      const paddingY = BOX_PADDING * scale;
      const textCenterX = box.leftRatio * canvas.width + boxWidth / 2;
      const startY = box.topRatio * canvas.height + paddingY;
      const maxTextWidth = Math.max(50, boxWidth - paddingX * 2);
      const baseFont =
        box.fontSize || Math.max(18, stage.width * (box.fontSizeRatio || 0.05));
      const fontSize = Math.max(12, baseFont * scale);

      ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(3, fontSize / 8);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillStyle = "#ffffff";

      const lines = splitTextIntoLines(box.text, maxTextWidth, ctx);
      const lineHeight = fontSize * 1.2;

      lines.forEach((line, index) => {
        const lineY = startY + index * lineHeight;
        if (!line) return;
        ctx.strokeText(line, textCenterX, lineY);
        ctx.fillText(line, textCenterX, lineY);
      });
    },
    [canvasRef, splitTextIntoLines]
  );

  const drawMeme = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = currentImage.width;
    canvas.height = currentImage.height;

    const maxWidth = 600;
    const maxHeight = 600;
    let displayWidth = currentImage.width;
    let displayHeight = currentImage.height;

    if (displayWidth > maxWidth) {
      displayHeight = (displayHeight * maxWidth) / displayWidth;
      displayWidth = maxWidth;
    }

    if (displayHeight > maxHeight) {
      displayWidth = (displayWidth * maxHeight) / displayHeight;
      displayHeight = maxHeight;
    }

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    if (overlaySize.width && overlaySize.height) {
      const boxes = textBoxes
        .filter((box) => box.text && box.text.trim().length > 0)
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      boxes.forEach((box) => drawTextBoxToCanvas(box, ctx, overlaySize));
    }
  }, [canvasRef, currentImage, overlaySize, textBoxes, drawTextBoxToCanvas]);

  useEffect(() => {
    if (initialTextBoxes && initialTextBoxes.length > 0) {
      onTextBoxesChange(initialTextBoxes);
      const maxZ = Math.max(...initialTextBoxes.map((b) => b.zIndex || 0));
      setZIndexCursor(maxZ + 1);
    }
  }, [initialTextBoxes, onTextBoxesChange]);

  useEffect(() => {
    if (!imageSource) {
      setCurrentImage(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setCurrentImage(img);
      updateOverlaySize();
    };
    img.onerror = () => {
      setCurrentImage(null);
    };
    img.src = imageSource;
  }, [imageSource, updateOverlaySize]);

  useEffect(() => {
    updateOverlaySize();
    window.addEventListener("resize", updateOverlaySize);
    return () => window.removeEventListener("resize", updateOverlaySize);
  }, [currentImage, updateOverlaySize]);

  useEffect(() => {
    if (currentImage) {
      drawMeme();
    }
  }, [currentImage, drawMeme]);

  const createTextBoxAt = (clientX: number, clientY: number) => {
    if (!overlayRef.current || !currentImage) return;

    const overlayRect = overlayRef.current.getBoundingClientRect();
    const stageWidth = overlayRect.width;
    const stageHeight = overlayRect.height;

    if (!stageWidth || !stageHeight) return;

    const relativeX = clientX - overlayRect.left;
    const relativeY = clientY - overlayRect.top;
    const rawWidth = Math.min(stageWidth * 0.45, 260);
    const rawHeight = Math.min(stageHeight * 0.25, 140);
    const width = Math.min(stageWidth, Math.max(140, rawWidth));
    const height = Math.min(stageHeight, Math.max(60, rawHeight));

    const maxLeft = Math.max(stageWidth - width, 0);
    const maxTop = Math.max(stageHeight - height, 0);
    const left = Math.max(0, Math.min(relativeX - width / 2, maxLeft));
    const top = Math.max(0, Math.min(relativeY - height / 2, maxTop));

    const id = crypto.randomUUID
      ? crypto.randomUUID()
      : `text-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fontSize = Math.max(18, Math.min(34, stageWidth * 0.05));

    const newBox: TextBox = {
      id,
      text: "",
      leftRatio: left / stageWidth,
      topRatio: top / stageHeight,
      widthRatio: width / stageWidth,
      heightRatio: height / stageHeight,
      fontSizeRatio: fontSize / stageWidth,
      fontSize,
      zIndex: zIndexCursor + 1,
    };

    setZIndexCursor((prev) => prev + 1);
    onTextBoxesChange([...textBoxes, newBox]);
    setActiveTextBoxId(id);
  };

  const handleTextBoxUpdate = (id: string, updates: Partial<TextBox>) => {
    onTextBoxesChange(
      textBoxes.map((box) => (box.id === id ? { ...box, ...updates } : box))
    );
  };

  const handleTextBoxDelete = (id: string) => {
    onTextBoxesChange(textBoxes.filter((box) => box.id !== id));
    if (activeTextBoxId === id) {
      setActiveTextBoxId(null);
    }
  };

  const handleBringToFront = (id: string) => {
    const box = textBoxes.find((b) => b.id === id);
    if (box) {
      const newZIndex = zIndexCursor + 1;
      setZIndexCursor(newZIndex);
      handleTextBoxUpdate(id, { zIndex: newZIndex });
    }
  };

  const clearTextBoxes = () => {
    onTextBoxesChange([]);
    setActiveTextBoxId(null);
  };

  return (
    <div className="canvas-wrapper">
      <div className="canvas-container">
        <div className="canvas-stage">
          <canvas ref={canvasRef} className="meme-canvas" />
          <div
            ref={overlayRef}
            className={`canvas-overlay ${currentImage ? "active" : ""}`}
            onPointerDown={(e) => {
              if (e.target === overlayRef.current && currentImage) {
                createTextBoxAt(e.clientX, e.clientY);
              }
            }}
          >
            {currentImage &&
              overlaySize.width > 0 &&
              overlaySize.height > 0 &&
              textBoxes.map((box) => (
                <TextBoxComponent
                  key={box.id}
                  data={box}
                  stageWidth={overlaySize.width}
                  stageHeight={overlaySize.height}
                  isActive={activeTextBoxId === box.id}
                  onUpdate={handleTextBoxUpdate}
                  onDelete={handleTextBoxDelete}
                  onActivate={setActiveTextBoxId}
                  onBringToFront={handleBringToFront}
                />
              ))}
          </div>
          {!currentImage && (
            <div className="canvas-placeholder">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>Upload an image to start creating</p>
            </div>
          )}
        </div>
      </div>
      <div className="control-actions">
        <button
          className="secondary-btn"
          type="button"
          onClick={clearTextBoxes}
          disabled={textBoxes.length === 0}
        >
          Clear All Text
        </button>
      </div>
    </div>
  );
}

