import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, QrCode as QrCodeIcon, Share2, X } from 'lucide-react';
import { ClassItem } from '../types';

interface QRCodeModalProps {
  classItem: ClassItem;
  instituteName?: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ classItem, instituteName, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const joinUrl = `${window.location.origin}?join=${classItem.joinCode}`;

  useEffect(() => {
    QRCode.toDataURL(
      joinUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [joinUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classItem.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${classItem.name} on TutorFlow`,
          text: `Join ${classItem.name} (${classItem.subject}) on TutorFlow. Join Code: ${classItem.joinCode}`,
          url: joinUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCodeIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{classItem.name}</h3>
              <p className="text-xs text-slate-500">
                {classItem.subject} • {instituteName || 'TutorFlow'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl border-2 border-indigo-100 shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${classItem.name}`}
                className="w-56 h-56 rounded-xl object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-500 text-center">
            Students can scan this QR code with their phone camera to enroll directly.
          </p>

          {/* Join Code Box */}
          <div className="mt-4 w-full p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Unique Join Code
              </span>
              <p className="font-mono text-lg font-bold tracking-widest text-indigo-600">
                {classItem.joinCode}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium shadow-xs transition-colors"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-700 text-xs font-semibold transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copiedLink ? 'Link Copied!' : 'Copy Join Link'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Invitation
          </button>
        </div>
      </div>
    </div>
  );
};
