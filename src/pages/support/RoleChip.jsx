// Tiny role pill used in support ticket lists + chat bubbles so the platform
// support team knows which hospital persona filed the ticket / wrote each
// message (admin, doctor, nurse, receptionist, pharmacist, lab tech,
// accountant). Color-coded to match the role mental model.

const ROLE_STYLES = {
  hospital_admin: { label: 'Admin',        cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  doctor:         { label: 'Doctor',       cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  nurse:          { label: 'Nurse',        cls: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300' },
  receptionist:   { label: 'Receptionist', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  pharmacist:     { label: 'Pharmacist',   cls: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
  lab_technician: { label: 'Lab Tech',     cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300' },
  accountant:     { label: 'Accountant',   cls: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300' },
};

export default function RoleChip({ role, className = '' }) {
  if (!role) return null;
  const meta = ROLE_STYLES[role] || { label: String(role).replace(/_/g, ' '), cls: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300' };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${meta.cls} ${className}`}>
      {meta.label}
    </span>
  );
}
