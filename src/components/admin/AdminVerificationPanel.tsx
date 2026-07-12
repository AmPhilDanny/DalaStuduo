import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface OrgVerificationRecord {
  id: string;
  org_id: string;
  status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  business_name: string | null;
  registration_number: string | null;
  tax_id: string | null;
  document_urls: string[];
  notes: string | null;
  submitted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  organizations?: { name: string; slug: string } | null;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending', icon: Clock },
  verified: { color: 'bg-green-100 text-green-700', label: 'Verified', icon: CheckCircle2 },
  rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected', icon: XCircle },
  not_submitted: { color: 'bg-gray-100 text-gray-600', label: 'Not Submitted', icon: AlertTriangle },
};

export default function AdminVerificationPanel() {
  const [records, setRecords] = useState<OrgVerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadRecords(); }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('org_verifications')
        .select('*, organizations(name, slug)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(id: string, status: 'verified' | 'rejected') {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('org_verifications')
        .update({ status, notes: reviewNotes || null, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Verification ${status}`);
      setReviewingId(null);
      setReviewNotes('');
      await loadRecords();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>;
  }

  const grouped = {
    pending: records.filter(r => r.status === 'pending'),
    verified: records.filter(r => r.status === 'verified'),
    rejected: records.filter(r => r.status === 'rejected'),
    not_submitted: records.filter(r => r.status === 'not_submitted'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Business Verification</h2>
        <p className="text-sm text-muted-foreground">Review and manage organization verification requests</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(grouped).map(([key, list]) => {
          const cfg = STATUS_CONFIG[key];
          const Icon = cfg.icon;
          return (
            <Card key={key} className="border-l-4" style={{ borderLeftColor: key === 'pending' ? '#eab308' : key === 'verified' ? '#22c55e' : key === 'rejected' ? '#ef4444' : '#6b7280' }}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="w-6 h-6 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">{list.length}</p>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending verifications */}
      <Card>
        <CardHeader><CardTitle className="text-base">Pending Reviews</CardTitle></CardHeader>
        <CardContent>
          {grouped.pending.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No pending verification requests</p>
          ) : (
            <div className="space-y-3">
              {grouped.pending.map(rec => (
                <ReviewCard
                  key={rec.id}
                  record={rec}
                  reviewingId={reviewingId}
                  reviewNotes={reviewNotes}
                  actionLoading={actionLoading}
                  onStartReview={() => { setReviewingId(rec.id); setReviewNotes(''); }}
                  onCancelReview={() => setReviewingId(null)}
                  onNotesChange={setReviewNotes}
                  onReview={handleReview}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent history */}
      <Card>
        <CardHeader><CardTitle className="text-base">Review History</CardTitle></CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No records yet</p>
          ) : (
            <div className="space-y-2">
              {records.filter(r => r.status !== 'pending').slice(0, 10).map(rec => {
                const cfg = STATUS_CONFIG[rec.status];
                const Icon = cfg.icon;
                return (
                  <div key={rec.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <div>
                        <p className="text-sm font-medium">{rec.business_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {rec.organizations?.name || 'N/A'} · {new Date(rec.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={cfg.color}>{cfg.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewCard({
  record, reviewingId, reviewNotes, actionLoading,
  onStartReview, onCancelReview, onNotesChange, onReview,
}: {
  record: OrgVerificationRecord;
  reviewingId: string | null;
  reviewNotes: string;
  actionLoading: boolean;
  onStartReview: () => void;
  onCancelReview: () => void;
  onNotesChange: (v: string) => void;
  onReview: (id: string, status: 'verified' | 'rejected') => void;
}) {
  const isReviewing = reviewingId === record.id;
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-sm">{record.business_name || 'Unnamed Business'}</span>
            <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">Pending</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Org: {record.organizations?.name || record.org_id?.slice(0, 8)} · Reg: {record.registration_number || 'N/A'}
            {record.tax_id ? ` · TIN: ${record.tax_id}` : ''}
          </p>
          {record.document_urls?.length > 0 && (
            <div className="flex gap-2 mt-1">
              {record.document_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">
                  Document {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {isReviewing ? (
        <div className="space-y-3 pt-2 border-t">
          <div>
            <Label className="text-xs">Review Notes</Label>
            <Textarea value={reviewNotes} onChange={e => onNotesChange(e.target.value)} rows={2} placeholder="Optional notes..." />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancelReview} disabled={actionLoading}>Cancel</Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onReview(record.id, 'verified')} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onReview(record.id, 'rejected')} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              Reject
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={onStartReview}>Review</Button>
      )}
    </div>
  );
}
