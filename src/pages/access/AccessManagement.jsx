import { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Shield, RotateCcw, Check, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';

// String registry of all tenant permissions. These mirror the constants in
// the hms (hms-care) frontend; the backend stores them as plain strings so
// no shared package is needed. Keep in sync if the tenant app adds more.
const PERMISSION_GROUPS = [
  { label: 'Dashboard', perms: ['dashboard:view'] },
  { label: 'Users & Clinics', perms: [
    'users:view', 'users:create', 'users:edit', 'users:delete',
    'clinics:view', 'clinics:create', 'clinics:edit', 'clinics:delete',
  ] },
  { label: 'Doctors', perms: ['doctors:view', 'doctors:create', 'doctors:edit', 'doctors:delete'] },
  { label: 'Patients', perms: ['patients:view', 'patients:create', 'patients:edit', 'patients:delete'] },
  { label: 'Appointments', perms: ['appointments:view', 'appointments:create', 'appointments:edit', 'appointments:cancel'] },
  { label: 'Prescriptions', perms: ['prescriptions:view', 'prescriptions:create', 'prescriptions:edit', 'prescriptions:delete'] },
  { label: 'Invoices', perms: ['invoices:view', 'invoices:create', 'invoices:edit', 'invoices:delete', 'invoices:payment'] },
  { label: 'Medicines', perms: ['medicines:view', 'medicines:create', 'medicines:edit', 'medicines:delete'] },
  { label: 'Tests / Lab', perms: ['tests:view', 'tests:create', 'tests:edit', 'tests:delete'] },
  { label: 'Staff & HR', perms: [
    'staff:view', 'staff:create', 'staff:edit', 'staff:delete',
    'attendance:view', 'attendance:mark',
    'leaves:view', 'leaves:create', 'leaves:approve',
  ] },
  { label: 'IPD / Wards', perms: ['ipd:view', 'ipd:manage', 'ipd:admit', 'ipd:nursing'] },
  { label: 'Insurance, Assets, Feedback', perms: [
    'insurance:view', 'insurance:create', 'insurance:edit',
    'assets:view', 'assets:create', 'assets:edit', 'assets:delete',
    'feedback:view', 'feedback:respond',
  ] },
  { label: 'Leads / CRM', perms: ['leads:view', 'leads:create', 'leads:edit', 'leads:delete', 'leads:convert'] },
  { label: 'Reports & AI', perms: ['reports:view', 'ai:view'] },
  { label: 'System', perms: [
    'activity_logs:view', 'settings:view', 'settings:edit', 'support:view',
    'templates:view', 'templates:create', 'templates:edit', 'templates:delete',
  ] },
];

// Hardcoded baseline per role — matches what the hms-care frontend ships
// out of the box. When a hospital has no override saved, this is what runs.
// Surfaced here so the admin can see what would apply if they reset.
const BASELINE = {
  doctor: [
    'dashboard:view', 'patients:view', 'appointments:view', 'appointments:edit',
    'prescriptions:view', 'prescriptions:create', 'prescriptions:edit',
    'medicines:view', 'tests:view', 'feedback:view', 'settings:view', 'settings:edit',
    'ipd:view', 'ipd:admit',
  ],
  receptionist: [
    'dashboard:view', 'patients:view', 'patients:create', 'patients:edit',
    'appointments:view', 'appointments:create', 'appointments:edit', 'appointments:cancel',
    'invoices:view', 'invoices:create', 'invoices:payment',
    'leads:view', 'leads:create', 'leads:edit',
    'feedback:view', 'settings:view', 'ipd:view', 'ipd:admit',
  ],
  nurse: [
    'dashboard:view', 'patients:view', 'appointments:view', 'prescriptions:view',
    'medicines:view', 'tests:view', 'settings:view',
    'attendance:view', 'leaves:view', 'leaves:create',
    'ipd:view', 'ipd:nursing',
  ],
  pharmacist: [
    'dashboard:view', 'prescriptions:view',
    'medicines:view', 'medicines:create', 'medicines:edit',
    'settings:view', 'attendance:view', 'leaves:view', 'leaves:create',
  ],
  lab_technician: [
    'dashboard:view', 'tests:view', 'tests:create', 'tests:edit',
    'patients:view', 'settings:view',
    'attendance:view', 'leaves:view', 'leaves:create',
  ],
  accountant: [
    'dashboard:view', 'invoices:view', 'invoices:create', 'invoices:edit', 'invoices:payment',
    'reports:view', 'insurance:view', 'insurance:create', 'insurance:edit',
    'settings:view', 'attendance:view', 'leaves:view', 'leaves:create',
  ],
};

function actionLabel(perm) {
  const parts = String(perm).split(':');
  const action = parts[1] || parts[0];
  return action.charAt(0).toUpperCase() + action.slice(1);
}

export default function AccessManagement() {
  const [hospitals, setHospitals] = useState([]);
  const [hospitalId, setHospitalId] = useState('');
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  const [loadingAccess, setLoadingAccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  // selected[role] = string[] currently-active permissions for that role.
  const [selected, setSelected] = useState({});
  const [activeRole, setActiveRole] = useState('doctor');
  const [search, setSearch] = useState('');

  // Load the hospital list once for the picker.
  useEffect(() => {
    let cancelled = false;
    api.get(endpoints.hospitals.list, { params: { limit: 200 } })
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data || [];
        setHospitals(list);
        if (list.length && !hospitalId) setHospitalId(list[0].id);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingHospitals(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAccess = useCallback(async () => {
    if (!hospitalId) return;
    setLoadingAccess(true);
    try {
      const res = await api.get(endpoints.hospitals.accessControl(hospitalId));
      const editableRoles = res.data?.data?.roles || [];
      const overrides = res.data?.data?.overrides || {};
      const next = {};
      for (const r of editableRoles) {
        next[r] = overrides[r]?.length ? [...overrides[r]] : [...(BASELINE[r] || [])];
      }
      setRoles(editableRoles);
      setSelected(next);
      if (editableRoles.length && !editableRoles.includes(activeRole)) {
        setActiveRole(editableRoles[0]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load access control');
    } finally { setLoadingAccess(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  useEffect(() => { fetchAccess(); }, [fetchAccess]);

  const togglePermission = (perm) => {
    setSelected((s) => {
      const cur = new Set(s[activeRole] || []);
      if (cur.has(perm)) cur.delete(perm); else cur.add(perm);
      return { ...s, [activeRole]: [...cur] };
    });
  };

  const toggleGroup = (perms, allOn) => {
    setSelected((s) => {
      const cur = new Set(s[activeRole] || []);
      if (allOn) perms.forEach((p) => cur.delete(p));
      else perms.forEach((p) => cur.add(p));
      return { ...s, [activeRole]: [...cur] };
    });
  };

  const resetToDefault = () => {
    setSelected((s) => ({ ...s, [activeRole]: [...(BASELINE[activeRole] || [])] }));
    toast('Reverted to baseline — click Save to persist.', { icon: '↩' });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(endpoints.hospitals.saveAccessRole(hospitalId, activeRole), {
        permissions: selected[activeRole] || [],
      });
      toast.success(`Saved access for ${activeRole.replace('_', ' ')}. Users in this role need to log out and back in for changes to apply.`, { duration: 6000 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const filteredGroups = useMemo(() => {
    if (!search) return PERMISSION_GROUPS;
    const q = search.toLowerCase();
    return PERMISSION_GROUPS
      .map((g) => ({ ...g, perms: g.perms.filter((p) => p.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) }))
      .filter((g) => g.perms.length);
  }, [search]);

  const selectedSet = new Set(selected[activeRole] || []);
  const totalPerms = PERMISSION_GROUPS.reduce((sum, g) => sum + g.perms.length, 0);
  const activeHospital = hospitals.find((h) => h.id === hospitalId);

  if (loadingHospitals) return <Spinner fullPage />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Access Management</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 max-w-2xl">
              Control which menu items, buttons, and pages each persona can use inside a hospital. Hospital admin always has full access.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={RotateCcw} onClick={resetToDefault} disabled={!hospitalId}>Reset to default</Button>
          <Button icon={Save} onClick={save} loading={saving} disabled={!hospitalId}>Save changes</Button>
        </div>
      </div>

      {/* Hospital picker */}
      <Card>
        <div className="flex items-center gap-3 flex-wrap">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Hospital:</span>
          <div className="min-w-[280px] flex-1 max-w-md">
            <Select
              value={hospitalId}
              onChange={setHospitalId}
              placeholder="Select hospital"
              options={hospitals.map((h) => ({ value: h.id, label: `${h.name}${h.slug ? ` (${h.slug})` : ''}` }))}
            />
          </div>
          {activeHospital?.schemaName && (
            <span className="text-[11px] text-gray-400 font-mono">schema: {activeHospital.schemaName}</span>
          )}
        </div>
      </Card>

      {!hospitalId ? (
        <Card>
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-8">Pick a hospital to manage role permissions.</p>
        </Card>
      ) : loadingAccess ? <Spinner /> : (
        <Card padding={false} className="overflow-hidden">
          {/* Role selector tabs */}
          <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/40">
            {roles.map((r) => {
              const count = (selected[r] || []).length;
              const isActive = activeRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActiveRole(r)}
                  className={clsx(
                    'px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 capitalize',
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60'
                  )}
                >
                  {r.replace('_', ' ')}
                  <Badge color={isActive ? 'blue' : 'gray'}>{count}</Badge>
                </button>
              );
            })}
          </div>

          <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 capitalize">
                {activeRole.replace('_', ' ')} permissions
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {selectedSet.size} of {totalPerms} permissions enabled
              </p>
            </div>
            <input
              type="text"
              placeholder="Search permissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-5 space-y-4">
            {filteredGroups.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-6">No permissions match your search.</p>
            ) : (
              filteredGroups.map((group) => {
                const groupCount = group.perms.filter((p) => selectedSet.has(p)).length;
                const allOn = groupCount === group.perms.length;
                const someOn = groupCount > 0 && !allOn;
                return (
                  <div key={group.label} className="rounded-lg border border-gray-200 dark:border-slate-800">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-slate-100">{group.label}</h4>
                        <span className={clsx(
                          'text-[10px] px-1.5 py-0.5 rounded-full',
                          allOn ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : someOn ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-slate-700/60 dark:text-slate-400'
                        )}>
                          {groupCount}/{group.perms.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.perms, allOn)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {allOn ? 'Disable all' : 'Enable all'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 p-2">
                      {group.perms.map((perm) => {
                        const on = selectedSet.has(perm);
                        return (
                          <button
                            key={perm}
                            type="button"
                            onClick={() => togglePermission(perm)}
                            className={clsx(
                              'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition text-left',
                              on
                                ? 'bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200 border border-blue-200 dark:border-blue-500/30'
                                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:border-blue-300'
                            )}
                          >
                            <span className={clsx(
                              'w-4 h-4 rounded flex items-center justify-center shrink-0 border',
                              on
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 dark:border-slate-600'
                            )}>
                              {on && <Check className="w-3 h-3" />}
                            </span>
                            <span className="font-medium">{actionLabel(perm)}</span>
                            <span className="ml-auto text-[10px] font-mono text-gray-400 dark:text-slate-500 truncate">{perm}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
        Note: changes take effect for users in this hospital + role on their next login. Currently logged-in users keep their cached permissions until they sign out.
      </p>
    </div>
  );
}
