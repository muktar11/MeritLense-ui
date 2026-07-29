"use client"

import { useCallback, useEffect, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import "react-easy-crop/react-easy-crop.css"
import { X } from "lucide-react"

interface ManualPhotoCropModalProps {
  file: File
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

// Fallback/override for whoever's filling out the candidate form when the
// automatic face-detection crop either failed (no-face, multiple-faces,
// face-too-small, low-quality) or just isn't the framing they want -
// lets them draw the verification photo themselves instead. A manually
// drawn and confirmed crop is trusted as-is; it deliberately isn't run
// back through the automated quality gate, since the whole point is to
// let a human override an automated check that couldn't produce a good
// result on its own.
export function ManualPhotoCropModal({ file, onConfirm, onCancel }: ManualPhotoCropModalProps) {
  const [imageUrl] = useState(() => URL.createObjectURL(file))
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl)
  }, [imageUrl])

  const handleCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const blob = await cropImageToBlob(imageUrl, croppedAreaPixels)
      onConfirm(blob)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-900">Crop the face manually</h3>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="relative h-80 bg-gray-900">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-gray-500">
            Drag to position, use the slider to zoom, then frame the face clearly within the box.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!croppedAreaPixels || processing}
              className="px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Processing..." : "Use this crop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

async function cropImageToBlob(imageUrl: string, area: Area): Promise<Blob> {
  const image = await loadImage(imageUrl)
  const width = Math.max(1, Math.round(area.width))
  const height = Math.max(1, Math.round(area.height))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not supported")
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, width, height)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to crop image"))),
      "image/jpeg",
      0.92
    )
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = src
  })
}
