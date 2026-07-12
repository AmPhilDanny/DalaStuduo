import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, UserPlus, X, Mail, Clock, Search, UserCheck, Video, ShieldAlert } from 'lucide-react';
import { useOrgMembers } from '../../hooks/useOrgMembers';
import {
  changeMemberRole, getOrgInvites, cancelInvite, inviteMember,
  searchTalent, type TalentProfile,
} from '../../lib/api';
import type { OrgMember, OrgInvite, OrgMemberRole } from '../../b2b-types';
import { toast } from 'sonner';
import { useOrg } from '../../hooks/useOrg';
import { ORG_ROLE_LABELS } from '../../lib/constants';
import CustomVideoCall from '@/components/messaging/CustomVideoCall';

export default function TeamList() {
  const { org, role: myRole } = useOrg();
  const { members, isLoading, refresh, remove, isRemoving } = useOrgMembers();
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
  const [roleChangeLoading, setRoleChangeLoading] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  // Talent pool search
  const [talentQuery, setTalentQuery] = useState('');
  const [talentResults, setTalentResults] = useState<TalentProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<TalentProfile | null>(null);

  // Video call
  const [callTarget, setCallTarget] = useState<OrgMember | null>(null);

  const canManage = myRole === 'owner' || myRole === 'admin';

  const fetchInvites = useCallback(async () => {
    if (!canManage) return;
    try {
      setIsLoadingInvites(true);
      const result = await getOrgInvites();
      setInvites(result.data.filter(i => i.status === 'pending'));
    } catch {
      // ignore
    } finally {
      setIsLoadingInvites(false);
    }
  }, [canManage]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const handleInvite = async (email?: string) => {
    const target = email || inviteEmail.trim();
    if (!target) return;
    setIsInviting(true);
    try {
      await inviteMember({ email: target, role: inviteRole as Exclude<OrgMemberRole, 'owner'> });
      toast.success('Invitation sent');
      setInviteEmail('');
      setSelectedTalent(null);
      setInviteDialogOpen(false);
      fetchInvites();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const handleInviteTalent = async () => {
    if (!selectedTalent) return;
    const email = selectedTalent.full_name
      ? `${selectedTalent.id}@talent.skillbridge`
      : `${selectedTalent.id}@talent.skillbridge`;
    // Use the talent's actual email if available, otherwise the invite will be handled via notification
    await handleInvite(email);
  };

  const searchTalents = async () => {
    if (!talentQuery.trim()) return;
    setSearching(true);
    try {
      const result = await searchTalent({ q: talentQuery, limit: 20 });
      setTalentResults(result.data);
    } catch {
      toast.error('Failed to search talent');
    } finally {
      setSearching(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setRoleChangeLoading(memberId);
    try {
      await changeMemberRole(memberId, newRole);
      refresh();
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    } finally {
      setRoleChangeLoading(null);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await remove(removeTarget.id);
      toast.success('Member removed');
      setRemoveTarget(null);
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvite(inviteId);
      setInvites(prev => prev.filter(i => i.id !== inviteId));
      toast.success('Invite cancelled');
    } catch {
      toast.error('Failed to cancel invite');
    }
  };

  const pendingInvites = invites.filter(i => i.status === 'pending');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''} in your organization</p>
        </div>
        {canManage && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="w-4 h-4 mr-2" /> Invite Member</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Invite to Organization</DialogTitle></DialogHeader>
              <Tabs defaultValue="email">
                <TabsList className="w-full">
                  <TabsTrigger value="email" className="flex-1"><Mail className="w-3 h-3 mr-1" /> By Email</TabsTrigger>
                  <TabsTrigger value="talent" className="flex-1"><Search className="w-3 h-3 mr-1" /> From Talent Pool</TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-3 pt-3">
                  <Input
                    placeholder="Email address"
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handleInvite()} disabled={!inviteEmail.trim() || isInviting} className="w-full">
                    {isInviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Send Invitation
                  </Button>
                </TabsContent>

                <TabsContent value="talent" className="space-y-3 pt-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Search talent by name or skill..."
                        value={talentQuery}
                        onChange={e => setTalentQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') searchTalents(); }}
                      />
                    </div>
                    <Button variant="outline" onClick={searchTalents} disabled={searching}>
                      {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>

                  {talentResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-1">
                      {talentResults.map(t => (
                        <div
                          key={t.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            selectedTalent?.id === t.id ? 'bg-purple-50 border border-purple-200' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedTalent(selectedTalent?.id === t.id ? null : t)}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={t.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{(t.full_name || '?').charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{t.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground truncate">{t.headline || t.skills?.slice(0, 3).join(', ')}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{t.availability?.replace(/_/g, ' ') || 'N/A'}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTalent && (
                    <div className="p-2 rounded bg-purple-50 border border-purple-200 text-sm">
                      Inviting: <strong>{selectedTalent.full_name}</strong>
                    </div>
                  )}

                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInviteTalent} disabled={!selectedTalent || isInviting} className="w-full">
                    {isInviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
                    Invite {selectedTalent?.full_name || 'Selected'}
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Members table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No team members yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={member.user?.avatar_url || undefined} />
                      <AvatarFallback className="text-sm bg-purple-100 text-purple-600">
                        {member.user?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.user?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-400">{member.user?.email || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Video call */}
                    <Button variant="ghost" size="icon-sm" onClick={() => setCallTarget(member)} title="Video call">
                      <Video className="w-4 h-4 text-purple-500" />
                    </Button>
                    {/* Role selector */}
                    {canManage && member.role !== 'owner' ? (
                      <Select
                        value={member.role}
                        onValueChange={(v) => handleRoleChange(member.id, v)}
                        disabled={roleChangeLoading === member.id}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {ORG_ROLE_LABELS[member.role] || member.role}
                      </Badge>
                    )}
                    {/* Remove */}
                    {canManage && member.role !== 'owner' && (
                      <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(member)}>
                        <X className="w-3 h-3 text-gray-400" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invites */}
      {canManage && pendingInvites.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pendingInvites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-300" />
                    <div>
                      <p className="text-sm text-gray-700">{invite.email}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">{ORG_ROLE_LABELS[invite.role]}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleCancelInvite(invite.id)}>
                      <X className="w-3 h-3 text-gray-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation dialogs */}
      <AlertDialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.user?.full_name || 'This member'} will lose access to the organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700" disabled={isRemoving}>
              {isRemoving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Video call dialog */}
      {callTarget && (
        <CustomVideoCall
          open={!!callTarget}
          onOpenChange={() => setCallTarget(null)}
          roomName={`team-${org?.slug || 'org'}-${callTarget.user_id}`}
          userName={callTarget.user?.full_name || 'Team Member'}
        />
      )}
    </div>
  );
}
