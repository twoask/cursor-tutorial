# Meme Generator

A modern, dark-themed meme generator powered by Next.js 16, React 19, and InstantDB. Quickly create memes by picking one of the built-in templates (loaded from `public/assets/`) or uploading your own image, then add draggable top and bottom text with custom colors before exporting or sharing to the feed.

## Features

- **Template Gallery**: Choose from preloaded templates stored in `public/assets/`
- **Image Upload**: Bring your own images with the drag-and-drop uploader
- **Draggable Text Overlay**: Position top and bottom text anywhere on the canvas
- **Color Controls**: Customize text colors with live previews
- **Download**: Export the finished meme as a PNG image

## Usage

1. Open `index.html` in a modern browser (double-click or serve via a static server)
2. Pick a template from the gallery (prepopulated from `/assets`) or upload your own image
3. Enter top/bottom text, pick colors, and drag the text to fine-tune placement
4. Click **Download Meme** to save the meme as `meme.png`

## Environment Setup

- Use Node.js 20.9 or newer (required by Next.js 16).
- Duplicate `env.example` to `.env.local` (for Next.js) and set `NEXT_PUBLIC_INSTANTDB_APP_ID` to your InstantDB app id (the default value already points at `23683b32-9ab6-4f30-8b2d-d1fdcaa6906b`).

## Run the App

1. Install dependencies: `npm install`
2. Start the Next.js dev server: `npm run dev`
3. Open `http://localhost:3000` to browse (`/feed`) or create (`/create`) memes backed by InstantDB.
4. For production builds run `npm run build` followed by `npm start`.


## File Structure

```
/
├── app/                # Next.js app router pages (feed, create, etc.)
├── components/         # Shared UI (MemeCanvas, AuthButton, MemeCard, ...)
├── lib/                # InstantDB client + schema
├── public/
│   └── assets/         # Default meme images shown in the gallery
│       ├── Bear And Dog.jpeg
│       └── Deny and Accept.jpg
└── README.md           # Project documentation
```

## Customization

To add more default templates:

1. Drop new image files into `public/assets/` (JPEG/PNG work best so Next.js can serve them at `/assets/...`).
2. If you still rely on the legacy vanilla build (`index.html`), also copy them into the top-level `assets/` folder.
3. Update the template metadata (e.g., the `templates` array in the meme editor) with the file name and friendly label.

## Browser Support

Works in all modern browsers that support:
- HTML5 Canvas API
- FileReader API
- ES6 JavaScript features

## License

Free to use and modify.
