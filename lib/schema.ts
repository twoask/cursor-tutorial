import type { Schema } from "@instantdb/react";

export type TextBox = {
  id: string;
  text: string;
  leftRatio: number;
  topRatio: number;
  widthRatio: number;
  heightRatio: number;
  fontSizeRatio: number;
  fontSize?: number;
  fillColor?: string;
  strokeColor?: string;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  zIndex: number;
};

export type Meme = {
  id: string;
  userId: string;
  imageData: string; // base64 encoded image
  textBoxes: TextBox[];
  upvotes: number;
  createdAt: number;
};

export type Upvote = {
  id: string;
  memeId: string;
  userId: string;
  createdAt: number;
};

export const schema: Schema = {
  memes: {
    id: { type: "string" },
    userId: { type: "string" },
    imageData: { type: "string" },
    textBoxes: { type: "json" },
    upvotes: { type: "number", default: 0 },
    createdAt: { type: "number", default: () => Date.now() },
  },
  upvotes: {
    id: { type: "string" },
    memeId: { type: "string" },
    userId: { type: "string" },
    createdAt: { type: "number", default: () => Date.now() },
  },
};


