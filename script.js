// Canvas + rendering state
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
let currentImage = null;

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

// DOM references
const imageUpload = document.getElementById('imageUpload');
const downloadBtn = document.getElementById('downloadBtn');
const clearTextBtn = document.getElementById('clearTextBtn');
const canvasPlaceholder = document.getElementById('canvasPlaceholder');
const templateGrid = document.getElementById('templateGrid');
const canvasOverlay = document.getElementById('canvasOverlay');

// Text box state
const textBoxStore = new Map();
let selectedTemplateId = null;
let zIndexCursor = 1;
let transformState = null;

// Layout constants
const BOX_PADDING = 12;
const MIN_BOX_WIDTH = 140;
const MIN_BOX_HEIGHT = 60;

// Load image from path or data URL
function loadImage(source) {
    const img = new Image();

    img.onload = function() {
        currentImage = img;
        clearTextBoxes({ silent: true });
        if (canvasPlaceholder) {
            canvasPlaceholder.classList.add('hidden');
        }
        toggleOverlay(true);
        downloadBtn.disabled = false;
        updateTextToolsState();
        drawMeme();
    };

    img.onerror = function() {
        console.error('Failed to load image');
        currentImage = null;
        toggleOverlay(false);
        clearTextBoxes({ silent: true });
        if (canvasPlaceholder) {
            canvasPlaceholder.classList.remove('hidden');
        }
        downloadBtn.disabled = true;
    };

    img.src = source;
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

// Draw meme preview to canvas (image + text boxes)
function drawMeme() {
    if (!currentImage) return;

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

    const stage = getOverlaySize();
    if (!stage.width || !stage.height) {
        layoutTextBoxes();
        return;
    }

    const boxes = Array.from(textBoxStore.values())
        .filter((box) => box.text && box.text.trim().length > 0)
        .sort((a, b) => a.zIndex - b.zIndex);

    boxes.forEach((box) => drawTextBoxToCanvas(box, stage));
    layoutTextBoxes();
}

function drawTextBoxToCanvas(box, stage) {
    const scaleX = canvas.width / stage.width;
    const scaleY = canvas.height / stage.height;
    const scale = (scaleX + scaleY) / 2;

    const boxWidth = box.widthRatio * canvas.width;
    const paddingX = BOX_PADDING * scale;
    const paddingY = BOX_PADDING * scale;
    const textCenterX = box.leftRatio * canvas.width + boxWidth / 2;
    const startY = box.topRatio * canvas.height + paddingY;
    const maxTextWidth = Math.max(50, boxWidth - paddingX * 2);
    const baseFont = box.fontSize || Math.max(18, stage.width * (box.fontSizeRatio || 0.05));
    const fontSize = Math.max(12, baseFont * scale);

    ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, fontSize / 8);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillStyle = '#ffffff';

    const lines = splitTextIntoLines(box.text, maxTextWidth);
    const lineHeight = fontSize * 1.2;

    lines.forEach((line, index) => {
        const lineY = startY + index * lineHeight;
        if (!line) {
            return;
        }
        ctx.strokeText(line, textCenterX, lineY);
        ctx.fillText(line, textCenterX, lineY);
    });
}

// Wrap text into lines while preserving manual line breaks
function splitTextIntoLines(text, maxWidth) {
    const normalized = normalizeText(text);
    if (!normalized.length) return [];

    const paragraphs = normalized.split('\n');
    const lines = [];

    paragraphs.forEach((paragraph) => {
        if (!paragraph.trim()) {
            lines.push('');
        } else {
            wrapText(ctx, paragraph, maxWidth).forEach((line) => lines.push(line));
        }
    });

    return lines;
}

// Wrap a single paragraph within a bounding width
function wrapText(context, text, maxWidth) {
    if (!text) return [''];
    if (!maxWidth || maxWidth <= 0) return [text];

    const words = text.split(' ');
    const lines = [];
    let currentLine = words.shift() || '';

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

    return lines.length ? lines : [''];
}

// Helpers for overlay & text boxes
function getOverlaySize() {
    if (!canvasOverlay) return { width: 0, height: 0 };
    const rect = canvasOverlay.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
}

function toggleOverlay(active) {
    if (!canvasOverlay) return;
    canvasOverlay.classList.toggle('active', Boolean(active));
}

function clearTextBoxes(options = {}) {
    const { silent = false } = options;
    textBoxStore.clear();
    if (canvasOverlay) {
        canvasOverlay.innerHTML = '';
    }
    updateTextToolsState();
    if (!silent && currentImage) {
        drawMeme();
    }
}

function updateTextToolsState() {
    if (clearTextBtn) {
        clearTextBtn.disabled = textBoxStore.size === 0;
    }
}

function createTextBoxAt(clientX, clientY) {
    if (!canvasOverlay) return;

    const overlayRect = canvasOverlay.getBoundingClientRect();
    const stageWidth = overlayRect.width;
    const stageHeight = overlayRect.height;

    if (!stageWidth || !stageHeight) return;

    const relativeX = clientX - overlayRect.left;
    const relativeY = clientY - overlayRect.top;
    const rawWidth = Math.min(stageWidth * 0.45, 260);
    const rawHeight = Math.min(stageHeight * 0.25, 140);
    const width = Math.min(stageWidth, Math.max(MIN_BOX_WIDTH, rawWidth));
    const height = Math.min(stageHeight, Math.max(MIN_BOX_HEIGHT, rawHeight));

    const maxLeft = Math.max(stageWidth - width, 0);
    const maxTop = Math.max(stageHeight - height, 0);
    let left = clamp(relativeX - width / 2, 0, maxLeft);
    let top = clamp(relativeY - height / 2, 0, maxTop);

    const id = crypto.randomUUID ? crypto.randomUUID() : `text-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fontSize = Math.max(18, Math.min(34, stageWidth * 0.05));

    const data = {
        id,
        text: '',
        leftRatio: left / stageWidth,
        topRatio: top / stageHeight,
        widthRatio: width / stageWidth,
        heightRatio: height / stageHeight,
        fontSizeRatio: fontSize / stageWidth,
        fontSize,
        zIndex: ++zIndexCursor
    };

    textBoxStore.set(id, data);
    const element = buildTextBoxElement(data);
    canvasOverlay.appendChild(element);
    setActiveTextBox(element);
    bringToFront(id);
    const contentEl = element.querySelector('.text-content');
    if (contentEl) {
        contentEl.focus();
    }
    updateTextToolsState();
    drawMeme();
}

function buildTextBoxElement(data) {
    const element = document.createElement('div');
    element.className = 'text-box';
    element.dataset.id = data.id;

    const toolbar = document.createElement('div');
    toolbar.className = 'text-toolbar';
    const label = document.createElement('span');
    label.textContent = 'Text box';
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'text-box-delete';
    deleteBtn.setAttribute('aria-label', 'Delete text box');
    deleteBtn.innerHTML = '&times;';
    toolbar.appendChild(label);
    toolbar.appendChild(deleteBtn);

    const content = document.createElement('div');
    content.className = 'text-content';
    content.contentEditable = true;
    content.dataset.placeholder = 'Type your text';
    content.spellcheck = false;

    element.appendChild(toolbar);
    element.appendChild(content);

    ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach((direction) => {
        const handle = document.createElement('span');
        handle.className = `resize-handle ${direction}`;
        handle.dataset.direction = direction;
        element.appendChild(handle);
    });

    element.addEventListener('pointerdown', () => {
        setActiveTextBox(element);
        bringToFront(data.id);
    });

    toolbar.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        setActiveTextBox(element);
        bringToFront(data.id);
        startTransform('move', data.id, event);
    });

    deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        removeTextBox(data.id);
    });

    content.addEventListener('focus', () => {
        setActiveTextBox(element);
        bringToFront(data.id);
    });

    content.addEventListener('input', () => {
        const storeItem = textBoxStore.get(data.id);
        if (!storeItem) return;
        storeItem.text = normalizeText(content.innerText);
        drawMeme();
        updateTextToolsState();
    });

    element.querySelectorAll('.resize-handle').forEach((handle) => {
        handle.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
            event.preventDefault();
            setActiveTextBox(element);
            bringToFront(data.id);
            startTransform('resize', data.id, event, handle.dataset.direction);
        });
    });

    applyBoxPosition(element, data);
    return element;
}

function applyBoxPosition(element, data) {
    if (!canvasOverlay) return;
    const stage = getOverlaySize();
    if (!stage.width || !stage.height) return;

    const rawLeft = data.leftRatio * stage.width;
    const rawTop = data.topRatio * stage.height;
    const rawWidth = data.widthRatio * stage.width;
    const rawHeight = data.heightRatio * stage.height;
    const width = Math.min(stage.width, Math.max(MIN_BOX_WIDTH, rawWidth));
    const height = Math.min(stage.height, Math.max(MIN_BOX_HEIGHT, rawHeight));
    const maxLeft = Math.max(stage.width - width, 0);
    const maxTop = Math.max(stage.height - height, 0);
    const left = clamp(rawLeft, 0, maxLeft);
    const top = clamp(rawTop, 0, maxTop);

    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.zIndex = data.zIndex;

    const content = element.querySelector('.text-content');
    if (content) {
        const ratio = data.fontSizeRatio || 0.05;
        data.fontSize = Math.max(16, stage.width * ratio);
        content.style.fontSize = `${data.fontSize}px`;
    }
}

function setActiveTextBox(target) {
    if (!canvasOverlay) return;
    canvasOverlay.querySelectorAll('.text-box').forEach((box) => {
        box.classList.toggle('active', box === target);
    });
}

function bringToFront(id) {
    const data = textBoxStore.get(id);
    if (!data) return;
    data.zIndex = ++zIndexCursor;
    const element = getBoxElement(id);
    if (element) {
        element.style.zIndex = data.zIndex;
    }
}

function startTransform(type, id, event, direction = null) {
    if (!canvasOverlay) return;
    const data = textBoxStore.get(id);
    if (!data) return;

    const stage = getOverlaySize();
    if (!stage.width || !stage.height) return;

    const element = getBoxElement(id);
    if (!element) return;

    const rect = {
        left: data.leftRatio * stage.width,
        top: data.topRatio * stage.height,
        width: data.widthRatio * stage.width,
        height: data.heightRatio * stage.height
    };

    transformState = {
        type,
        id,
        pointerId: event.pointerId,
        direction,
        stage,
        startX: event.clientX,
        startY: event.clientY,
        initialRect: rect
    };

    element.classList.add('is-transforming');
    document.addEventListener('pointermove', handleTransformMove);
    document.addEventListener('pointerup', endTransform);
    document.addEventListener('pointercancel', endTransform);
}

function handleTransformMove(event) {
    if (!transformState || event.pointerId !== transformState.pointerId) return;
    const { type, direction, initialRect, stage, id, startX, startY } = transformState;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (type === 'move') {
        const left = clamp(initialRect.left + deltaX, 0, stage.width - initialRect.width);
        const top = clamp(initialRect.top + deltaY, 0, stage.height - initialRect.height);
        updateBoxRect(id, { left, top, width: initialRect.width, height: initialRect.height }, stage, { skipDraw: true });
        return;
    }

    let newLeft = initialRect.left;
    let newTop = initialRect.top;
    let newWidth = initialRect.width;
    let newHeight = initialRect.height;

    const dir = direction || '';

    if (dir.indexOf('left') !== -1) {
        newLeft = clamp(initialRect.left + deltaX, 0, initialRect.left + initialRect.width - MIN_BOX_WIDTH);
        newWidth = initialRect.width + (initialRect.left - newLeft);
    } else if (dir.indexOf('right') !== -1) {
        const maxWidth = stage.width - initialRect.left;
        newWidth = clamp(initialRect.width + deltaX, MIN_BOX_WIDTH, maxWidth);
    }

    if (dir.indexOf('top') !== -1) {
        newTop = clamp(initialRect.top + deltaY, 0, initialRect.top + initialRect.height - MIN_BOX_HEIGHT);
        newHeight = initialRect.height + (initialRect.top - newTop);
    } else if (dir.indexOf('bottom') !== -1) {
        const maxHeight = stage.height - initialRect.top;
        newHeight = clamp(initialRect.height + deltaY, MIN_BOX_HEIGHT, maxHeight);
    }

    newWidth = Math.min(newWidth, stage.width - newLeft);
    newHeight = Math.min(newHeight, stage.height - newTop);

    updateBoxRect(id, { left: newLeft, top: newTop, width: newWidth, height: newHeight }, stage, { skipDraw: true });
}

function endTransform(event) {
    if (!transformState || (event && event.pointerId !== transformState.pointerId)) return;
    const element = getBoxElement(transformState.id);
    if (element) {
        element.classList.remove('is-transforming');
    }

    document.removeEventListener('pointermove', handleTransformMove);
    document.removeEventListener('pointerup', endTransform);
    document.removeEventListener('pointercancel', endTransform);

    transformState = null;
    drawMeme();
}

function updateBoxRect(id, rect, stage, options = {}) {
    const { skipDraw = false } = options;
    const data = textBoxStore.get(id);
    if (!data) return;

    data.leftRatio = rect.left / stage.width;
    data.topRatio = rect.top / stage.height;
    data.widthRatio = rect.width / stage.width;
    data.heightRatio = rect.height / stage.height;

    const element = getBoxElement(id);
    if (element) {
        applyBoxPosition(element, data);
    }

    if (!skipDraw) {
        drawMeme();
    }
}

function getBoxElement(id) {
    if (!canvasOverlay) return null;
    return canvasOverlay.querySelector(`.text-box[data-id="${id}"]`);
}

function removeTextBox(id) {
    const element = getBoxElement(id);
    if (element) {
        element.remove();
    }
    textBoxStore.delete(id);
    updateTextToolsState();
    drawMeme();
}

function layoutTextBoxes() {
    if (!canvasOverlay || !textBoxStore.size) return;
    const stage = getOverlaySize();
    if (!stage.width || !stage.height) return;

    textBoxStore.forEach((data, id) => {
        const element = getBoxElement(id);
        if (!element) return;
        applyBoxPosition(element, data);
    });
}

// Utility helpers
function normalizeText(value) {
    const safeValue = typeof value === 'string' ? value : '';
    return safeValue.replace(/\u00A0/g, ' ').replace(/\r/g, '');
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Event listeners
if (canvasOverlay) {
    canvasOverlay.addEventListener('pointerdown', (event) => {
        if (event.target !== canvasOverlay) return;
        if (!currentImage) return;
        createTextBoxAt(event.clientX, event.clientY);
    });
}

if (clearTextBtn) {
    clearTextBtn.addEventListener('click', () => {
        if (!textBoxStore.size) return;
        clearTextBoxes();
    });
}

if (imageUpload) {
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
}

if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
        if (!currentImage) return;
        drawMeme();
        canvas.toBlob(function(blob) {
            if (!blob) return;
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
}

window.addEventListener('resize', () => {
    layoutTextBoxes();
    if (currentImage) {
        drawMeme();
    }
});

window.addEventListener('DOMContentLoaded', function() {
    toggleOverlay(false);
    updateTextToolsState();

    if (templateGrid) {
        if (templates.length && selectedTemplateId === null) {
            selectedTemplateId = templates[0].id;
            renderTemplates();
            loadImage(templates[0].src);
        } else {
            renderTemplates();
        }
    }
});
