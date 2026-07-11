import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Users, Briefcase, DollarSign, AlertTriangle, CheckCircle, TrendingUp, Search, Plus, Pencil, Trash2, Eye, Palette, Shield, Activity } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminStats, AdminUser, AdminService, ChatBubbleStyle } from '@/lib/marketplace';
import { DEFAULT_BUBBLE_STYLE } from '@/lib/marketplace';
import { getAdminStats, getAdminUsers, updateUserRole, getAdminServices, createAdminService, updateAdminService, deleteAdminService, getAdminSettings, updateAdminSetting, adminAiInsight } from '@/lib/marketplace';

type TabValue = 'overview' | 'users' | 'services' | 'settings';

interface StatsCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'green' | 'amber' | 'red' | 'blue';
}

const STAT_COLORS = {
  green: 'border-l-green-500',
  amber: 'border-l-amber-500',
  red: 'border-l-red-500',
  blue: 'border-l-blue-500',
};

const ROLE_OPTIONS = ['student', 'firm', 'admin'] as const;

export default function AdminDashboard() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // Overview
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userSummary, setUserSummary] = useState('');
  const [userSummaryLoading, setUserSummaryLoading] = useState(false);
  const pageSize = 15;

  // Services
  const [services, setServices] = useState<AdminService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceDialog, setServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', slug: '', description: '', category: '', base_price: 0 });
  const [serviceSaving, setServiceSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Settings
  const [bubbleStyle, setBubbleStyle] = useState<ChatBubbleStyle>(DEFAULT_BUBBLE_STYLE);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingBubble, setSavingBubble] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== 'admin') {
      navigate('/auth');
    }
  }, [user, profile, authLoading, navigate]);

  // Load stats + AI insight
  useEffect(() => {
    if (activeTab !== 'overview' || !user) return;
    setStatsLoading(true);
    getAdminStats()
      .then((s) => {
        setStats(s);
        setStatsLoading(false);
        // Load AI insight
        setAiLoading(true);
        adminAiInsight('admin_metric_insight', {
          totalUsers: String(s.total_users),
          totalOrders: String(s.total_orders),
          completedOrders: String(s.completed_orders),
          totalRevenue: String(s.total_revenue),
        })
          .then(setAiInsight)
          .catch(() => setAiInsight(''))
          .finally(() => setAiLoading(false));
      })
      .catch(() => {
        toast.error('Failed to load stats');
        setStatsLoading(false);
      });
  }, [activeTab, user]);

  // Load users
  useEffect(() => {
    if (activeTab !== 'users' || !user) return;
    setUsersLoading(true);
    getAdminUsers({ search: userSearch || undefined, role: userRoleFilter || undefined, limit: pageSize, offset: userPage * pageSize })
      .then((res) => {
        setUsers(res.data);
        setUsersCount(res.count);
        setUsersLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load users');
        setUsersLoading(false);
      });
  }, [activeTab, user, userSearch, userRoleFilter, userPage]);

  // Load services
  useEffect(() => {
    if (activeTab !== 'services' || !user) return;
    setServicesLoading(true);
    getAdminServices()
      .then(setServices)
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setServicesLoading(false));
  }, [activeTab, user]);

  // Load settings
  useEffect(() => {
    if (activeTab !== 'settings' || !user) return;
    setSettingsLoading(true);
    getAdminSettings()
      .then((settings) => {
        const s = settings?.chat_bubble_style as ChatBubbleStyle | undefined;
        if (s?.my_bubble_bg && s?.other_bubble_bg) setBubbleStyle(s);
        setSettingsLoading(false);
      })
      .catch(() => setSettingsLoading(false));
  }, [activeTab, user]);

  function getStatCards(s: AdminStats): StatsCard[] {
    return [
      { label: 'Total Users', value: s.total_users, icon: <Users className="w-5 h-5" />, color: s.total_users > 0 ? 'green' : 'blue' },
      { label: 'Total Orders', value: s.total_orders, icon: <Briefcase className="w-5 h-5" />, color: s.total_orders > 0 ? 'green' : 'blue' },
      { label: 'Completed Orders', value: s.completed_orders, icon: <CheckCircle className="w-5 h-5" />, color: s.completed_orders > 0 ? 'green' : 'blue' },
      { label: 'Total Revenue', value: `$${s.total_revenue.toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: s.total_revenue > 0 ? 'green' : 'blue' },
      { label: 'Pending Payouts', value: `$${s.pending_payouts.toLocaleString()}`, icon: <TrendingUp className="w-5 h-5" />, color: s.pending_payouts > 0 ? 'amber' : 'green' },
      { label: 'Open Disputes', value: s.open_disputes, icon: <AlertTriangle className="w-5 h-5" />, color: s.open_disputes > 0 ? 'red' : 'green' },
    ];
  }

  function handleUserRoleChange(userId: string, newRole: string) {
    updateUserRole(userId, newRole)
      .then(() => {
        toast.success('Role updated');
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole as AdminUser['role'] } : u)));
      })
      .catch(() => toast.error('Failed to update role'));
  }

  function viewUserSummary(u: AdminUser) {
    setSelectedUser(u);
    setUserSummaryLoading(true);
    setUserSummary('');
    adminAiInsight('admin_user_summary', {
      userName: u.full_name || 'Unknown',
      userRole: u.role,
      skills: '',
      context: 'Admin panel user detail view',
    })
      .then(setUserSummary)
      .catch(() => setUserSummary('Could not generate summary'))
      .finally(() => setUserSummaryLoading(false));
  }

  function openServiceDialog(svc?: AdminService) {
    if (svc) {
      setEditingService(svc);
      setServiceForm({ name: svc.name, slug: svc.slug, description: svc.description || '', category: svc.category, base_price: Number(svc.base_price) });
    } else {
      setEditingService(null);
      setServiceForm({ name: '', slug: '', description: '', category: '', base_price: 0 });
    }
    setServiceDialog(true);
  }

  function handleServiceSave() {
    if (!serviceForm.name || !serviceForm.slug || !serviceForm.category) {
      toast.error('Name, slug, and category are required');
      return;
    }
    setServiceSaving(true);
    const body = { ...serviceForm };
    const action = editingService
      ? updateAdminService(editingService.id, body)
      : createAdminService(body);

    action
      .then(() => {
        toast.success(editingService ? 'Service updated' : 'Service created');
        setServiceDialog(false);
        return getAdminServices();
      })
      .then(setServices)
      .catch(() => toast.error('Failed to save service'))
      .finally(() => setServiceSaving(false));
  }

  function handleDeleteService(id: string) {
    deleteAdminService(id)
      .then(() => {
        toast.success('Service deleted');
        setDeleteConfirm(null);
        return getAdminServices();
      })
      .then(setServices)
      .catch(() => toast.error('Failed to delete service'));
  }

  function handleSaveBubbleColors() {
    setSavingBubble(true);
    updateAdminSetting('chat_bubble_style', bubbleStyle)
      .then(() => toast.success('Bubble colors saved'))
      .catch(() => toast.error('Failed to save colors'))
      .finally(() => setSavingBubble(false));
  }

  async function handleGenerateDescription() {
    if (!serviceForm.name) {
      toast.error('Enter a service name first');
      return;
    }
    try {
      const desc = await adminAiInsight('admin_service_description', {
        serviceName: serviceForm.name,
        serviceCategory: serviceForm.category || 'General',
        currentDescription: serviceForm.description,
      });
      setServiceForm((prev) => ({ ...prev, description: desc }));
    } catch {
      toast.error('Failed to generate description');
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-secondary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Platform management & settings</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Services
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Palette className="w-4 h-4" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* ═══ OVERVIEW TAB ═══ */}
          <TabsContent value="overview">
            {statsLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {getStatCards(stats).map((card) => (
                    <Card key={card.label} className={`border-l-4 ${STAT_COLORS[card.color]} shadow-sm`}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                        <span className="text-muted-foreground">{card.icon}</span>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{card.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* AI Insights */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="w-5 h-5 text-blue-500" /> AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" /> Analyzing metrics...
                      </div>
                    ) : aiInsight ? (
                      <p className="text-sm text-muted-foreground">{aiInsight}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">AI insights unavailable. Configure an AI provider in Settings.</p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-center py-24 text-muted-foreground">Failed to load stats.</p>
            )}
          </TabsContent>

          {/* ═══ USERS TAB ═══ */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <CardTitle className="text-lg">Users ({usersCount})</CardTitle>
                  <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name..."
                        className="pl-9"
                        value={userSearch}
                        onChange={(e) => { setUserSearch(e.target.value); setUserPage(0); }}
                      />
                    </div>
                    <Select value={userRoleFilter} onValueChange={(v) => { setUserRoleFilter(v); setUserPage(0); }}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All roles</SelectItem>
                        {ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">No users found</TableCell></TableRow>
                        ) : (
                          users.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={u.avatar_url || undefined} />
                                    <AvatarFallback>{(u.full_name || '?').charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{u.full_name || 'Unnamed'}</p>
                                    {u.company_name && <p className="text-xs text-muted-foreground">{u.company_name}</p>}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select value={u.role} onValueChange={(v) => handleUserRoleChange(u.id, v)}>
                                  <SelectTrigger className="w-[120px] h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon-sm" onClick={() => viewUserSummary(u)} title="View profile summary">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {usersCount > pageSize && (
                      <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-muted-foreground">
                          Showing {userPage * pageSize + 1}–{Math.min((userPage + 1) * pageSize, usersCount)} of {usersCount}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" disabled={userPage === 0} onClick={() => setUserPage((p) => p - 1)}>Previous</Button>
                          <Button variant="outline" size="sm" disabled={(userPage + 1) * pageSize >= usersCount} onClick={() => setUserPage((p) => p + 1)}>Next</Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* User Summary Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(o) => { if (!o) setSelectedUser(null); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={selectedUser?.avatar_url || undefined} />
                      <AvatarFallback>{(selectedUser?.full_name || '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                    {selectedUser?.full_name || 'User Profile'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Role:</span> <Badge variant="secondary">{selectedUser?.role}</Badge></div>
                    <div><span className="text-muted-foreground">Joined:</span> {selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '-'}</div>
                    {selectedUser?.company_name && <div className="col-span-2"><span className="text-muted-foreground">Company:</span> {selectedUser.company_name}</div>}
                    {selectedUser?.bio && <div className="col-span-2"><span className="text-muted-foreground">Bio:</span> {selectedUser.bio}</div>}
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">AI Summary</p>
                    {userSummaryLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Generating...</div>
                    ) : (
                      <p className="text-sm">{userSummary || 'No summary available.'}</p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ═══ SERVICES TAB ═══ */}
          <TabsContent value="services">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Services</CardTitle>
                  <Button size="sm" onClick={() => openServiceDialog()}>
                    <Plus className="w-4 h-4 mr-1" /> Add Service
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Base Price</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No services yet</TableCell></TableRow>
                      ) : (
                        services.map((svc) => (
                          <TableRow key={svc.id}>
                            <TableCell className="font-medium">{svc.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{svc.slug}</TableCell>
                            <TableCell><Badge variant="outline">{svc.category}</Badge></TableCell>
                            <TableCell className="text-right">${Number(svc.base_price).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={svc.is_active ? 'default' : 'secondary'}>{svc.is_active ? 'Active' : 'Inactive'}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon-sm" onClick={() => openServiceDialog(svc)} title="Edit">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteConfirm(svc.id)} title="Delete">
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Add/Edit Service Dialog */}
            <Dialog open={serviceDialog} onOpenChange={setServiceDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input value={serviceForm.name} onChange={(e) => setServiceForm((p) => ({ ...p, name: e.target.value }))} placeholder="Web Development" />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug *</Label>
                      <Input value={serviceForm.slug} onChange={(e) => setServiceForm((p) => ({ ...p, slug: e.target.value }))} placeholder="web-development" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Input value={serviceForm.category} onChange={(e) => setServiceForm((p) => ({ ...p, category: e.target.value }))} placeholder="Development" />
                    </div>
                    <div className="space-y-2">
                      <Label>Base Price</Label>
                      <Input type="number" value={serviceForm.base_price} onChange={(e) => setServiceForm((p) => ({ ...p, base_price: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Description</Label>
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleGenerateDescription}>
                        ✨ AI Generate
                      </Button>
                    </div>
                    <Textarea value={serviceForm.description} onChange={(e) => setServiceForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Service description..." />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setServiceDialog(false)}>Cancel</Button>
                    <Button onClick={handleServiceSave} disabled={serviceSaving}>
                      {serviceSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      {editingService ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
              <DialogContent>
                <DialogHeader><DialogTitle>Delete Service?</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">This action cannot be undone. All listings using this service will remain but the service will be removed.</p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => deleteConfirm && handleDeleteService(deleteConfirm)}>Delete</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ═══ SETTINGS TAB ═══ */}
          <TabsContent value="settings">
            {settingsLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chat Bubble Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Palette className="w-5 h-5 text-secondary" /> Chat Bubble Colors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Preview */}
                    <div className="space-y-3 mb-4 p-4 bg-muted/30 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground">Preview</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-end">
                          <div className="max-w-[70%] px-3 py-2 rounded-2xl rounded-br-md text-sm" style={{ backgroundColor: bubbleStyle.my_bubble_bg, color: bubbleStyle.my_bubble_text }}>
                            My message looks like this
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="max-w-[70%] px-3 py-2 rounded-2xl rounded-bl-md text-sm" style={{ backgroundColor: bubbleStyle.other_bubble_bg, color: bubbleStyle.other_bubble_text }}>
                            Their message looks like this
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>My Bubble Background</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={bubbleStyle.my_bubble_bg} onChange={(e) => setBubbleStyle((p) => ({ ...p, my_bubble_bg: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border" />
                          <Input value={bubbleStyle.my_bubble_bg} onChange={(e) => setBubbleStyle((p) => ({ ...p, my_bubble_bg: e.target.value }))} className="font-mono text-xs flex-1" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>My Bubble Text</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={bubbleStyle.my_bubble_text} onChange={(e) => setBubbleStyle((p) => ({ ...p, my_bubble_text: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border" />
                          <Input value={bubbleStyle.my_bubble_text} onChange={(e) => setBubbleStyle((p) => ({ ...p, my_bubble_text: e.target.value }))} className="font-mono text-xs flex-1" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Other Bubble Background</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={bubbleStyle.other_bubble_bg} onChange={(e) => setBubbleStyle((p) => ({ ...p, other_bubble_bg: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border" />
                          <Input value={bubbleStyle.other_bubble_bg} onChange={(e) => setBubbleStyle((p) => ({ ...p, other_bubble_bg: e.target.value }))} className="font-mono text-xs flex-1" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Other Bubble Text</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={bubbleStyle.other_bubble_text} onChange={(e) => setBubbleStyle((p) => ({ ...p, other_bubble_text: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border" />
                          <Input value={bubbleStyle.other_bubble_text} onChange={(e) => setBubbleStyle((p) => ({ ...p, other_bubble_text: e.target.value }))} className="font-mono text-xs flex-1" />
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleSaveBubbleColors} disabled={savingBubble} className="w-full">
                      {savingBubble ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Bubble Colors
                    </Button>
                  </CardContent>
                </Card>

                {/* AI Provider Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="w-5 h-5 text-secondary" /> AI Provider
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      AI features are powered by the configured provider in the <code className="text-xs bg-muted px-1 py-0.5 rounded">ai-assist</code> edge function.
                      API keys are set via Supabase secrets or the <code className="text-xs bg-muted px-1 py-0.5 rounded">site_settings</code> table.
                    </p>
                    <div className="text-sm">
                      <p><span className="text-muted-foreground">Provider:</span> <Badge variant="secondary">OpenRouter (default)</Badge></p>
                      <p className="mt-1"><span className="text-muted-foreground">Model:</span> <Badge variant="outline">google/gemini-2.0-flash-001</Badge></p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      To change the AI provider, set <code className="text-xs bg-muted px-1">AI_PROVIDER</code> and the corresponding API key via Supabase secrets.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
