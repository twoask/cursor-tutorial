"use client";

interface Template {
  id: string;
  name: string;
  src: string;
}

interface TemplateGalleryProps {
  templates: Template[];
  selectedTemplateId: string | null;
  onSelectTemplate: (template: Template) => void;
}

export function TemplateGallery({
  templates,
  selectedTemplateId,
  onSelectTemplate,
}: TemplateGalleryProps) {
  if (!templates.length) {
    return (
      <p className="template-empty">
        Add images to /public/assets to see templates here.
      </p>
    );
  }

  return (
    <div className="template-grid">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          className={`template-item ${
            template.id === selectedTemplateId ? "selected" : ""
          }`}
          onClick={() => onSelectTemplate(template)}
        >
          <div className="template-thumb">
            <img src={template.src} alt={`${template.name} template`} />
          </div>
          <span className="template-name">{template.name}</span>
        </button>
      ))}
    </div>
  );
}



