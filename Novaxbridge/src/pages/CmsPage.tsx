import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ArrowLeft, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

interface PageData {
  slug: string;
  title: string;
  content_html: string;
  created_at: string;
  updated_at: string;
}

export default function CmsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('No page slug specified');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPage() {
      try {
        const res = await fetch(`${API_BASE}/pages/${encodeURIComponent(slug!)}`);
        if (res.status === 404) {
          if (!cancelled) setError('Page not found');
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled && json?.data) {
          setPage(json.data);
        }
      } catch {
        if (!cancelled) setError('Failed to load page');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPage();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground">The page you're looking for doesn't exist or hasn't been published yet.</p>
        <Link to="/" className="text-secondary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const sanitizedHtml = DOMPurify.sanitize(page.content_html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'h2', 'h3', 'h4',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code',
      'span', 'div', 'hr', 'sub', 'sup',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style', 'width', 'height'],
  });

  return (
    <div className="min-h-[60vh] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-sm text-secondary hover:underline inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <article>
          <h1 className="text-3xl md:text-4xl font-bold mb-8">{page.title}</h1>
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </article>
      </div>
    </div>
  );
}
