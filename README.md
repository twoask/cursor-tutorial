# Meme Generator

A modern, dark-themed meme generator powered by vanilla JavaScript, HTML, and CSS. Quickly create memes by picking one of the built-in templates (loaded from the `assets/` directory) or uploading your own image, then add draggable top and bottom text with custom colors before exporting.

## Features

- **Template Gallery**: Choose from preloaded templates stored in `assets/`
- **Image Upload**: Bring your own images with the drag-and-drop uploader
- **Draggable Text Overlay**: Position top and bottom text anywhere on the canvas
- **Color Controls**: Customize text colors with live previews
- **Download**: Export the finished meme as a PNG image

## Usage

1. Open `index.html` in a modern browser (double-click or serve via a static server)
2. Pick a template from the gallery (prepopulated from `/assets`) or upload your own image
3. Enter top/bottom text, pick colors, and drag the text to fine-tune placement
4. Click **Download Meme** to save the meme as `meme.png`

## File Structure

```
/
├── index.html          # App layout + sections
├── styles.css          # Modern dark theme + responsive layout
├── script.js           # Canvas logic, template loader, interactions
├── assets/             # Default meme images shown in the gallery
│   ├── Bear And Dog.jpeg
│   └── Deny and Accept.jpg
└── README.md           # Project documentation
```

## Customization

To add more default templates:

1. Drop new image files into the `assets/` directory (JPEG/PNG work best)
2. Update the `templates` array in `script.js` with the file name and friendly label

## Browser Support

Works in all modern browsers that support:
- HTML5 Canvas API
- FileReader API
- ES6 JavaScript features

## License

Free to use and modify.
