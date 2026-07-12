import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommit: (message: string, description?: string) => Promise<void>;
  fileName: string;
}

export default function CommitDialog({ open, onOpenChange, onCommit, fileName }: Props) {
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCommit = async () => {
    if (!message.trim()) {
      setError('Commit message is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onCommit(message.trim(), description.trim() || undefined);
      setMessage('');
      setDescription('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Commit Changes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-sm text-gray-500">
            Committing <span className="font-mono font-medium text-gray-700">{fileName}</span> to GitHub
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Commit message *</label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Update file..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about this change"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCommit} disabled={isSaving || !message.trim()}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Commit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
