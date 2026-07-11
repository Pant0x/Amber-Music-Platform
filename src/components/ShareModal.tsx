'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { X, Copy, Check, QrCode, Share2 } from 'lucide-react';
import QRCode from 'qrcode';

export const ShareModal: React.FC = () => {
  const { shareTrack, setShareTrack, playedSeconds } = usePlayerStore();
  const [copied, setCopied] = useState(false);
  const [startAtChecked, setStartAtChecked] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset local state when track changes or modal closes
  useEffect(() => {
    if (!shareTrack) {
      setCopied(false);
      setStartAtChecked(false);
      setShowQrCode(false);
    }
  }, [shareTrack]);

  // QR Code Renderer
  useEffect(() => {
    if (!shareTrack || !showQrCode || !canvasRef.current) return;

    const queryParams = startAtChecked
      ? `?play=${shareTrack.id}&t=${Math.floor(playedSeconds)}`
      : `?play=${shareTrack.id}`;
    const shareUrl = `${window.location.origin}/${queryParams}`;

    QRCode.toCanvas(
      canvasRef.current,
      shareUrl,
      {
        width: 180,
        margin: 2,
        color: {
          dark: '#ffffff',    // White QR codes
          light: '#18181b',   // Zinc-900 background matching the card
        },
        errorCorrectionLevel: 'H', // High error correction to allow center logo placement
      },
      (error) => {
        if (error) {
          console.error('[QR Code] Failed to generate QR code canvas:', error);
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = canvas.width;
        const logoSize = 38;
        const cx = (size - logoSize) / 2;
        const cy = (size - logoSize) / 2;

        // Draw clean rounded dark block behind the logo
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(cx - 3, cy - 3, logoSize + 6, logoSize + 6, 8);
        } else {
          ctx.rect(cx - 3, cy - 3, logoSize + 6, logoSize + 6);
        }
        ctx.fill();

        // Draw track cover art in the center of the QR
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = shareTrack.thumbnailUrl || '';
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(cx, cy, logoSize, logoSize, 6);
          } else {
            ctx.rect(cx, cy, logoSize, logoSize);
          }
          ctx.clip();
          ctx.drawImage(img, cx, cy, logoSize, logoSize);
          ctx.restore();

          // Border for the center logo
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(cx, cy, logoSize, logoSize, 6);
          } else {
            ctx.rect(cx, cy, logoSize, logoSize);
          }
          ctx.stroke();
        };

        // Fallback placeholder if image load fails
        img.onerror = () => {
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, 8, 0, 2 * Math.PI);
          ctx.fill();
        };
      }
    );
  }, [shareTrack, showQrCode, startAtChecked, playedSeconds]);

  if (!shareTrack) return null;

  // Build the direct play URL
  const queryParams = startAtChecked
    ? `?play=${shareTrack.id}&t=${Math.floor(playedSeconds)}`
    : `?play=${shareTrack.id}`;
  const shareUrl = `${window.location.origin}/${queryParams}`;

  // Time formatter for checkboxes (e.g. 0:06)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Social options
  const socials = [
    {
      name: 'WhatsApp',
      color: '#25D366',
      icon: (
        <svg className="w-6 h-6 fill-white" viewBox="-1.8 1.6 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.389 9.806-9.788.002-2.614-1.013-5.071-2.861-6.921-1.848-1.849-4.305-2.862-6.92-2.863-5.41 0-9.81 4.39-9.814 9.789-.001 1.545.42 3.05 1.22 4.363l.979 1.597-1.026 3.743 3.971-.986zm11.303-5.093c-.303-.151-1.793-.884-2.073-.985-.28-.102-.484-.153-.688.152-.204.304-.79.985-.969 1.187-.18.203-.361.228-.664.077-1.123-.563-1.843-.935-2.585-2.206-.196-.336-.196-.548 0-.821.121-.17.303-.353.454-.529.151-.177.202-.303.303-.506.101-.202.05-.379-.025-.53-.076-.151-.688-1.66-.944-2.277-.249-.6-.508-.521-.688-.531-.177-.008-.379-.01-.58-.01s-.529.076-.807.38c-.28.304-1.066 1.041-1.066 2.539 0 1.498 1.087 2.943 1.238 3.146.152.203 2.138 3.263 5.178 4.57.724.311 1.289.497 1.73.637.728.23 1.391.197 1.916.12.584-.087 1.793-.733 2.048-1.441.256-.708.256-1.316.18-1.441-.077-.124-.28-.203-.583-.354z"/>
        </svg>
      ),
      link: () => `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`
    },
    {
      name: 'Facebook',
      color: '#1877F2',
      icon: (
        <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      link: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'X',
      color: '#000000',
      icon: (
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      link: () => `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Email',
      color: '#656565',
      icon: (
        <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      ),
      link: () => `mailto:?subject=${encodeURIComponent('Shared Song')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
    },
    {
      name: 'Reddit',
      color: '#FF4500',
      icon: (
        <svg className="w-6 h-6 fill-white" viewBox="-1.6 2.15 24 24">
          <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.24-3.91 4.15.88c.01 1 .84 1.8 1.82 1.8 1 0 1.8-.8 1.8-1.8s-.8-1.8-1.8-1.8c-.85 0-1.57.59-1.75 1.38l-4.66-1c-.12-.02-.25.04-.31.14L10.9 7.02c-2.48.05-4.73.69-6.39 1.71-.55-.74-1.44-1.22-2.39-1.22-1.65 0-3 1.35-3 3 0 1.11.61 2.08 1.51 2.6-.08.31-.12.63-.12.96 0 3.86 4.49 7 10 7s10-3.14 10-7c0-.33-.04-.65-.11-.96.89-.51 1.5-1.48 1.5-2.59zM6.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm11.23 4.25c-1.12 1.12-3.23 1.21-3.73 1.21-.5 0-2.61-.09-3.73-1.21-.1-.1-.1-.26 0-.36.1-.1.26-.1.36 0 .91.91 2.78.99 3.37.99s2.46-.08 3.37-.99c.1-.1.26-.1.36 0 .1.1.1.26 0 .36zm-.73-4.25c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      ),
      link: () => `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
    },
    {
      name: 'Pinterest',
      color: '#BD081C',
      icon: (
        <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.62 0 11.988-5.367 11.988-11.987C24.005 5.367 18.636 0 12.017 0z"/>
        </svg>
      ),
      link: () => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(shareTrack.thumbnailUrl || '')}&description=${encodeURIComponent(shareText)}`
    }
  ];
  const shareText = `Check out "${shareTrack.title}" by ${shareTrack.channelTitle} on Cloud Music!`;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[100] animate-fade-in px-4">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Share</h3>
          </div>
          <button
            onClick={() => setShareTrack(null)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Social Row */}
          {!showQrCode ? (
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
              {socials.map((soc) => (
                <a
                  key={soc.name}
                  href={soc.link()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
                >
                  <div
                    style={{ backgroundColor: soc.color }}
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 active:scale-95 transition-transform duration-200"
                  >
                    {soc.icon}
                  </div>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">
                    {soc.name}
                  </span>
                </a>
              ))}
              
              {/* QR Toggle Option */}
              <button
                onClick={() => setShowQrCode(true)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-full bg-[#ff0000] flex items-center justify-center shadow-lg group-hover:scale-105 active:scale-95 transition-transform duration-200">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">
                  QR Scan
                </span>
              </button>
            </div>
          ) : (
            /* Premium QR Code Scan Mode */
            <div className="flex flex-col items-center justify-center py-2 animate-scale-up space-y-4">
              <div className="p-4 bg-[#18181b] border border-white/5 rounded-2xl shadow-xl flex flex-col items-center relative group">
                <canvas ref={canvasRef} className="w-[180px] h-[180px] rounded-lg" />
                <div className="absolute inset-0 border border-white/0 group-hover:border-white/5 rounded-2xl transition-all pointer-events-none" />
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                Scan with mobile camera to play
              </p>
              <button
                onClick={() => setShowQrCode(false)}
                className="text-xs font-bold text-zinc-400 hover:text-white underline transition-colors"
              >
                Back to social share
              </button>
            </div>
          )}

          {/* Copy Link Input Bar */}
          <div className="flex items-center gap-3 bg-[#1c1c1c] border border-white/5 rounded-xl p-3">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent border-none text-xs text-zinc-300 font-medium focus:outline-none select-all truncate"
            />
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Start at Checkbox */}
          <div className="pt-2 border-t border-white/5 flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={startAtChecked}
                onChange={(e) => setStartAtChecked(e.target.checked)}
                className="w-4 h-4 bg-zinc-950 border border-white/15 rounded cursor-pointer accent-[#ff0000] focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">
                Start at <span className="text-white font-bold">{formatTime(playedSeconds)}</span>
              </span>
            </label>
          </div>

        </div>
      </div>
    </div>
  );
};
