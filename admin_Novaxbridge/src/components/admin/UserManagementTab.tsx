import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search, Plus, Trash2, ShieldAlert, Save, X, MapPin, Building2, Globe, Tag, Calendar, Clock, User, Briefcase, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/export';
import { adminApi, patch, get, post, type AdminRole } from '@/lib/api-client';
import RoleManager from './RoleManager';

interface AdminProfile {
  id: string;
  full_name: string | null;
  email?: string | null;
  role: string;
  headline: string | null;
  avatar_url: string | null;
  created_at: string;
  is_active?: boolean;
}

interface FullProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  role: string;
  location: string | null;
  skills: string[];
  company_name: string | null;
  github_url: string | null;
  availability: string;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
}

export default function UserManagementTab() {
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  // Add user dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [newHeadline, setNewHeadline] = useState('');
  const [adding, setAdding] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Confirm email
  const [confirmingEmail, setConfirmingEmail] = useState(false);
  const [resendingConfirm, setResendingConfirm] = useState(false);
  const [emailAddress, setEmailAddress] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  // Profile detail dialog
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  // Editable fields
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editAvailability, setEditAvailability] = useState('');
  const [editCurrency, setEditCurrency] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => { fetchUsers(); fetchRoles(); }, []);

  useEffect(() => {
    if (!profileUserId) { setProfile(null); setEmailAddress(null); setEmailConfirmed(false); setEditEmail(''); return; }
    fetchProfile(profileUserId);
    fetchEmailStatus(profileUserId);
  }, [profileUserId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, headline, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally { setLoading(false); }
  };

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await adminApi.roles();
      setRoles(res.data || []);
    } catch (err) {
      console.warn('Failed to load roles:', err);
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      if (data) {
        const p = data as FullProfile;
        setProfile(p);
        setEditName(p.full_name || '');
        setEditRole(p.role);
        setEditHeadline(p.headline || '');
        setEditBio(p.bio || '');
        setEditLocation(p.location || '');
        setEditSkills(p.skills?.join(', ') || '');
        setEditCompany(p.company_name || '');
        setEditGithub(p.github_url || '');
        setEditAvailability(p.availability || 'available');
        setEditCurrency(p.preferred_currency || 'NGN');
        setEditAvatarUrl(p.avatar_url || '');
      }
    } catch (err) {
      toast.error('Failed to load profile');
      setProfileUserId(null);
    } finally { setProfileLoading(false); }
  };

  const fetchEmailStatus = async (userId: string) => {
    try {
      const res = await get<{ id: string; email: string | null; email_confirmed_at: string | null }>(`/admin/users/${userId}/email-status`);
      setEmailAddress(res.data.email);
      setEditEmail(res.data.email || '');
      setEmailConfirmed(!!res.data.email_confirmed_at);
    } catch (err) {
      setEmailAddress(null);
      setEditEmail('');
      setEmailConfirmed(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileUserId) return;
    setProfileSaving(true);
    try {
      const skillsArray = editSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await adminApi.updateUserProfile(profileUserId, {
        full_name: editName || null,
        role: editRole,
        headline: editHeadline || null,
        bio: editBio || null,
        location: editLocation || null,
        skills: skillsArray,
        company_name: editCompany || null,
        github_url: editGithub || null,
        availability: editAvailability,
        preferred_currency: editCurrency,
        avatar_url: editAvatarUrl || null,
      });

      toast.success('Profile updated');
      setProfileUserId(null);
      setProfile(null);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally { setProfileSaving(false); }
  };

  const handleSaveEmail = async () => {
    if (!profileUserId || !editEmail) return;
    setSavingEmail(true);
    try {
      const res = await patch<{ id: string; email: string; email_confirmed_at: string | null }>(`/admin/users/${profileUserId}/email`, { email: editEmail });
      setEmailAddress(res.data.email);
      setEmailConfirmed(!!res.data.email_confirmed_at);
      toast.success('Email updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update email');
    } finally { setSavingEmail(false); }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally { setChangingRole(null); }
  };

  const handleAddUser = async () => {
    if (!newEmail || !newPassword || !newName) {
      toast.error('Email, password, and name are required');
      return;
    }
    setAdding(true);
    try {
      // Sign up the user
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: newEmail.trim(),
        password: newPassword,
        options: { data: { full_name: newName.trim(), role: newRole } },
      });
      if (signUpErr) throw signUpErr;
      if (!signUpData.user) throw new Error('Failed to create user');

      // Update the profile with role and headline
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ role: newRole, headline: newHeadline.trim() || null })
        .eq('id', signUpData.user.id);
      if (updateErr) throw updateErr;

      toast.success(`User ${newName} created`);
      setAddOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewRole('student');
      setNewHeadline('');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally { setAdding(false); }
  };

  const handleDeleteUser = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await patch(`/admin/users/${deletingId}/deactivate`);
      toast.success('User deactivated');
      setDeletingId(null);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate user');
    } finally { setDeleting(false); }
  };

  const exportCSV = () => {
    const data = filteredUsers.map((u) => ({
      Name: u.full_name || '',
      Role: u.role,
      Headline: u.headline || '',
      Joined: new Date(u.created_at).toLocaleDateString(),
    }));
    downloadCSV(data, 'users');
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.headline?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <RoleManager onRolesChange={fetchRoles} />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Users ({users.length})</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 w-60"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Headline</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setProfileUserId(u.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback>{(u.full_name || '?').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{u.full_name || 'Unnamed'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {u.headline || '—'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={u.role}
                      onValueChange={(v) => handleRoleChange(u.id, v)}
                      disabled={changingRole === u.id}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
{roles.map((r) => (
  <SelectItem key={r.name} value={r.name}>{r.name.replace('_', ' ')}</SelectItem>
))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={(e) => { e.stopPropagation(); setDeletingId(u.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.name} value={r.name}>{r.name.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Headline</Label>
              <Input value={newHeadline} onChange={(e) => setNewHeadline(e.target.value)} placeholder="Full-stack Developer" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={adding}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              Confirm Deactivation
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will deactivate the user account. Their profile will be hidden. This action can be reversed by an admin.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Deactivate User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Detail Dialog */}
      <Dialog open={!!profileUserId} onOpenChange={(o) => { if (!o) { setProfileUserId(null); setProfile(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-secondary" />
              User Profile
            </DialogTitle>
          </DialogHeader>

          {profileLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-secondary" />
            </div>
          ) : profile ? (
            <div className="space-y-6 py-2">
              {/* Avatar + Name Header */}
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0">
                  <Avatar className="w-20 h-20 border-2 border-border shadow-sm">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
                      {(profile.full_name || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-1.5">
                    <Label>Avatar URL</Label>
                    <Input
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="User name" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Role & Availability */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Role</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.name} value={r.name}>{r.name.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Availability</Label>
                  <Select value={editAvailability} onValueChange={setEditAvailability}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="looking">Looking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Headline & Bio */}
              <div className="space-y-1.5">
                <Label>Headline</Label>
                <Input value={editHeadline} onChange={(e) => setEditHeadline(e.target.value)} placeholder="e.g. Full-stack Developer" />
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="User biography..." rows={3} />
              </div>

              <Separator />

              {/* Location, Company, Currency */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</Label>
                  <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Company</Label>
                  <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} placeholder="Company name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Currency</Label>
                  <Select value={editCurrency} onValueChange={setEditCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                      <SelectItem value="GHS">GHS (₵)</SelectItem>
                      <SelectItem value="KES">KES (KSh)</SelectItem>
                      <SelectItem value="ZAR">ZAR (R)</SelectItem>
                      <SelectItem value="UGX">UGX (USh)</SelectItem>
                      <SelectItem value="TZS">TZS (TSh)</SelectItem>
                      <SelectItem value="RWF">RWF (FRw)</SelectItem>
                      <SelectItem value="XOF">XOF (CFA)</SelectItem>
                      <SelectItem value="XAF">XAF (FCFA)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Skills & GitHub */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Skills (comma-separated)</Label>
                  <Input value={editSkills} onChange={(e) => setEditSkills(e.target.value)} placeholder="React, Node.js, Python" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> GitHub URL</Label>
                  <Input value={editGithub} onChange={(e) => setEditGithub(e.target.value)} placeholder="https://github.com/username" className="font-mono text-xs" />
                </div>
              </div>

              <Separator />

              {/* Read-only metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined: <span className="font-medium text-foreground">{new Date(profile.created_at).toLocaleDateString()}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last updated: <span className="font-medium text-foreground">{new Date(profile.updated_at).toLocaleDateString()}</span></span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <div className="flex-1 space-y-1.5">
                    <Label className="flex items-center gap-1.5">Email</Label>
                    <div className="flex gap-2">
                      <Input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="font-mono text-xs flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSaveEmail}
                        disabled={savingEmail || !editEmail || editEmail === emailAddress}
                      >
                        {savingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                  <Badge variant={emailConfirmed ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 mt-5">
                    {emailConfirmed ? 'Confirmed' : 'Unconfirmed'}
                  </Badge>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => { setProfileUserId(null); setProfile(null); }}>
                  <X className="w-4 h-4 mr-1.5" />
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (!profileUserId) return;
                    setConfirmingEmail(true);
                    try {
                      const result = await patch<{ id: string; email: string; email_confirmed_at: string }>(`/admin/users/${profileUserId}/confirm-email`);
                      if (result.data.email_confirmed_at) {
                        setEmailConfirmed(true);
                      }
                      toast.success('Email confirmed');
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Failed to confirm email');
                    } finally {
                      setConfirmingEmail(false);
                    }
                  }}
                  disabled={confirmingEmail}
                  className="gap-1.5"
                >
                  {confirmingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {emailConfirmed ? 'Confirmed' : 'Confirm Email'}
                </Button>
                {emailAddress && !emailConfirmed && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!profileUserId) return;
                      setResendingConfirm(true);
                      try {
                        await post(`/admin/users/${profileUserId}/resend-confirmation`);
                        toast.success('Confirmation email sent');
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Failed to resend confirmation');
                      } finally {
                        setResendingConfirm(false);
                      }
                    }}
                    disabled={resendingConfirm}
                  >
                    {resendingConfirm ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Resend Confirmation
                  </Button>
                )}
                <Button onClick={handleSaveProfile} disabled={profileSaving}>
                  {profileSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
