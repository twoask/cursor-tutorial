// Canvas and state management
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
let currentImage = null;

// Text position state
let topTextPos = { x: null, y: null };
let bottomTextPos = { x: null, y: null };
let isDragging = false;
let draggedText = null; // 'top' or 'bottom'
let dragOffset = { x: 0, y: 0 };

// Template data (defaults from /assets)
const templates = [
    {
        id: 'bear-dog',
        name: 'Bear & Dog',
        src: './assets/Bear And Dog.jpeg'
    },
    {
        id: 'deny-accept',
        name: 'Deny & Accept',
        src: './assets/Deny and Accept.jpg'
    }
];

// DOM elements
const imageUpload = document.getElementById('imageUpload');
const topTextInput = document.getElementById('topText');
const bottomTextInput = document.getElementById('bottomText');
const topTextColorInput = document.getElementById('topTextColor');
const bottomTextColorInput = document.getElementById('bottomTextColor');
const downloadBtn = document.getElementById('downloadBtn');
const canvasPlaceholder = document.getElementById('canvasPlaceholder');
const templateGrid = document.getElementById('templateGrid');
const topColorPreview = document.querySelector('label[for="topTextColor"] .color-preview');
const bottomColorPreview = document.querySelector('label[for="bottomTextColor"] .color-preview');

let selectedTemplateId = null;

// Load image from path or file
function loadImage(source) {
    const img = new Image();
    // We don't set crossOrigin here to avoid CORS issues when running from file:// or simple static servers
    
    img.onload = function() {
        currentImage = img;
        // Reset text positions to default when new image loads
        topTextPos = { x: null, y: null };
        bottomTextPos = { x: null, y: null };
        // Hide placeholder and show canvas
        if (canvasPlaceholder) {
            canvasPlaceholder.classList.add('hidden');
        }
        drawMeme();
        downloadBtn.disabled = false;
    };
    
    img.onerror = function() {
        console.error('Failed to load image');
        // Show placeholder if image fails
        if (canvasPlaceholder) {
            canvasPlaceholder.classList.remove('hidden');
        }
    };
    
    if (typeof source === 'string') {
        img.src = source;
    } else {
        img.src = source;
    }
}

// Render template gallery
function renderTemplates() {
    if (!templateGrid) return;
    
    if (!templates.length) {
        templateGrid.innerHTML = '<p class="template-empty">Add images to /assets to see templates here.</p>';
        return;
    }
    
    templateGrid.innerHTML = '';
    
    templates.forEach((template) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'template-item';
        if (template.id === selectedTemplateId) {
            button.classList.add('selected');
        }
        
        const thumb = document.createElement('div');
        thumb.className = 'template-thumb';
        
        const img = document.createElement('img');
        img.src = template.src;
        img.alt = `${template.name} template`;
        thumb.appendChild(img);
        
        const label = document.createElement('span');
        label.className = 'template-name';
        label.textContent = template.name;
        
        button.appendChild(thumb);
        button.appendChild(label);
        
        button.addEventListener('click', function() {
            selectedTemplateId = template.id;
            renderTemplates();
            loadImage(template.src);
        });
        
        templateGrid.appendChild(button);
    });
}

// Get canvas coordinates from mouse/touch event
function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// Wrap text to fit within a maximum width
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + ' ' + word;
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    return lines;
}

// Check if point is near text (handles wrapped text)
function isPointNearText(x, y, text, textX, textY) {
    if (!text) return false;
    
    ctx.font = `bold ${Math.max(30, canvas.width / 15)}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Calculate max width for wrapping (same as in drawMeme)
    const maxTextWidth = canvas.width * 0.8;
    const lines = wrapText(ctx, text, maxTextWidth);
    
    // Calculate total text dimensions
    let maxLineWidth = 0;
    lines.forEach(line => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxLineWidth) {
            maxLineWidth = metrics.width;
        }
    });
    
    const fontSize = Math.max(30, canvas.width / 15);
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    
    const padding = 10;
    return x >= textX - maxLineWidth / 2 - padding &&
           x <= textX + maxLineWidth / 2 + padding &&
           y >= textY - padding &&
           y <= textY + totalTextHeight + padding;
}

// Draw meme on canvas
function drawMeme() {
    if (!currentImage) return;
    
    // Set canvas size to match image
    canvas.width = currentImage.width;
    canvas.height = currentImage.height;
    
    // Maintain aspect ratio for display
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
    
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    
    // Draw text
    const topText = topTextInput.value.trim();
    const bottomText = bottomTextInput.value.trim();
    
    if (topText || bottomText) {
        // Text styling
        const fontSize = Math.max(30, canvas.width / 15);
        ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.max(4, fontSize / 10); // Thicker border
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Draw top text
        if (topText) {
            let x = topTextPos.x !== null ? topTextPos.x : canvas.width / 2;
            let y = topTextPos.y !== null ? topTextPos.y : 20;
            
            // Calculate max width for wrapping (80% of canvas width, centered)
            const maxTextWidth = canvas.width * 0.8;
            const padding = (canvas.width - maxTextWidth) / 2;
            
            // Ensure text stays within canvas bounds
            x = Math.max(padding + maxTextWidth / 2, Math.min(canvas.width - padding - maxTextWidth / 2, x));
            y = Math.max(20, Math.min(canvas.height - 50, y));
            
            topTextPos.x = x;
            topTextPos.y = y;
            
            ctx.fillStyle = topTextColorInput.value;
            drawTextWithStroke(ctx, topText, x, y, maxTextWidth);
        }
        
        // Draw bottom text
        if (bottomText) {
            let x = bottomTextPos.x !== null ? bottomTextPos.x : canvas.width / 2;
            
            // Calculate max width for wrapping (80% of canvas width, centered)
            const maxTextWidth = canvas.width * 0.8;
            const padding = (canvas.width - maxTextWidth) / 2;
            
            // Estimate text height (will be calculated after wrapping)
            const fontSize = Math.max(30, canvas.width / 15);
            const lineHeight = fontSize * 1.2;
            const estimatedLines = Math.ceil(bottomText.length / 20); // Rough estimate
            const estimatedTextHeight = estimatedLines * lineHeight;
            
            let y = bottomTextPos.y !== null ? bottomTextPos.y : (canvas.height - estimatedTextHeight - 20);
            
            // Ensure text stays within canvas bounds
            x = Math.max(padding + maxTextWidth / 2, Math.min(canvas.width - padding - maxTextWidth / 2, x));
            y = Math.max(20, Math.min(canvas.height - estimatedTextHeight - 20, y));
            
            bottomTextPos.x = x;
            bottomTextPos.y = y;
            
            ctx.fillStyle = bottomTextColorInput.value;
            const lineCount = drawTextWithStroke(ctx, bottomText, x, y, maxTextWidth);
            
            // Adjust y position based on actual line count if needed
            const actualTextHeight = lineCount * lineHeight;
            if (bottomTextPos.y === null || bottomTextPos.y === (canvas.height - estimatedTextHeight - 20)) {
                bottomTextPos.y = canvas.height - actualTextHeight - 20;
            }
        }
    }
}

// Draw text with stroke (outline) and wrapping support
function drawTextWithStroke(ctx, text, x, y, maxWidth = null) {
    // If maxWidth is not provided, use 80% of canvas width with padding
    if (maxWidth === null) {
        maxWidth = canvas.width * 0.8;
    }
    
    // Wrap the text
    const lines = wrapText(ctx, text, maxWidth);
    
    // Calculate line height
    const fontSize = parseInt(ctx.font.match(/\d+/)[0]);
    const lineHeight = fontSize * 1.2;
    
    // Draw each line
    lines.forEach((line, index) => {
        const lineY = y + (index * lineHeight);
        ctx.strokeText(line, x, lineY);
        ctx.fillText(line, x, lineY);
    });
    
    return lines.length; // Return number of lines for height calculation
}

// Handle image upload
imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        selectedTemplateId = null;
        renderTemplates();
        const reader = new FileReader();
        
        reader.onload = function(event) {
            loadImage(event.target.result);
        };
        
        reader.readAsDataURL(file);
    }
});

// Handle text input changes
topTextInput.addEventListener('input', drawMeme);
bottomTextInput.addEventListener('input', drawMeme);

// Handle color changes
topTextColorInput.addEventListener('input', function() {
    if (topColorPreview) {
        topColorPreview.style.backgroundColor = topTextColorInput.value;
    }
    drawMeme();
});

bottomTextColorInput.addEventListener('input', function() {
    if (bottomColorPreview) {
        bottomColorPreview.style.backgroundColor = bottomTextColorInput.value;
    }
    drawMeme();
});


// Handle download
downloadBtn.addEventListener('click', function() {
    if (!currentImage) return;
    
    canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meme.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
});

// Mouse/Touch event handlers for dragging text
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('touchstart', handleStart, { passive: false });

canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('touchmove', handleMove, { passive: false });

canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('touchend', handleEnd);
canvas.addEventListener('mouseleave', handleEnd);

function handleStart(e) {
    if (!currentImage || canvas.width === 0 || canvas.height === 0) return;
    
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    const topText = topTextInput.value.trim();
    const bottomText = bottomTextInput.value.trim();
    
    // Set font for text measurement
    const fontSize = Math.max(30, canvas.width / 15);
    ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Check which text is being clicked
    const topTextX = topTextPos.x !== null ? topTextPos.x : canvas.width / 2;
    const topTextY = topTextPos.y !== null ? topTextPos.y : 20;
    
    if (topText && isPointNearText(coords.x, coords.y, topText, topTextX, topTextY)) {
        isDragging = true;
        draggedText = 'top';
        dragOffset.x = coords.x - topTextX;
        dragOffset.y = coords.y - topTextY;
        canvas.style.cursor = 'grabbing';
    } else {
        const bottomTextX = bottomTextPos.x !== null ? bottomTextPos.x : canvas.width / 2;
        const metrics = ctx.measureText(bottomText);
        const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        const bottomTextY = bottomTextPos.y !== null ? bottomTextPos.y : (canvas.height - textHeight - 20);
        
        if (bottomText && isPointNearText(coords.x, coords.y, bottomText, bottomTextX, bottomTextY)) {
            isDragging = true;
            draggedText = 'bottom';
            dragOffset.x = coords.x - bottomTextX;
            dragOffset.y = coords.y - bottomTextY;
            canvas.style.cursor = 'grabbing';
        }
    }
}

function handleMove(e) {
    if (!currentImage || canvas.width === 0 || canvas.height === 0) return;
    
    if (!isDragging) {
        // Update cursor on hover
        const coords = getCanvasCoordinates(e);
        const topText = topTextInput.value.trim();
        const bottomText = bottomTextInput.value.trim();
        
        // Set font for text measurement
        const fontSize = Math.max(30, canvas.width / 15);
        ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        let hovering = false;
        const topTextX = topTextPos.x !== null ? topTextPos.x : canvas.width / 2;
        const topTextY = topTextPos.y !== null ? topTextPos.y : 20;
        
        if (topText && isPointNearText(coords.x, coords.y, topText, topTextX, topTextY)) {
            canvas.style.cursor = 'grab';
            hovering = true;
        } else {
            const bottomTextX = bottomTextPos.x !== null ? bottomTextPos.x : canvas.width / 2;
            const metrics = ctx.measureText(bottomText);
            const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            const bottomTextY = bottomTextPos.y !== null ? bottomTextPos.y : (canvas.height - textHeight - 20);
            
            if (bottomText && isPointNearText(coords.x, coords.y, bottomText, bottomTextX, bottomTextY)) {
                canvas.style.cursor = 'grab';
                hovering = true;
            }
        }
        
        if (!hovering) {
            canvas.style.cursor = 'default';
        }
        return;
    }
    
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    
    if (draggedText === 'top') {
        topTextPos.x = coords.x - dragOffset.x;
        topTextPos.y = coords.y - dragOffset.y;
    } else if (draggedText === 'bottom') {
        bottomTextPos.x = coords.x - dragOffset.x;
        bottomTextPos.y = coords.y - dragOffset.y;
    }
    
    drawMeme();
}

function handleEnd(e) {
    if (isDragging) {
        isDragging = false;
        draggedText = null;
        canvas.style.cursor = 'default';
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', function() {
    if (templateGrid) {
        if (templates.length && selectedTemplateId === null) {
            selectedTemplateId = templates[0].id;
            renderTemplates();
            loadImage(templates[0].src);
        } else {
            renderTemplates();
        }
    }
    
    // Initialize color previews
    if (topColorPreview && topTextColorInput) {
        topColorPreview.style.backgroundColor = topTextColorInput.value;
    }
    if (bottomColorPreview && bottomTextColorInput) {
        bottomColorPreview.style.backgroundColor = bottomTextColorInput.value;
    }
});
