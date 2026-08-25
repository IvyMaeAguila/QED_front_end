import { useState, useCallback } from "react";
import { generateFormalPDF } from "../../ProgressReport/utils/GenerateFormalPDF";

interface UseFormalReportDownloadOptions {
  elementId: string;
  fileName: string;
}

export function useFormalReportDownload({ elementId, fileName }: UseFormalReportDownloadOptions) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await generateFormalPDF(elementId, fileName);
    } finally {
      setDownloading(false);
    }
  }, [elementId, fileName]);

  return { downloading, handleDownload };
}