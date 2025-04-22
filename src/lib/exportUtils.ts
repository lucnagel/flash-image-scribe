// Exports all metadata fields, including tags if present
export const exportMetadataAsJson = (results: any[]) => {
  const exportData = results.map(({ fileName, metadata, status }) => ({
    fileName,
    status,
    metadata: metadata || null
  }));

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `image-metadata-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
