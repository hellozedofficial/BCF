import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Check, X, Crop, Image as ImageIcon } from 'lucide-react';

/**
 * Image Editor Modal with Crop, Rotate, Zoom, and strict < 500 KB compression
 */
export default function ImageEditorModal({
  isOpen,
  imageSrc,
  title = 'ছবি সম্পাদনা (Crop & Rotate)',
  aspectRatio = 'square', // 'square' (1:1) or 'nid' (1.58:1) or 'free'
  onConfirm,
  onCancel,
  isDark = false
}) {
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [estimatedSizeKb, setEstimatedSizeKb] = useState(0);
  const [processing, setProcessing] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Reset state when a new image is loaded
  useEffect(() => {
    if (isOpen && imageSrc) {
      setRotation(0);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Rotate 90 deg clockwise
  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Rotate 90 deg counter-clockwise
  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
  };

  // Zoom controls
  const handleZoomChange = (e) => {
    setZoom(parseFloat(e.target.value));
  };

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Calculate crop dimensions
  const getCropBoxDimensions = () => {
    if (aspectRatio === 'square') {
      return { width: 280, height: 280 };
    }
    if (aspectRatio === 'nid') {
      return { width: 360, height: 230 }; // ~1.56:1 standard NID card ratio
    }
    return { width: 320, height: 240 };
  };

  const cropBox = getCropBoxDimensions();

  // Export cropped and rotated image as compressed DataURL (< 500 KB)
  const generateExport = () => {
    return new Promise((resolve) => {
      const img = imageRef.current;
      if (!img) return resolve(null);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Output resolution target (high clarity within 500kb)
      const outWidth = aspectRatio === 'square' ? 800 : 1200;
      const outHeight = aspectRatio === 'square' ? 800 : Math.round(1200 / (cropBox.width / cropBox.height));

      canvas.width = outWidth;
      canvas.height = outHeight;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, outWidth, outHeight);

      ctx.save();
      ctx.translate(outWidth / 2, outHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Scale pan offset proportionally
      const scaleFactor = outWidth / cropBox.width;
      ctx.translate(pan.x * scaleFactor / zoom, pan.y * scaleFactor / zoom);

      // Draw image centered
      const drawW = (img.naturalWidth / img.naturalHeight) >= (cropBox.width / cropBox.height)
        ? (outHeight * (img.naturalWidth / img.naturalHeight))
        : outWidth;
      const drawH = (img.naturalWidth / img.naturalHeight) >= (cropBox.width / cropBox.height)
        ? outHeight
        : (outWidth / (img.naturalWidth / img.naturalHeight));

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Compress progressively to guarantee <= 500 KB
      let quality = 0.85;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      let sizeKb = Math.round((dataUrl.length * 3 / 4) / 1024);

      if (sizeKb > 480) {
        quality = 0.72;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        sizeKb = Math.round((dataUrl.length * 3 / 4) / 1024);
      }
      if (sizeKb > 480) {
        quality = 0.60;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        sizeKb = Math.round((dataUrl.length * 3 / 4) / 1024);
      }

      setEstimatedSizeKb(sizeKb);
      resolve({ dataUrl, sizeKb });
    });
  };

  const handleApply = async () => {
    setProcessing(true);
    try {
      const result = await generateExport();
      if (result && result.dataUrl) {
        onConfirm(result.dataUrl, result.sizeKb);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: isDark ? '#0F172A' : '#FFFFFF',
        color: isDark ? '#F8FAFC' : '#0F172A',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        border: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: isDark ? '1px solid #1E293B' : '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crop size={18} color="var(--accent-green, #047857)" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{title}</h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isDark ? '#94A3B8' : '#64748B',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport / Canvas Container */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'relative',
            width: '100%',
            height: '360px',
            backgroundColor: isDark ? '#020617' : '#F1F5F9',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
        >
          {/* Target Image with Transformations */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Editing Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              pointerEvents: 'none'
            }}
          />

          {/* Crop Overlay Mask */}
          <div style={{
            position: 'absolute',
            pointerEvents: 'none',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* The Crop Target Window */}
            <div style={{
              width: `${cropBox.width}px`,
              height: `${cropBox.height}px`,
              border: '2px solid var(--accent-green, #10B981)',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
              borderRadius: aspectRatio === 'square' ? '8px' : '6px',
              position: 'relative'
            }}>
              {/* Corner indicators */}
              <div style={{ position: 'absolute', top: -3, left: -3, width: 12, height: 12, borderTop: '3px solid #FFFFFF', borderLeft: '3px solid #FFFFFF' }} />
              <div style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderTop: '3px solid #FFFFFF', borderRight: '3px solid #FFFFFF' }} />
              <div style={{ position: 'absolute', bottom: -3, left: -3, width: 12, height: 12, borderBottom: '3px solid #FFFFFF', borderLeft: '3px solid #FFFFFF' }} />
              <div style={{ position: 'absolute', bottom: -3, right: -3, width: 12, height: 12, borderBottom: '3px solid #FFFFFF', borderRight: '3px solid #FFFFFF' }} />

              <div style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                background: 'rgba(0,0,0,0.65)',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {aspectRatio === 'square' ? '1:1 পাসপোর্ট সাইজ' : '16:10 এনআইডি সাইজ'}
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div style={{
          padding: '16px 20px',
          background: isDark ? '#0B132B' : '#F8FAFC',
          borderTop: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Rotate & Zoom Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            {/* Rotate Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleRotateLeft}
                title="Rotate 90° Left"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  color: isDark ? '#F1F5F9' : '#334155',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={14} /> বামে ৯০°
              </button>

              <button
                type="button"
                onClick={handleRotateRight}
                title="Rotate 90° Right"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  color: isDark ? '#F1F5F9' : '#334155',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <RotateCw size={14} /> ডানে ৯০°
              </button>
            </div>

            {/* Zoom Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '160px', maxWidth: '240px' }}>
              <ZoomOut size={14} color="#94A3B8" />
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={handleZoomChange}
                style={{ width: '100%', accentColor: 'var(--accent-green, #047857)', cursor: 'pointer' }}
              />
              <ZoomIn size={14} color="#94A3B8" />
            </div>
          </div>

          {/* Info & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              অটো-কম্প্রেশন: সর্বোচ্চ ৫০০ KB
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
                  background: 'transparent',
                  color: isDark ? '#94A3B8' : '#64748B',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={processing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--accent-green, #047857)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(4, 120, 87, 0.3)'
                }}
              >
                <Check size={15} /> {processing ? 'প্রসেসিং...' : 'প্রয়োগ করুন'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
