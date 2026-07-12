import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Plus, Pencil, Trash2, ExternalLink, Eye, Code, Save, X, Maximize2, Minimize2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getPages, createPage, updatePage, deletePage, type CmsPage } from '@/lib/cms-pages';

const WRAP_TAGS: Record<string, { open: string; close: string; placeholder?: string }> = {
  bold: { open: '<strong>', close: '</strong>' },
  italic: { open: '<em>', close: '</em>' },
  underline: { open: '<u>', close: '</u>' },
  h1: { open: '<h1>', close: '</h1>', placeholder: 'Heading 1' },
  h2: { open: '<h2>', close: '</h2>', placeholder: 'Heading 2' },
  h3: { open: '<h3>', close: '</h3>', placeholder: 'Heading 3' },
  p: { open: '<p>', close: '</p>', placeholder: 'Paragraph text' },
  blockquote: { open: '<blockquote>', close: '</blockquote>', placeholder: 'Quote text' },
  li: { open: '<li>', close: '</li>', placeholder: 'List item' },
  code: { open: '<pre><code>', close: '</code></pre>', placeholder: 'Code here' },
};

function execTag(tag: string) {
  const ta = document.getElementById('page-content-editor') as HTMLTextAreaElement | null;
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const text = ta.value;
  const selected = text.substring(start, end);
  const def = WRAP_TAGS[tag];
  if (!def) return;
  const content = selected || def.placeholder || tag;
  const replacement = def.open + content + def.close;
  const newVal = text.substring(0, start) + replacement + text.substring(end);
  ta.value = newVal;
  ta.focus();
  const newCursor = start + replacement.length;
  ta.setSelectionRange(newCursor, newCursor);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertListItem(type: 'ul' | 'ol') {
  const ta = document.getElementById('page-content-editor') as HTMLTextAreaElement | null;
  if (!ta) return;
  const start = ta.selectionStart;
  const text = ta.value;
  const tag = type === 'ul' ? 'ul' : 'ol';
  const block = `<${tag}>\n  <li>List item</li>\n  <li>List item</li>\n</${tag}>`;
  const newVal = text.substring(0, start) + '\n' + block + '\n' + text.substring(ta.selectionEnd);
  ta.value = newVal;
  ta.focus();
  const newCursor = start + block.length + 2;
  ta.setSelectionRange(newCursor, newCursor);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertLink() {
  const url = prompt('Enter link URL:', 'https://');
  if (!url) return;
  const ta = document.getElementById('page-content-editor') as HTMLTextAreaElement | null;
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const text = ta.value;
  const selected = text.substring(start, end) || 'link text';
  const replacement = `<a href="${url}" target="_blank" rel="noopener noreferrer">${selected}</a>`;
  const newVal = text.substring(0, start) + replacement + text.substring(end);
  ta.value = newVal;
  ta.focus();
  ta.setSelectionRange(start + replacement.length, start + replacement.length);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertImage() {
  const url = prompt('Enter image URL:', 'https://');
  if (!url) return;
  const alt = prompt('Enter alt text:', 'Image') || 'Image';
  const ta = document.getElementById('page-content-editor') as HTMLTextAreaElement | null;
  if (!ta) return;
  const start = ta.selectionStart;
  const text = ta.value;
  const replacement = `<img src="${url}" alt="${alt}" class="max-w-full rounded-lg" />`;
  const newVal = text.substring(0, start) + replacement + text.substring(ta.selectionEnd);
  ta.value = newVal;
  ta.focus();
  ta.setSelectionRange(start + replacement.length, start + replacement.length);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertHr() {
  const ta = document.getElementById('page-content-editor') as HTMLTextAreaElement | null;
  if (!ta) return;
  const start = ta.selectionStart;
  const text = ta.value;
  const newVal = text.substring(0, start) + '\n<hr />\n' + text.substring(ta.selectionEnd);
  ta.value = newVal;
  ta.focus();
  ta.setSelectionRange(start + 7, start + 7);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

function ToolbarButton({ onClick, title, className, children }: { onClick: () => void; title: string; className?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title} className={`px-2 py-1 text-xs rounded hover:bg-muted border transition-colors ${className || ''}`}>
      {children}
    </button>
  );
}

const TOOLBAR_ITEMS = [
  { group: 'format', buttons: [
    { cmd: () => execTag('bold'), title: 'Bold', content: <span className="font-bold">B</span> },
    { cmd: () => execTag('italic'), title: 'Italic', content: <span className="italic">I</span> },
    { cmd: () => execTag('underline'), title: 'Underline', content: <span className="underline">U</span> },
  ]},
  { group: 'headings', buttons: [
    { cmd: () => execTag('h1'), title: 'Heading 1', content: 'H1' },
    { cmd: () => execTag('h2'), title: 'Heading 2', content: 'H2' },
    { cmd: () => execTag('h3'), title: 'Heading 3', content: 'H3' },
    { cmd: () => execTag('p'), title: 'Paragraph', content: '¶' },
  ]},
  { group: 'lists', buttons: [
    { cmd: () => insertListItem('ul'), title: 'Bullet list', content: '• List' },
    { cmd: () => insertListItem('ol'), title: 'Numbered list', content: '1. List' },
    { cmd: () => execTag('li'), title: 'List item', content: '— Item' },
  ]},
  { group: 'insert', buttons: [
    { cmd: insertLink, title: 'Insert link', content: '🔗 Link' },
    { cmd: insertImage, title: 'Insert image', content: '🖼 Img' },
    { cmd: () => execTag('blockquote'), title: 'Blockquote', content: '❝ Quote' },
    { cmd: () => execTag('code'), title: 'Code block', content: '&lt;/&gt;' },
    { cmd: insertHr, title: 'Horizontal rule', content: '― HR' },
  ]},
];

export default function PageEditor() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '', published: false });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => { loadPages(); }, []);

  async function loadPages() {
    setLoading(true);
    try {
      const data = await getPages();
      setPages(data);
    } catch { toast.error('Failed to load pages'); }
    finally { setLoading(false); }
  }

  function openNew() {
    setEditing(null);
    setForm({ title: '', slug: '', content: '', published: false });
    setPreview(false);
    setFullscreen(false);
  }

  function openEdit(page: CmsPage) {
    setEditing(page);
    setForm({ title: page.title, slug: page.slug, content: page.content, published: page.published });
    setPreview(false);
    setFullscreen(false);
  }

  function slugify(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
  }

  async function handleSave() {
    if (!form.title || !form.slug) {
      toast.error('Title and slug are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updatePage(editing.id, form);
        toast.success('Page updated');
      } else {
        await createPage(form);
        toast.success('Page created');
      }
      setEditing(null);
      await loadPages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this page? This cannot be undone.')) return;
    try {
      await deletePage(id);
      toast.success('Page deleted');
      await loadPages();
      if (editing?.id === id) { setEditing(null); }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>;
  }

  const editorContent = (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Content (HTML)</Label>
        <div className="flex gap-1">
          <ToolbarButton onClick={() => setFullscreen(!fullscreen)} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {fullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </ToolbarButton>
          <ToolbarButton onClick={() => setPreview(!preview)} title={preview ? 'Edit' : 'Preview'}>
            {preview ? <Code className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {preview ? ' Edit' : ' Preview'}
          </ToolbarButton>
        </div>
      </div>

      {!preview && (
        <div className="flex flex-wrap gap-1 p-2 border rounded-lg bg-muted/30 mb-1">
          {TOOLBAR_ITEMS.map((group, gi) => (
            <span key={group.group} className="contents">
              {gi > 0 && <span className="w-px bg-border mx-1 self-stretch" />}
              {group.buttons.map((btn) => (
                <ToolbarButton key={btn.title} onClick={btn.cmd} title={btn.title}>
                  {btn.content}
                </ToolbarButton>
              ))}
            </span>
          ))}
        </div>
      )}

      {preview ? (
        <div
          className="prose prose-sm dark:prose-invert max-w-none p-4 border rounded-lg bg-background min-h-[300px]"
          dangerouslySetInnerHTML={{ __html: form.content }}
        />
      ) : (
        <Textarea
          id="page-content-editor"
          value={form.content}
          onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
          placeholder="<h1>About Us</h1><p>Write your page content here using HTML...</p>"
          className={`font-mono text-xs ${fullscreen ? 'min-h-[60vh]' : 'min-h-[300px]'}`}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Custom Pages</h2>
          <p className="text-sm text-muted-foreground">Create and manage pages for about, privacy, terms, FAQ, and more</p>
        </div>
        <Button onClick={openNew} disabled={!!editing}>
          <Plus className="w-4 h-4 mr-1" /> New Page
        </Button>
      </div>

      {fullscreen ? (
        /* Fullscreen editor */
        <div className="fixed inset-0 z-50 bg-background p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{editing ? `Editing: ${editing.title}` : 'New Page'}</h3>
                <Badge variant={form.published ? 'default' : 'secondary'}>{form.published ? 'Published' : 'Draft'}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  {editing ? 'Update' : 'Create'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setFullscreen(false)}>
                  <Minimize2 className="w-4 h-4 mr-1" /> Exit Fullscreen
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, title: e.target.value }));
                    if (!editing) setForm((p) => ({ ...p, slug: slugify(e.target.value) }));
                  }}
                  placeholder="Page Title"
                  className="w-full px-3 py-2 text-lg font-semibold border rounded-lg bg-background"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <code className="bg-muted px-1 rounded">/page/{form.slug || 'slug'}</code>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                    placeholder="slug"
                    className="flex-1 px-2 py-1 text-xs font-mono border rounded bg-background max-w-[200px]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fs-published"
                  checked={form.published}
                  onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="fs-published" className="text-xs">Published</Label>
              </div>
            </div>
            {editorContent}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Page List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Pages</CardTitle>
            </CardHeader>
            <CardContent>
              {pages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No pages yet. Create your first page.</p>
              ) : (
                <div className="space-y-2">
                  {pages.map((page) => (
                    <div key={page.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{page.title}</span>
                          <Badge variant={page.published ? 'default' : 'secondary'} className="text-[10px]">
                            {page.published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">/{page.slug}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon-sm" onClick={() => window.open(`/page/${page.slug}`, '_blank')} title="View page">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(page)} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(page.id)} title="Delete" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {editing ? (
                  <>Editing: <span className="text-purple-600">{editing.title}</span></>
                ) : (
                  'New Page'
                )}
                {editing && (
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditing(null)} className="ml-auto">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, title: e.target.value }));
                    if (!editing) setForm((p) => ({ ...p, slug: slugify(e.target.value) }));
                  }}
                  placeholder="About Us"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                  placeholder="about-us"
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">Page URL: /page/{form.slug || 'slug'}</p>
              </div>

              {editorContent}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={form.published}
                  onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="published" className="text-xs">Published (visible to visitors)</Label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {editing ? 'Update Page' : 'Create Page'}
                </Button>
              </div>

              <details className="text-xs text-muted-foreground border rounded-lg p-3">
                <summary className="cursor-pointer font-medium">How to link this page</summary>
                <ol className="mt-2 space-y-1 list-decimal list-inside">
                  <li>Use the URL: <code className="bg-muted px-1 rounded">/page/{form.slug || 'your-slug'}</code></li>
                  <li>Add it to the footer via <strong>Settings → Footer</strong></li>
                  <li>Or add it to the navigation via <strong>Settings → Navigation Links</strong></li>
                </ol>
              </details>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
