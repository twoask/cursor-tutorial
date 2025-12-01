"use client";

import { useEffect, useRef, useState } from "react";
import type { TextBox as TextBoxType } from "@/lib/schema";

const BOX_PADDING = 12;
const MIN_BOX_WIDTH = 140;
const MIN_BOX_HEIGHT = 60;

interface TextBoxProps {
  data: TextBoxType;
  stageWidth: number;
  stageHeight: number;
  isActive: boolean;
  onUpdate: (id: string, updates: Partial<TextBoxType>) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
  onBringToFront: (id: string) => void;
}

export function TextBox({
  data,
  stageWidth,
  stageHeight,
  isActive,
  onUpdate,
  onDelete,
  onActivate,
  onBringToFront,
}: TextBoxProps) {
  const [isTransforming, setIsTransforming] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const transformStateRef = useRef<{
    type: "move" | "resize";
    direction?: string;
    startX: number;
    startY: number;
    initialRect: { left: number; top: number; width: number; height: number };
  } | null>(null);

  const left = data.leftRatio * stageWidth;
  const top = data.topRatio * stageHeight;
  const width = Math.max(MIN_BOX_WIDTH, data.widthRatio * stageWidth);
  const height = Math.max(MIN_BOX_HEIGHT, data.heightRatio * stageHeight);
  const fontSize = data.fontSize || Math.max(16, stageWidth * (data.fontSizeRatio || 0.05));

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.fontSize = `${fontSize}px`;
    }
  }, [fontSize]);

  const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  };

  const startTransform = (
    type: "move" | "resize",
    event: React.PointerEvent,
    direction?: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    onActivate(data.id);
    onBringToFront(data.id);

    const initialRect = {
      left: data.leftRatio * stageWidth,
      top: data.topRatio * stageHeight,
      width: data.widthRatio * stageWidth,
      height: data.heightRatio * stageHeight,
    };

    transformStateRef.current = {
      type,
      direction,
      startX: event.clientX,
      startY: event.clientY,
      initialRect,
    };

    setIsTransforming(true);
    document.addEventListener("pointermove", handleTransformMove);
    document.addEventListener("pointerup", endTransform);
    document.addEventListener("pointercancel", endTransform);
  };

  const handleTransformMove = (event: PointerEvent) => {
    if (!transformStateRef.current) return;

    const { type, direction, initialRect, startX, startY } = transformStateRef.current;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (type === "move") {
      const newLeft = clamp(
        initialRect.left + deltaX,
        0,
        stageWidth - initialRect.width
      );
      const newTop = clamp(
        initialRect.top + deltaY,
        0,
        stageHeight - initialRect.height
      );

      onUpdate(data.id, {
        leftRatio: newLeft / stageWidth,
        topRatio: newTop / stageHeight,
      });
      return;
    }

    // Resize logic
    let newLeft = initialRect.left;
    let newTop = initialRect.top;
    let newWidth = initialRect.width;
    let newHeight = initialRect.height;

    const dir = direction || "";

    if (dir.indexOf("left") !== -1) {
      newLeft = clamp(
        initialRect.left + deltaX,
        0,
        initialRect.left + initialRect.width - MIN_BOX_WIDTH
      );
      newWidth = initialRect.width + (initialRect.left - newLeft);
    } else if (dir.indexOf("right") !== -1) {
      const maxWidth = stageWidth - initialRect.left;
      newWidth = clamp(initialRect.width + deltaX, MIN_BOX_WIDTH, maxWidth);
    }

    if (dir.indexOf("top") !== -1) {
      newTop = clamp(
        initialRect.top + deltaY,
        0,
        initialRect.top + initialRect.height - MIN_BOX_HEIGHT
      );
      newHeight = initialRect.height + (initialRect.top - newTop);
    } else if (dir.indexOf("bottom") !== -1) {
      const maxHeight = stageHeight - initialRect.top;
      newHeight = clamp(initialRect.height + deltaY, MIN_BOX_HEIGHT, maxHeight);
    }

    newWidth = Math.min(newWidth, stageWidth - newLeft);
    newHeight = Math.min(newHeight, stageHeight - newTop);

    onUpdate(data.id, {
      leftRatio: newLeft / stageWidth,
      topRatio: newTop / stageHeight,
      widthRatio: newWidth / stageWidth,
      heightRatio: newHeight / stageHeight,
    });
  };

  const endTransform = () => {
    setIsTransforming(false);
    transformStateRef.current = null;
    document.removeEventListener("pointermove", handleTransformMove);
    document.removeEventListener("pointerup", endTransform);
    document.removeEventListener("pointercancel", endTransform);
  };

  const normalizeText = (value: string) => {
    return value.replace(/\u00A0/g, " ").replace(/\r/g, "");
  };

  const handleTextInput = () => {
    if (contentRef.current) {
      const text = normalizeText(contentRef.current.innerText);
      onUpdate(data.id, { text });
    }
  };

  return (
    <div
      className={`text-box ${isActive ? "active" : ""} ${
        isTransforming ? "is-transforming" : ""
      }`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: data.zIndex,
      }}
      onPointerDown={() => {
        onActivate(data.id);
        onBringToFront(data.id);
      }}
    >
      <div
        className="text-toolbar"
        onPointerDown={(e) => startTransform("move", e)}
      >
        <span>Text box</span>
        <button
          type="button"
          className="text-box-delete"
          aria-label="Delete text box"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(data.id);
          }}
        >
          &times;
        </button>
      </div>
      <div
        ref={contentRef}
        className="text-content"
        contentEditable
        data-placeholder="Type your text"
        spellCheck={false}
        dir="ltr"
        style={{ unicodeBidi: "plaintext" }}
        onFocus={() => {
          onActivate(data.id);
          onBringToFront(data.id);
        }}
        onInput={handleTextInput}
        suppressContentEditableWarning
      >
        {data.text}
      </div>
      {["top-left", "top-right", "bottom-left", "bottom-right"].map((direction) => (
        <span
          key={direction}
          className={`resize-handle ${direction}`}
          onPointerDown={(e) => startTransform("resize", e, direction)}
        />
      ))}
    </div>
  );
}


