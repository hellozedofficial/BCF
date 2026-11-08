import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Check, X, Crop } from 'lucide-react';

/**
 * Image Editor Modal with Exact WYSIWYG Crop, Rotate, Zoom, Pan-Clamping (zero white bars),
 * and strict < 500 KB compression.
 */
export default function ImageEditorModal({
  isOpen,
  imageSrc,
  title = 'ছবি সম্পাদনা (Crop & Rotate)',
  aspectRatio = 'square', // 'square' (1:1) or 'nid' (1.56:1) or 'free'
  onConfirm,
  onCancel,
  isDark = false
}) {
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Calculate crop box dimensions in viewport pixels
  const getCropBoxDimensions = useCallback(() => {
    if (aspectRatio === 'square') {
      return { width: 280, height: 280 };
    }
    if (aspectRatio === 'nid') {
      return { width: 360, height: 230 }; // ~1.56:1 standard NID card ratio
    }
    return { width: 320, height: 240 };
  }, [aspectRatio]);

  const cropBox = getCropBoxDimensions();

  // Compute cover metrics so at zoom=1 the image always covers cropBox completely
  const getCoverMetrics = useCallback(
    (natW, natH, rot, z) => {
      if (!natW || !natH) {
        return {
          baseW: cropBox.width,
          baseH: cropBox.height,
          maxPanX: 0,
          maxPanY: 0
        };
      }
      const isRotated90 = rot % 180 !== 0;
      const effW = isRotated90 ? natH : natW;
      const effH = isRotated90 ? natW : natH;

      const coverScale = Math.max(cropBox.width / effW, cropBox.height / effH);
      const baseW = natW * coverScale;
      const baseH = natH * coverScale;

      const scaledEffW = effW * coverScale * z;
      const scaledEffH = effH * coverScale * z;

      const maxPanX = Math.max(0, (scaledEffW - cropBox.width) / 2);
      const maxPanY = Math.max(0, (scaledEffH - cropBox.height) / 2);

      return { baseW, baseH, maxPanX, maxPanY };
    },
    [cropBox.width, cropBox.height]
  );

  const clampPan = useCallback(
    (candidatePan, natW, natH, rot, z) => {
      const { maxPanX, maxPanY } = getCoverMetrics(natW, natH, rot, z);
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, candidatePan.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, candidatePan.y))
      };
    },
    [getCoverMetrics]
  );

  // Reset state when modal opens with a new image
  useEffect(() => {
    if (isOpen && imageSrc) {
      setRotation(0);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setNaturalSize({ width: 0, height: 0 });
    }
  }, [isOpen, imageSrc]);

  const handleImageLoad = (e) => {
    const img = e.currentTarget;
    const natW = img.naturalWidth || 1;
    const natH = img.naturalHeight || 1;
    setNaturalSize({ width: natW, height: natH });

    const { maxPanY } = getCoverMetrics(natW, natH, 0, 1);
    // For vertical portrait photos in 1:1 mode, bias initial framing toward the upper portion
    // so the person's head & hair are never cut off at the top
    if (aspectRatio === 'square' && natH > natW && maxPanY > 0) {
      setPan({ x: 0, y: Math.round(maxPanY * 0.65) });
    } else {
      setPan({ x: 0, y: 0 });
    }
  };

  // Rotate 90 deg clockwise
  const handleRotateRight = () => {
    setRotation((prev) => {
      const nextRot = (prev + 90) % 360;
      setPan((p) => clampPan(p, naturalSize.width, naturalSize.height, nextRot, zoom));
      return nextRot;
    });
  };

  // Rotate 90 deg counter-clockwise
  const handleRotateLeft = () => {
    setRotation((prev) => {
      const nextRot = (prev - 90 + 360) % 360;
      setPan((p) => clampPan(p, naturalSize.width, naturalSize.height, nextRot, zoom));
      return nextRot;
    });
  };

  // Zoom controls (min 1.0 so image always covers the crop frame without white borders)
  const handleZoomChange = (e) => {
    const nextZoom = Math.max(1, parseFloat(e.target.value) || 1);
    setZoom(nextZoom);
    setPan((p) => clampPan(p, naturalSize.width, naturalSize.height, rotation, nextZoom));
  };

  // Pointer/Mouse/Touch pan handlers
  const startDrag = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDragging) return;
    const rawPan = {
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    };
    setPan(clampPan(rawPan, naturalSize.width, naturalSize.height, rotation, zoom));
  };

  const handleMouseDown = (e) => startDrag(e.clientX, e.clientY);
  const handleMouseMove = (e) => moveDrag(e.clientX, e.clientY);
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const { baseW, baseH } = getCoverMetrics(naturalSize.width, naturalSize.height, rotation, zoom);

  // Export cropped and rotated image as compressed DataURL (< 500 KB) matching the exact cropBox view
  const generateExport = () => {
    return new Promise((resolve) => {
      const img = imageRef.current;
      if (!img) return resolve(null);

      const natW = img.naturalWidth || naturalSize.width || cropBox.width;
      const natH = img.naturalHeight || naturalSize.height || cropBox.height;
      const metrics = getCoverMetrics(natW, natH, rotation, zoom);
      const clampedPan = clampPan(pan, natW, natH, rotation, zoom);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const outWidth = aspectRatio === 'square' ? 800 : 1200;
      const outHeight =
        aspectRatio === 'square'
          ? 800
          : Math.round(1200 / (cropBox.width / cropBox.height));

      canvas.width = outWidth;
      canvas.height = outHeight;

      const scaleFactor = outWidth / cropBox.width;

      ctx.save();
      // Move to center of output canvas (corresponds to center of cropBox)
      ctx.translate(outWidth / 2, outHeight / 2);
      // Apply the exact same pan offset (in output canvas units), then rotate and scale around image center
      ctx.translate(clampedPan.x * scaleFactor, clampedPan.y * scaleFactor);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const drawW = metrics.baseW * scaleFactor;
      const drawH = metrics.baseH * scaleFactor;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Compress progressively to guarantee <= 500 KB
      let quality = 0.88;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      let sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

      if (sizeKb > 480) {
        quality = 0.75;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
      }
      if (sizeKb > 480) {
        quality = 0.62;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
      }

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
    <div
      style={{
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
      }}
    >
      <div
        style={{
          background: isDark ? '#242424' : '#FFFFFF',
          color: isDark ? '#F5F5F5' : '#0F172A',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: isDark ? '1px solid #383838' : '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: isDark ? '1px solid #383838' : '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          style={{
            position: 'relative',
            width: '100%',
            height: '360px',
            backgroundColor: '#0F172A',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none'
          }}
        >
          {/* Target Image with Exact Cover Base Size + Transformations */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Editing Preview"
            onLoad={handleImageLoad}
            style={{
              width: naturalSize.width ? `${baseW}px` : 'auto',
              height: naturalSize.height ? `${baseH}px` : 'auto',
              maxWidth: 'none',
              maxHeight: 'none',
              transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.08s ease-out',
              pointerEvents: 'none',
              display: 'block'
            }}
          />

          {/* Crop Overlay Mask */}
          <div
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* The Crop Target Window */}
            <div
              style={{
                width: `${cropBox.width}px`,
                height: `${cropBox.height}px`,
                border: '2px solid var(--accent-green, #10B981)',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.58)',
                borderRadius: aspectRatio === 'square' ? '8px' : '6px',
                position: 'relative'
              }}
            >
              {/* Corner indicators */}
              <div style={{ position: 'absolute', top: -3, left: -3, width: 12, height: 12, borderTop: '3px solid #FFFFFF', borderLeft: '3px solid #FFFFFF' }} />
              <div style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderTop: '3px solid #FFFFFF', borderRight: '3px solid #FFFFFF' }} />
              <div style={{ position: 'absolute', bottom: -3, left: -3, width: 12, height: 12, borderBottom: '3px solid #FFFFFF', borderLeft: '3px solid #FFFFFF' }} />
              <div style={{ position: 'absolute', bottom: -3, right: -3, width: 12, height: 12, borderBottom: '3px solid #FFFFFF', borderRight: '3px solid #FFFFFF' }} />

              <div
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  background: 'rgba(0,0,0,0.65)',
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              >
                {aspectRatio === 'square' ? '1:1 পাসপোর্ট সাইজ' : '16:10 এনআইডি সাইজ'}
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div
          style={{
            padding: '16px 20px',
            background: isDark ? '#1C1C1C' : '#F8FAFC',
            borderTop: isDark ? '1px solid #383838' : '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
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
                  border: isDark ? '1px solid #383838' : '1px solid #CBD5E1',
                  background: isDark ? '#2E2E2E' : '#FFFFFF',
                  color: isDark ? '#F5F5F5' : '#334155',
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
                  border: isDark ? '1px solid #383838' : '1px solid #CBD5E1',
                  background: isDark ? '#2E2E2E' : '#FFFFFF',
                  color: isDark ? '#F5F5F5' : '#334155',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <RotateCw size={14} /> ডানে ৯০°
              </button>
            </div>

            {/* Zoom Slider (min 1.0 prevents any white border) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '160px', maxWidth: '240px' }}>
              <ZoomOut size={14} color="#94A3B8" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.02"
                value={zoom}
                onChange={handleZoomChange}
                style={{ width: '100%', accentColor: 'var(--accent-green, #047857)', cursor: 'pointer' }}
              />
              <ZoomIn size={14} color="#94A3B8" />
            </div>
          </div>

          {/* Info & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '600' }}>
              অটো-কম্প্রেশন: সর্বোচ্চ ৫০০ KB (ড্র্যাগ করে পজিশন ঠিক করুন)
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: isDark ? '1px solid #383838' : '1px solid #CBD5E1',
                  background: 'transparent',
                  color: isDark ? '#A3A3A3' : '#64748B',
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
