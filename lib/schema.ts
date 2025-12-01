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


