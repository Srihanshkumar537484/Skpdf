/**
 * Privacy-First Google Analytics 4 (GA4) Integration for SkPDF.
 * 
 * Instructions:
 * Set your Measurement ID in index.html (window.GA_MEASUREMENT_ID = 'G-XXXXXXXXXX')
 * or via environment variable VITE_GA_MEASUREMENT_ID.
 * 
 * Respects strict privacy guidelines:
 * - IP anonymization enabled
 * - No document content, filename, text or sensitive PII is ever tracked
 * - Only anonymized tool events, performance latencies, and conversion counters are tracked
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    GA_MEASUREMENT_ID?: string;
  }
}

// Configured via window.GA_MEASUREMENT_ID or import.meta.env
export const GA_MEASUREMENT_ID =
  (typeof window !== 'undefined' && window.GA_MEASUREMENT_ID) ||
  import.meta.env.VITE_GA_MEASUREMENT_ID ||
  '';

/**
 * Initialize GA4 if measurement ID is provided
 */
export function initGA() {
  if (typeof window === 'undefined') return;

  const id = window.GA_MEASUREMENT_ID || import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!id || id === 'G-XXXXXXXXXX') {
    // GA4 measurement ID is still placeholder. Gracefully no-op until user sets real ID.
    return;
  }

  if (!document.getElementById('ga-script')) {
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer?.push(args);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', id, {
      anonymize_ip: true,
      allow_google_signals: false,
      send_page_view: false // we track manually on route changes
    });
  }
}

/**
 * Track route view
 */
export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: `https://skpdf-mr7m.vercel.app${path}`
  });
}

/**
 * Track PDF Tool Usage (Strictly Anonymized)
 */
export function trackToolUsage(
  toolSlug: string,
  status: 'start' | 'success' | 'fail',
  metadata?: { pageCount?: number; durationMs?: number }
) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', `tool_${status}`, {
    tool_name: toolSlug,
    page_count: metadata?.pageCount || 1,
    processing_time_ms: metadata?.durationMs || 0
  });
}

/**
 * Track Download Action
 */
export function trackDownload(toolSlug: string, fileExtension: string) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'file_download', {
    tool_name: toolSlug,
    file_extension: fileExtension
  });
}
