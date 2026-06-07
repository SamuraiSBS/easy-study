import { Download, Paperclip } from 'lucide-react';
import { useState } from 'react';
import { AnimatedButton } from './Motion';
import { api } from '../services/api';
import type { OrderAttachment } from '../types';

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} Б`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} КБ`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

export function AttachmentList({ orderId, attachments }: { orderId: number; attachments: OrderAttachment[] }) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  async function download(attachment: OrderAttachment) {
    setDownloadingId(attachment.id);
    try {
      await api.downloadOrderAttachment(orderId, attachment);
    } finally {
      setDownloadingId(null);
    }
  }

  if (!attachments.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-2xl border border-app-line bg-white px-3 py-2">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2 font-medium">
              <Paperclip size={16} className="shrink-0 text-app-accent" />
              <span className="truncate">{attachment.original_filename}</span>
            </div>
            <div className="mt-0.5 text-xs text-app-muted">{formatFileSize(attachment.size_bytes)}</div>
          </div>
          <AnimatedButton
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-app-line text-app-muted"
            onClick={() => void download(attachment)}
            disabled={downloadingId === attachment.id}
            title="Скачать файл"
          >
            <Download size={16} />
          </AnimatedButton>
        </div>
      ))}
    </div>
  );
}
