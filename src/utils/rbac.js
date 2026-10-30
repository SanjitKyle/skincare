/**
 * Role-Based Access Control (RBAC) definitions and helpers.
 * Supported core roles: 'admin', 'doctor', 'staff', 'patient'
 */

export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  STAFF: 'staff',
  PATIENT: 'patient',
};

// Map sub-roles or employment types to standard core roles
const ROLE_ALIASES = {
  admin: ROLES.ADMIN,
  administrator: ROLES.ADMIN,
  clinic_admin: ROLES.ADMIN,
  clinicadmin: ROLES.ADMIN,
  doctor: ROLES.DOCTOR,
  dentist: ROLES.DOCTOR,
  staff: ROLES.STAFF,
  nurse: ROLES.STAFF,
  receptionist: ROLES.STAFF,
  technician: ROLES.STAFF,
  billing: ROLES.STAFF,
  patient: ROLES.PATIENT,
  patients: ROLES.PATIENT,
  user: ROLES.PATIENT,
  client: ROLES.PATIENT,
  customer: ROLES.PATIENT,
};

/**
 * Safely extracts user object from localStorage
 */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed?.data?.user || parsed?.user || parsed?.data?.patient || parsed?.patient || parsed?.data?.doctor || parsed?.doctor || parsed?.data?.staff || parsed?.staff || parsed?.data || parsed;
  } catch {
    return null;
  }
};

/**
 * Normalizes user role string into a standard core role (admin, doctor, staff, patient)
 */
export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return ROLES.STAFF; // safe default fallback
  const cleaned = role.trim().toLowerCase();
  return ROLE_ALIASES[cleaned] || cleaned;
};

/**
 * Returns the currently logged in user's normalized role
 */
export const getUserRole = (user = getCurrentUser()) => {
  const rawRole = user?.role || user?.employment || user?.designation || user?.type || user?.accountType || (user?.patient ? 'patient' : null);
  if (!rawRole) {
    if (Array.isArray(user?.permissions)) return ROLES.STAFF;
    return ROLES.STAFF;
  }
  return normalizeRole(rawRole);
};

/**
 * Checks if a given role is in the allowed roles list
 */
export const isRoleAllowed = (role, allowedRoles = []) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const current = normalizeRole(role);
  return allowedRoles.map(normalizeRole).includes(current);
};

/**
 * Route access permissions mapping by role
 */
export const ROUTE_PERMISSIONS = {
  '/dashboard': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT],
  '/queue': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT],
  '/patients': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF],
  '/doctors': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT],
  '/appointments': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT],
  '/odontograms': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT],
  '/prescriptions': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT],
  '/follow-up': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF],
  '/enquiries': [ROLES.ADMIN, ROLES.STAFF, ROLES.PATIENT],
  '/enquiry-follow-up': [ROLES.ADMIN, ROLES.STAFF],
  '/staff': [ROLES.ADMIN, ROLES.STAFF],
  '/billing': [ROLES.ADMIN, ROLES.STAFF, ROLES.PATIENT],
  '/lab-tracker': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF],
  '/test-reports': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT],
  '/inventory': [ROLES.ADMIN, ROLES.STAFF],
};

/**
 * Master catalog of permission groups, human labels, actions, and descriptions.
 * Single source of truth for Staff form and Staff detail views.
 */
export const PERMISSION_GROUPS = [
  {
    id: "patients",
    label: "Patients Directory",
    description: "Patient registration, profile details, and records",
    perms: [
      { id: "VIEW_PATIENT", label: "View Patients", action: "view", desc: "View patient directory & profile history" },
      { id: "CREATE_PATIENT", label: "Add Patient", action: "create", desc: "Register new patients into clinic system" },
      { id: "EDIT_PATIENT", label: "Edit Patient", action: "edit", desc: "Update patient records & contact details" },
      { id: "DELETE_PATIENT", label: "Delete Patient", action: "delete", isDestructive: true, desc: "Remove patient record permanently" },
    ],
  },
  {
    id: "appointments",
    label: "Appointments & Scheduling",
    description: "Doctor schedules, patient bookings, and consultations",
    perms: [
      { id: "VIEW_APPOINTMENT", label: "View Appointments", action: "view", desc: "Check doctor calendar & patient slots" },
      { id: "CREATE_APPOINTMENT", label: "Book Appointment", action: "create", desc: "Schedule new visit for a patient" },
      { id: "EDIT_APPOINTMENT", label: "Reschedule / Edit", action: "edit", desc: "Change appointment time or doctor" },
      { id: "CANCEL_APPOINTMENT", label: "Cancel Appointment", action: "delete", isDestructive: true, desc: "Cancel booked appointments" },
    ],
  },
  {
    id: "queue",
    label: "OPD Queue & Tokens",
    description: "Waiting area queue, token issuance, and counter calling",
    perms: [
      { id: "VIEW_QUEUE", label: "View OPD Queue", action: "view", desc: "Inspect live patient waiting room & token board" },
      { id: "MANAGE_QUEUE", label: "Call & Serve Tokens", action: "manage", desc: "Call next patient, mark in-consultation or served" },
      { id: "ISSUE_TOKEN", label: "Issue Walk-in Tokens", action: "create", desc: "Generate OPD token for incoming patients" },
    ],
  },
  {
    id: "skin_chart",
    label: "Skin Treatment Chart",
    description: "Skin assessment areas and recorded concerns",
    perms: [
      { id: "VIEW_ODONTOGRAM", label: "View Skin Treatment Chart", action: "view", desc: "Review skin concerns by treatment area" },
      { id: "CREATE_ODONTOGRAM", label: "Create Skin Chart", action: "create", desc: "Record an initial skin assessment" },
      { id: "EDIT_ODONTOGRAM", label: "Update Skin Chart", action: "edit", desc: "Update recorded skin assessment areas" },
      { id: "DELETE_ODONTOGRAM", label: "Delete Skin Chart", action: "delete", isDestructive: true, desc: "Remove a skin chart entry" },
    ],
  },
  {
    id: "billing",
    label: "Billing & Invoices",
    description: "Invoicing, payment processing, and revenue reporting",
    perms: [
      { id: "PROCESS_BILLING", label: "Process Invoices", action: "manage", desc: "Create, collect, and settle patient bills" },
      { id: "VIEW_REPORTS", label: "View Reports", action: "view", desc: "Access revenue, payment, and test reports" },
    ],
  },
  {
    id: "lab_tracker",
    label: "Products & Supplies",
    description: "Skin-care product suppliers, clinic inventory, and order tracking",
    perms: [
      { id: "VIEW_LAB_TRACKER", label: "View Lab Orders", action: "view", desc: "Track crown, bridge, and denture fabrication status" },
      { id: "MANAGE_LAB_TRACKER", label: "Manage Supply Orders", action: "manage", desc: "Place product orders and track delivery to the clinic" },
    ],
  },
  {
    id: "enquiries",
    label: "Enquiries & Leads",
    description: "Prospective patient inquiries and phone leads",
    perms: [
      { id: "VIEW_ENQUIRY", label: "View Enquiries", action: "view", desc: "Check incoming patient questions & leads" },
      { id: "MANAGE_ENQUIRY", label: "Log New Enquiry", action: "create", desc: "Create and assign new patient leads" },
      { id: "EDIT_ENQUIRY", label: "Update Enquiry", action: "edit", desc: "Update inquiry status and conversion note" },
      { id: "DELETE_ENQUIRY", label: "Delete Enquiry", action: "delete", isDestructive: true, desc: "Remove inquiry record" },
    ],
  },
  {
    id: "followups",
    label: "Patient Follow-ups",
    description: "Post-care check-ins and recall appointments",
    perms: [
      { id: "MANAGE_FOLLOW_UP", label: "Manage Follow-ups", action: "create", desc: "Schedule and view follow-up reminders" },
      { id: "EDIT_FOLLOW_UP", label: "Update Follow-up", action: "edit", desc: "Mark follow-up completed or postponed" },
      { id: "DELETE_FOLLOW_UP", label: "Delete Follow-up", action: "delete", isDestructive: true, desc: "Remove follow-up reminder" },
    ],
  },
  {
    id: "operations",
    label: "Operations & Admin",
    description: "Clinic supplies, inventory, and staff privilege management",
    perms: [
      { id: "MANAGE_INVENTORY", label: "Manage Inventory", action: "manage", desc: "Track stock, supplies, and orders" },
      { id: "MANAGE_STAFF", label: "Manage Staff", action: "manage", isDestructive: true, desc: "Create staff and grant permissions" },
    ],
  },
];

/**
 * Production-ready Role Templates / Presets.
 * Allows 1-click assignment of standard permissions without ticking individual checkboxes manually.
 */
export const STAFF_ROLE_PRESETS = [
  {
    id: "RECEPTIONIST",
    roleKey: "RECEPTIONIST",
    name: "Receptionist / Front Desk",
    badge: "Front Desk",
    iconName: "UserCheck",
    color: "sky",
    description: "Handles registration, queue tokens, appointments, inquiries, follow-ups, and invoice generation.",
    permissions: [
      "VIEW_PATIENT", "CREATE_PATIENT", "EDIT_PATIENT",
      "VIEW_APPOINTMENT", "CREATE_APPOINTMENT", "EDIT_APPOINTMENT", "CANCEL_APPOINTMENT",
      "VIEW_QUEUE", "MANAGE_QUEUE", "ISSUE_TOKEN",
      "VIEW_ODONTOGRAM",
      "VIEW_ENQUIRY", "MANAGE_ENQUIRY", "EDIT_ENQUIRY",
      "MANAGE_FOLLOW_UP", "EDIT_FOLLOW_UP",
      "PROCESS_BILLING", "VIEW_REPORTS",
    ],
  },
  {
    id: "NURSE",
    roleKey: "NURSE",
    name: "Nurse / Assistant",
    badge: "Clinical Care",
    iconName: "Stethoscope",
    color: "teal",
    description: "Assists doctors, updates patient notes, supports the OPD queue, and tracks clinic supplies.",
    permissions: [
      "VIEW_PATIENT", "EDIT_PATIENT",
      "VIEW_APPOINTMENT", "EDIT_APPOINTMENT",
      "VIEW_QUEUE", "MANAGE_QUEUE",
      "VIEW_ODONTOGRAM", "CREATE_ODONTOGRAM", "EDIT_ODONTOGRAM",
      "VIEW_LAB_TRACKER", "MANAGE_LAB_TRACKER",
      "MANAGE_FOLLOW_UP",
      "VIEW_REPORTS",
      "MANAGE_INVENTORY",
    ],
  },
  {
    id: "BILLING",
    roleKey: "BILLING",
    name: "Billing & Cashier",
    badge: "Accounts",
    iconName: "CreditCard",
    color: "emerald",
    description: "Focuses on billing, generating invoices, collecting payments, and financial reports.",
    permissions: [
      "VIEW_PATIENT",
      "VIEW_ODONTOGRAM",
      "VIEW_APPOINTMENT",
      "PROCESS_BILLING",
      "VIEW_REPORTS",
    ],
  },
  {
    id: "TECHNICIAN",
    roleKey: "TECHNICIAN",
    name: "Clinic Technician",
    badge: "Laboratory",
    iconName: "Wrench",
    color: "amber",
    description: "Tracks clinic product orders, supplies, and patient service logistics.",
    permissions: [
      "VIEW_PATIENT",
      "VIEW_LAB_TRACKER", "MANAGE_LAB_TRACKER",
      "VIEW_REPORTS",
      "MANAGE_INVENTORY",
    ],
  },
  {
    id: "FULL_ACCESS",
    roleKey: "ADMIN",
    name: "Clinic Manager (All Access)",
    badge: "Full Access",
    iconName: "ShieldCheck",
    color: "violet",
    description: "Unrestricted operational access to all clinic capabilities across every module.",
    permissions: [
      "VIEW_PATIENT", "CREATE_PATIENT", "EDIT_PATIENT", "DELETE_PATIENT",
      "VIEW_APPOINTMENT", "CREATE_APPOINTMENT", "EDIT_APPOINTMENT", "CANCEL_APPOINTMENT",
      "VIEW_QUEUE", "MANAGE_QUEUE", "ISSUE_TOKEN",
      "VIEW_ODONTOGRAM", "CREATE_ODONTOGRAM", "EDIT_ODONTOGRAM", "DELETE_ODONTOGRAM",
      "VIEW_LAB_TRACKER", "MANAGE_LAB_TRACKER",
      "PROCESS_BILLING", "VIEW_REPORTS", "MANAGE_INVENTORY", "MANAGE_STAFF",
      "VIEW_ENQUIRY", "MANAGE_ENQUIRY", "EDIT_ENQUIRY", "DELETE_ENQUIRY",
      "MANAGE_FOLLOW_UP", "EDIT_FOLLOW_UP", "DELETE_FOLLOW_UP",
    ],
  },
  {
    id: "READ_ONLY",
    roleKey: null,
    name: "View-Only Auditor",
    badge: "Read Only",
    iconName: "Eye",
    color: "slate",
    description: "Inspection access only. Cannot create, edit, or delete any records.",
    permissions: [
      "VIEW_PATIENT",
      "VIEW_APPOINTMENT",
      "VIEW_QUEUE",
      "VIEW_ODONTOGRAM",
      "VIEW_LAB_TRACKER",
      "VIEW_ENQUIRY",
      "VIEW_REPORTS",
    ],
  },
];

/**
 * Returns flat list of all active permission IDs
 */
export const getAllPermissions = () => {
  return PERMISSION_GROUPS.flatMap((g) => g.perms.map((p) => p.id));
};

/**
 * Finds matching preset by role key or permission list match
 */
export const getPresetByRole = (roleKey) => {
  if (!roleKey) return null;
  const normalized = String(roleKey).toUpperCase().trim();
  return STAFF_ROLE_PRESETS.find((p) => p.roleKey === normalized) || null;
};

/**
 * Route to granular permission requirement for staff.
 * If a staff member is not given the required permission, they will not see or access the route.
 */
export const STAFF_ROUTE_PERMISSIONS = {
  '/patients': ['VIEW_PATIENT'],
  '/appointments': ['VIEW_APPOINTMENT'],
  '/queue': ['VIEW_QUEUE', 'MANAGE_QUEUE', 'ISSUE_TOKEN'],
  '/odontograms': ['VIEW_ODONTOGRAM'],
  '/lab-tracker': ['VIEW_LAB_TRACKER', 'MANAGE_LAB_TRACKER'],
  '/follow-up': ['MANAGE_FOLLOW_UP'],
  '/enquiries': ['VIEW_ENQUIRY'],
  '/enquiry-follow-up': ['VIEW_ENQUIRY'],
  '/billing': ['PROCESS_BILLING'],
  '/staff': ['MANAGE_STAFF'],
  '/inventory': ['MANAGE_INVENTORY'],
  '/test-reports': ['VIEW_REPORTS'],
};

/**
 * Normalizes permission key (converts spaces and hyphens to underscores, uppercase)
 */
export const normalizePermission = (perm) => {
  return String(perm || '').toUpperCase().replace(/[\s-]+/g, '_').trim();
};

/**
 * Checks if a user has a specific granular permission.
 * - If user has an assigned permissions array (e.g. staff profile), check against it directly.
 * - Admin without restricted permissions has all permissions.
 * - Doctor has standard clinical permissions.
 * - Patient has false.
 */
export const hasPermission = (permission, user = getCurrentUser()) => {
  if (!user) return false;

  // 1. ADMIN BYPASS: Permission-based access is NOT for admin! Admin ALWAYS has 100% full access
  const rawRole = String(user?.role || user?.employment || user?.designation || user?.accountType || user?.type || '').toLowerCase().trim();
  const normalizedRole = normalizeRole(rawRole);

  if (normalizedRole === ROLES.ADMIN || rawRole === 'admin' || rawRole === 'administrator' || user?.isAdmin === true) {
    return true;
  }

  const targetPerm = normalizePermission(permission);

  // 2. STAFF: Permission-based access applies ONLY to staff, reading directly from their staff profile
  if (normalizedRole === ROLES.STAFF) {
    const rawPerms = user?.permissions || user?.data?.permissions || user?.data?.user?.permissions || user?.staff?.permissions;
    if (Array.isArray(rawPerms)) {
      return rawPerms.some((p) => normalizePermission(p) === targetPerm);
    }
    // If a staff member has no permissions array assigned, they have no access
    return false;
  }

  // 3. DOCTOR: Standard clinical permissions
  if (normalizedRole === ROLES.DOCTOR) {
    const doctorAllowed = [
      'VIEW_PATIENT', 'CREATE_PATIENT', 'EDIT_PATIENT',
      'VIEW_APPOINTMENT', 'CREATE_APPOINTMENT', 'EDIT_APPOINTMENT', 'CANCEL_APPOINTMENT',
      'VIEW_QUEUE', 'MANAGE_QUEUE', 'ISSUE_TOKEN',
      'VIEW_ODONTOGRAM', 'CREATE_ODONTOGRAM', 'EDIT_ODONTOGRAM',
      'VIEW_LAB_TRACKER', 'MANAGE_LAB_TRACKER',
      'MANAGE_FOLLOW_UP', 'EDIT_FOLLOW_UP', 'VIEW_REPORTS'
    ];
    return doctorAllowed.includes(targetPerm);
  }

  if (normalizedRole === ROLES.PATIENT) {
    return false;
  }

  return false;
};

/**
 * Checks whether the current user can access a specific route path
 */
export const canAccessRoute = (path, role, user = getCurrentUser()) => {
  const currentRole = role || getUserRole();
  const basePath = '/' + (path.split('/')[1] || '');

  // Admin has access to all application routes
  if (currentRole === ROLES.ADMIN) {
    return true;
  }

  const allowed = ROUTE_PERMISSIONS[path] || ROUTE_PERMISSIONS[basePath];
  if (!allowed) return true;
  if (!isRoleAllowed(currentRole, allowed)) return false;

  // Granular check for Staff role based on assigned privileges
  if (currentRole === ROLES.STAFF) {
    const requiredPerms = STAFF_ROUTE_PERMISSIONS[path] || STAFF_ROUTE_PERMISSIONS[basePath];
    if (requiredPerms && requiredPerms.length > 0) {
      const hasAny = requiredPerms.some((perm) => hasPermission(perm, user));
      if (!hasAny) return false;
    }
  }

  return true;
};

/**
 * Styling and badge details for UI
 */
export const ROLE_DETAILS = {
  [ROLES.ADMIN]: {
    label: 'Admin',
    badgeClass: 'bg-violet-100 text-violet-700 border-violet-200',
    description: 'Full Clinic Management & System Access',
  },
  [ROLES.DOCTOR]: {
    label: 'Doctor',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'Clinical Care, Appointments & Prescriptions',
  },
  [ROLES.STAFF]: {
    label: 'Staff',
    badgeClass: 'bg-sky-100 text-sky-700 border-sky-200',
    description: 'Reception, Patient Intake & Operations',
  },
  [ROLES.PATIENT]: {
    label: 'Patient',
    badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    description: 'Personal Appointments, Records & History',
  },
};
