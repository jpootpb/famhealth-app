/**
 * Utility helper to open Base64 PDF or Image files in a dedicated full-resolution browser tab
 */
export function openDocumentInNewTab(dataUrl: string, title: string = 'Documento') {
  try {
    if (dataUrl.startsWith('data:application/pdf')) {
      const arr = dataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, '_blank');
      if (newWin) {
        newWin.document.title = title;
      }
    } else {
      const newWin = window.open();
      if (newWin) {
        newWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>${title}</title><style>body{margin:0;background:#1e293b;display:flex;justify-content:center;align-items:center;min-height:100vh;}img{max-width:100%;max-height:100vh;object-fit:contain;}</style></head>
            <body><img src="${dataUrl}" alt="${title}"/></body>
          </html>
        `);
      }
    }
  } catch (err) {
    console.error('Failed to open document in new tab', err);
    window.open(dataUrl, '_blank');
  }
}
