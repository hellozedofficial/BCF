'use client';

import React, { useEffect, useCallback } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

export default function ImagePreviewModal({
  isOpen,
  activeItem,
  items = [],
  onClose,
  onPrev,
  onNext
}) {
  const currentIndex = items.findIndex(
    it => (it.id && activeItem?.id && it.id === activeItem.id) || it.image === activeItem?.image
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    e => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
    },
    [isOpen, onClose, onPrev, onNext]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !activeItem) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={onClose}
    >
      {/* Top Floating Close Button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 100000,
          background: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '9999px',
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
          transition: 'background 0.2s ease, transform 0.2s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.7)';
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <XMarkIcon className="w-5 h-5" />
      </button>

      {/* Main Image Container */}
      <div
        style={{
          position: 'relative',
          maxWidth: '1200px',
          width: '100%',
          maxHeight: '88vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={activeItem.image}
          alt={activeItem.title || 'Carrom Action Shot'}
          style={{
            maxWidth: '100%',
            maxHeight: '84vh',
            objectFit: 'contain',
            borderRadius: '16px',
            boxShadow: '0 32px 80px -20px rgba(0, 0, 0, 0.95), 0 0 40px rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        />

        {/* Left Arrow Button */}
        {items.length > 1 && onPrev && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous photo"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'background 0.2s ease, transform 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        )}

        {/* Right Arrow Button */}
        {items.length > 1 && onNext && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next photo"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'background 0.2s ease, transform 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        )}

        {/* Subtle Counter Pill at Bottom */}
        {items.length > 1 && currentIndex !== -1 && (
          <div
            style={{
              position: 'absolute',
              bottom: '-38px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '9999px',
              padding: '4px 14px',
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            {currentIndex + 1} / {items.length}
          </div>
        )}
      </div>
    </div>
  );
}
