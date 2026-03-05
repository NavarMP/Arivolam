"use client";

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { UploadCloud, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    aspectRatio?: number; // e.g., 1 for logo (square), 3 for cover (3:1)
    label?: string;
    placeholder?: string;
    bucket?: string;
    folder?: string; // e.g. "logos" or "covers"
    width?: number; // target crop width
    height?: number; // target crop height
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Helper to create an image element from a URL
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.src = url;
    });

// Helper to crop the image onto a canvas and return a Blob
async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    targetWidth?: number,
    targetHeight?: number
): Promise<Blob | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = targetWidth || pixelCrop.width;
    canvas.height = targetHeight || pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            resolve(file);
        }, "image/webp", 0.9);
    });
}

export function ImageUpload({
    value,
    onChange,
    aspectRatio = 1,
    label = "Upload Image",
    placeholder = "Drag & drop an image here, or click to select",
    bucket = "institution-media",
    folder = "general",
    width,
    height,
}: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Crop dialog state
    const [showCropDialog, setShowCropDialog] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFile = (file: File) => {
        if (!SUPPORTED_TYPES.includes(file.type)) {
            toast.error("Invalid file type. Only JPG, PNG, and WEBP are supported.");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File is too large. Max size is 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setImageSrc(reader.result?.toString() || null);
            setShowCropDialog(true);
        });
        reader.readAsDataURL(file);

        // Reset file input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleUploadCroppedImage = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsUploading(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, width, height);
            if (!croppedBlob) throw new Error("Failed to crop image");

            // Create a unique filename
            const timestamp = Date.now();
            const fileName = `${folder}/${timestamp}.webp`;

            const formData = new FormData();
            formData.append("file", croppedBlob);
            formData.append("bucket", bucket);
            formData.append("fileName", fileName);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to upload image");
            }

            const data = await response.json();

            onChange(data.url);
            setShowCropDialog(false);
            setImageSrc(null);
            toast.success(`${label} uploaded successfully`);
        } catch (error: any) {
            toast.error(error.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                {value && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-8 px-2"
                        onClick={() => onChange("")}
                    >
                        <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                )}
            </div>

            <div
                className={`
                    relative rounded-xl border-2 border-dashed transition-all
                    ${isDragging ? "border-primary bg-primary/5" : "border-border/50 bg-card hover:bg-accent/50 hover:border-border"}
                    ${value ? "p-2" : "p-8 text-center"}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !value && fileInputRef.current?.click()}
            >
                {value ? (
                    <div className="relative group overflow-hidden rounded-lg">
                        <img
                            src={value}
                            alt="Uploaded preview"
                            className="w-full h-auto object-cover max-h-64 rounded-lg"
                        />
                        <div
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <span className="text-white text-sm font-medium">Click to replace</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 cursor-pointer">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <UploadCloud className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium">{placeholder}</p>
                        <p className="text-xs text-muted-foreground">Up to 5MB (JPG, PNG, WEBP)</p>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg, image/png, image/webp"
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            handleFile(e.target.files[0]);
                        }
                    }}
                />
            </div>

            {/* Crop Dialog */}
            <Dialog open={showCropDialog} onOpenChange={(open) => !isUploading && setShowCropDialog(open)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Crop Image</DialogTitle>
                    </DialogHeader>

                    <div className="relative h-[60vh] w-full bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden">
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspectRatio}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        )}
                    </div>

                    <div className="px-2">
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCropDialog(false);
                                setImageSrc(null);
                            }}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUploadCroppedImage} disabled={isUploading}>
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                "Crop & Upload"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
