"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useQuery, tx, transact, id as dbId } from "@/lib/instantdb";
import { MemeCanvas } from "@/components/MemeCanvas";
import { TemplateGallery } from "@/components/TemplateGallery";
import type { TextBox } from "@/lib/schema";
import Link from "next/link";

const templates = [
  {
    id: "bear-dog",
    name: "Bear & Dog",
    src: "/assets/Bear And Dog.jpeg",
  },
  {
    id: "deny-accept",
    name: "Deny & Accept",
    src: "/assets/Deny and Accept.jpg",
  },
];

export default function CreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMemeId = searchParams.get("edit");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);


  // Load meme data if editing
  const { data: memeData } = useQuery(
    editMemeId
      ? {
          memes: {
            $: {
              where: {
                id: editMemeId,
              },
            },
          },
        }
      : null
  );

  useEffect(() => {
    if (editMemeId && memeData?.memes?.[0] && user?.id === memeData.memes[0].userId) {
      const meme = memeData.memes[0];
      setImageSource(meme.imageData);
      setTextBoxes(meme.textBoxes || []);
      setIsEditing(true);
    } else if (editMemeId && memeData?.memes?.[0] && user?.id !== memeData.memes[0].userId) {
      alert("You can only edit your own memes");
      router.push("/feed");
    }
  }, [editMemeId, memeData, user, router]);

  useEffect(() => {
    if (!user) {
      router.push("/feed");
    }
  }, [user, router]);

  const handleTemplateSelect = (template: typeof templates[0]) => {
    setSelectedTemplateId(template.id);
    setImageSource(template.src);
    setTextBoxes([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedTemplateId(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSource(event.target?.result as string);
        setTextBoxes([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Wait a bit for canvas to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meme.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const handlePostMeme = async () => {
    if (!user || !imageSource || !canvasRef.current) return;

    setErrorMessage(null);
    setIsPosting(true);
    try {
      // Wait a bit for canvas to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Convert canvas to base64
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL("image/png");

      if (isEditing && editMemeId) {
        // Update existing meme
        transact(tx.memes[editMemeId].update({ imageData, textBoxes }));
      } else {
        // Create new meme
        const memeId = dbId();
        transact(
          tx.memes[memeId].update({
            userId: user.id,
            imageData,
            textBoxes,
            upvotes: 0,
            createdAt: Date.now(),
          })
        );
      }

      router.push("/feed?posted=1");
    } catch (error) {
      console.error("Error posting meme:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to post meme. Please try again."
      );
    } finally {
      setIsPosting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="app-wrapper">
      <nav className="nav-header">
        <div className="nav-links">
          <Link href="/feed" className="nav-link">
            Browse Memes
          </Link>
          <Link href="/create" className="nav-link active">
            Create Meme
          </Link>
        </div>
      </nav>

      <header className="main-header">
        <div className="header-content">
          <div className="logo">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h1>{isEditing ? "Edit Meme" : "Create Meme"}</h1>
          </div>
          <p className="tagline">Design your meme masterpiece</p>
        </div>
      </header>

      <main className="main-content">
        {errorMessage && (
          <div className="alert error">
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)}>Dismiss</button>
          </div>
        )}
        <div className="content-grid">
          <section className="card templates-card">
            <div className="card-header">
              <h2>Choose a Template</h2>
              <p className="card-subtitle">
                Pick a starter image or upload your own
              </p>
            </div>
            <TemplateGallery
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={handleTemplateSelect}
            />
            <p className="template-hint">
              Templates live in <code>/public/assets</code>. Add more images to
              expand the gallery.
            </p>
          </section>

          <section className="card upload-card">
            <div className="card-header">
              <h2>Upload Image</h2>
              <p className="card-subtitle">Choose an image to get started</p>
            </div>
            <div className="upload-area">
              <label htmlFor="imageUpload" className="upload-label">
                <div className="upload-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17 8L12 3L7 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 3V15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="upload-text">Click to upload or drag and drop</span>
                <span className="upload-hint">PNG, JPG, GIF up to 10MB</span>
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </section>

          <section className="card canvas-card">
            <div className="card-header">
              <h2>Preview</h2>
              <p className="card-subtitle">
                Click the image to add draggable text boxes
              </p>
            </div>
            <MemeCanvas
              imageSource={imageSource}
              textBoxes={textBoxes}
              onTextBoxesChange={setTextBoxes}
              canvasRef={canvasRef}
            />
          </section>

          <section className="card controls-card">
            <div className="card-header">
              <h2>Customize</h2>
              <p className="card-subtitle">
                Click the preview to add, move, resize, or delete text
              </p>
            </div>

            <div className="controls">
              <div className="text-instructions">
                <div className="instruction-item">
                  <div className="instruction-icon">1</div>
                  <div className="instruction-copy">
                    <h3>Click to add text</h3>
                    <p>
                      Tap anywhere on the canvas to drop a new text box exactly
                      where you click.
                    </p>
                  </div>
                </div>
                <div className="instruction-item">
                  <div className="instruction-icon">2</div>
                  <div className="instruction-copy">
                    <h3>Drag to move</h3>
                    <p>
                      Use the floating toolbar on each box to drag it around
                      the canvas.
                    </p>
                  </div>
                </div>
                <div className="instruction-item">
                  <div className="instruction-icon">3</div>
                  <div className="instruction-copy">
                    <h3>Resize & delete</h3>
                    <p>
                      Grab the four corner dots to resize or hit the × button to
                      remove the text.
                    </p>
                  </div>
                </div>
              </div>

              <div className="control-actions">
                <button
                  className="download-btn"
                  onClick={handleDownload}
                  disabled={!imageSource}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 10L12 15L17 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 15V3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Download Meme</span>
                </button>
                <button
                  className="post-btn"
                  onClick={handlePostMeme}
                  disabled={!imageSource || isPosting}
                >
                  <span>
                    {isPosting
                      ? isEditing
                        ? "Updating..."
                        : "Posting..."
                      : isEditing
                      ? "Update Meme"
                      : "Post Meme"}
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

