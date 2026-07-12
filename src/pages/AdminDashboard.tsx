import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
import {
  Loader2, Users, Briefcase, DollarSign, AlertTriangle, CheckCircle, TrendingUp,
  Search, Plus, Pencil, Trash2, Eye, Palette, Shield, Activity, LayoutDashboard,
  Settings, ChevronLeft, ChevronRight, SlidersHorizontal, FileText, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminStats, AdminUser, AdminService } from '@/lib/marketplace';
import { getAdminStats, getAdminUsers, updateUserRole, getAdminServices, createAdminService, updateAdminService, deleteAdminService, adminAiInsight, updateUserProfile, getAdminUser } from '@/lib/marketplace';
import AdminConfig from '@/components/admin/AdminConfig';
import SiteSettingsEditor from '@/components/admin/SiteSettingsEditor';
import PageEditor from '@/components/admin/PageEditor';
import SubscriptionPlansEditor from '@/components/admin/SubscriptionPlansEditor';
import AdminVerificationPanel from '@/components/admin/AdminVerificationPanel';

type TabValue = 'overview' | 'users' | 'services' | 'pages' | 'plans' | 'verification' | 'settings' | 'config';

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

const NAV_ITEMS: { value: TabValue; label: string; icon: React.ReactNode }[] = [
  { value: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { value: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { value: 'services', label: 'Services', icon: <Briefcase className="w-4 h-4" /> },
  { value: 'pages', label: 'Pages', icon: <FileText className="w-4 h-4" /> },
  { value: 'plans', label: 'Plans', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'verification', label: 'Verification', icon: <Shield className="w-4 h-4" /> },
  { value: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  { value: 'config', label: 'Configuration', icon: <SlidersHorizontal className="w-4 h-4" /> },
];

export default function AdminDashboard() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userPage, setUserPage] = useState(0);
  const [profileUser, setProfileUser] = useState<AdminUser | null>(null);
  const [profileDialog, setProfileDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', company_name: '', bio: '', avatar_url: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const pageSize = 15;

  // Services
  const [services, setServices] = useState<AdminService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceDialog, setServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', slug: '', description: '', category: '', base_price: 0 });
  const [serviceSaving, setServiceSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== 'admin') {
      navigate('/auth?redirectTo=/admin');
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
    getAdminUsers({ search: userSearch || undefined, role: userRoleFilter && userRoleFilter !== 'all' ? userRoleFilter : undefined, limit: pageSize, offset: userPage * pageSize })
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

  function openUserProfile(u: AdminUser) {
    setProfileLoading(true);
    setProfileDialog(true);
    getAdminUser(u.id)
      .then((full) => {
        setProfileUser(full);
        setProfileForm({
          full_name: full.full_name || '',
          company_name: full.company_name || '',
          bio: full.bio || '',
          avatar_url: full.avatar_url || '',
        });
        setProfileLoading(false);
      })
      .catch(() => {
        // Fallback to table data if API fails
        setProfileUser(u);
        setProfileForm({
          full_name: u.full_name || '',
          company_name: u.company_name || '',
          bio: u.bio || '',
          avatar_url: u.avatar_url || '',
        });
        setProfileLoading(false);
      });
  }

  async function handleProfileSave() {
    if (!profileUser) return;
    setProfileSaving(true);
    try {
      const updated = await updateUserProfile(profileUser.id, profileForm);
      toast.success('Profile updated');
      setProfileUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      setProfileDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
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
    <div className="min-h-screen flex pt-16">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-900 text-white flex flex-col transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-56' : 'w-14'
        }`}
      >
        <div className="flex items-center justify-between px-3 py-4 border-b border-gray-700/50">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-semibold">Admin Panel</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.value
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-700/50">
          {sidebarOpen && (
            <p className="text-[10px] text-gray-500 text-center">
              SkillBridge Admin
            </p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-14'}`}>
        <div className="px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Platform management & settings</p>
            </div>
          </div>

          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === 'overview' && (
            <>
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
            </>
          )}

          {/* ═══ USERS TAB ═══ */}
          {activeTab === 'users' && (
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
                        <SelectItem value="all">All roles</SelectItem>
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
                                <Button variant="ghost" size="icon-sm" onClick={() => openUserProfile(u)} title="View / edit profile">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

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
          )}

          {/* ═══ SERVICES TAB ═══ */}
          {activeTab === 'services' && (
            <>
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
                          AI Generate
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
            </>
          )}

          {/* ═══ PAGES TAB ═══ */}
          {activeTab === 'pages' && (
            <PageEditor />
          )}

          {/* ═══ PLANS TAB ═══ */}
          {activeTab === 'plans' && (
            <SubscriptionPlansEditor />
          )}

          {/* ═══ VERIFICATION TAB ═══ */}
          {activeTab === 'verification' && (
            <AdminVerificationPanel />
          )}

          {/* ═══ CONFIGURATION TAB ═══ */}
          {activeTab === 'config' && (
            <AdminConfig />
          )}

          {/* ═══ SETTINGS TAB ═══ */}
          {activeTab === 'settings' && (
            <SiteSettingsEditor />
          )}

          {/* ═══ USER PROFILE DIALOG ═══ */}
          <Dialog open={profileDialog} onOpenChange={(o) => { if (!o) setProfileDialog(false); }}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {profileUser && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profileUser.avatar_url || undefined} />
                      <AvatarFallback>{(profileUser.full_name || '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <span>{profileUser?.full_name || 'User Profile'}</span>
                  {profileUser && <Badge variant="outline">{profileUser.role}</Badge>}
                </DialogTitle>
              </DialogHeader>

              {profileLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                      placeholder="User's full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company / Organization</Label>
                    <Input
                      value={profileForm.company_name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, company_name: e.target.value }))}
                      placeholder="Company name (if applicable)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Avatar URL</Label>
                    <Input
                      value={profileForm.avatar_url}
                      onChange={(e) => setProfileForm((p) => ({ ...p, avatar_url: e.target.value }))}
                      placeholder="https://example.com/avatar.jpg"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="User biography / description"
                      rows={3}
                    />
                  </div>
                  {profileUser && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
                      <span>ID: <code className="bg-muted px-1 rounded">{profileUser.id.slice(0, 8)}…</code></span>
                      <span>Joined: {new Date(profileUser.created_at).toLocaleDateString()}</span>
                      <span>Updated: {new Date(profileUser.updated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setProfileDialog(false)}>Cancel</Button>
                    <Button onClick={handleProfileSave} disabled={profileSaving}>
                      {profileSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
