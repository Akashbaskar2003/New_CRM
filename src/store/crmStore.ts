import { create } from 'zustand';

// Types matching the PostgreSQL database schema
export type Role = 'SUPER_ADMIN' | 'TEAM_LEAD' | 'FINANCE';
export type TeamCode = 'JAVA' | 'PYTHON' | 'DOTNET' | 'SUPPORT';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  team_id: TeamCode | null; // null for Super Admin / Finance
}

export type CandidateType = 'TRAINING' | 'DIRECT_PLACEMENT';
export type PlacementStatus = 'NOT_PLACED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type PaymentStatus = 'NOT_STARTED' | 'PARTIALLY_PAID' | 'FULLY_PAID';

export interface Candidate {
  id: number;
  candidate_code: string;
  
  // New Joinee Registration
  full_name: string;
  phone: string;
  email: string;
  branch: string;
  course: string;
  batch: string;
  remarks: string;
  
  // BGV fields
  date_of_birth?: string;
  father_name?: string;
  alternate_phone?: string;
  address?: string;
  pincode?: string;
  
  // Direct Placement fields
  year_of_passing?: string;
  currently_working?: boolean;
  experience_type?: string;
  placement_company?: string;
  designation?: string;
  annual_ctc?: number;
  
  // Classification
  team_id: TeamCode;
  candidate_type: CandidateType;
  
  // Approvals & Finances
  placement_status: PlacementStatus;
  collection_percentage?: number; // e.g. 5, 10, 15
  amount_payable: number; // CTC * collection_percentage / 100
  total_paid: number;
  pending_amount: number;
  payment_status: PaymentStatus;
  due_date?: string;
  
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  candidate_id: number;
  amount: number;
  payment_date: string;
  payment_mode: string; // Cash, GPay, PhonePe, UPI, Bank Transfer, NEFT/RTGS, Card, Others
  transaction_ref?: string;
  collected_by: string;
  remarks?: string;
  receipt_url?: string;
  created_at: string;
}

export interface Document {
  id: number;
  candidate_id: number;
  doc_type: string; // OFFER_LETTER, SALARY_SLIP, JOINING_LETTER, EXPERIENCE_LETTER, BGV, RECEIPT, RELIEVING_LETTER, PF_SERVICE_HISTORY, PAYSLIP
  file_url: string;
  file_name: string;
  uploaded_by: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  candidate_id?: number;
  candidate_name?: string;
  action: string;
  description: string;
  old_value?: string;
  new_value?: string;
  ip_address: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number; // 0 for everyone
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

interface CRMStore {
  // Database States
  candidates: Candidate[];
  payments: Payment[];
  documents: Document[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  
  // Auth & UI States
  currentUser: User;
  currentTheme: 'sunny' | 'command';
  selectedCandidateId: number | null;
  activeTab: 'DASHBOARD' | 'DIRECT_PLACEMENT' | 'REPORTS' | 'BACKUP';
  isSyncing: boolean;

  // Actions
  setTheme: (theme: 'sunny' | 'command') => void;
  setUserRole: (role: Role, teamId: TeamCode | null) => void;
  setActiveTab: (tab: 'DASHBOARD' | 'DIRECT_PLACEMENT' | 'REPORTS' | 'BACKUP') => void;
  setSelectedCandidateId: (id: number | null) => void;
  triggerSync: () => void;
  
  // Database Operations
  addCandidate: (candidateData: Partial<Candidate>, creatorId?: number) => number;
  updateCandidate: (id: number, candidateData: Partial<Candidate>, updaterId?: number) => void;
  approveCandidate: (id: number, collectionPercentage: number, approverId?: number) => void;
  rejectCandidate: (id: number, reason: string, approverId?: number) => void;
  deleteCandidate: (id: number, deleterId?: number) => void;
  
  addPayment: (paymentData: Omit<Payment, 'id' | 'created_at'>, userId?: number) => void;
  addDocument: (documentData: Omit<Document, 'id' | 'created_at'>, userId?: number) => void;
  markNotificationAsRead: (id: number) => void;
  clearNotifications: () => void;
  resetDatabase: () => void;
}

// Initial mock users
export const mockUsers: Record<string, User> = {
  superAdmin: { id: 1, email: 'admin@uniq.com', full_name: 'PyCRM Super Admin', role: 'SUPER_ADMIN', team_id: null },
  javaTL: { id: 2, email: 'java.lead@uniq.com', full_name: 'Java Team Lead', role: 'TEAM_LEAD', team_id: 'JAVA' },
  pythonTL: { id: 3, email: 'python.lead@uniq.com', full_name: 'Python Team Lead', role: 'TEAM_LEAD', team_id: 'PYTHON' },
  dotnetTL: { id: 4, email: 'dotnet.lead@uniq.com', full_name: 'DotNet Team Lead', role: 'TEAM_LEAD', team_id: 'DOTNET' },
  supportTL: { id: 5, email: 'support.lead@uniq.com', full_name: 'Support Team Lead', role: 'TEAM_LEAD', team_id: 'SUPPORT' },
  financeUser: { id: 6, email: 'finance@uniq.com', full_name: 'UNIQ Finance Team', role: 'FINANCE', team_id: null },
};

// Initial Seed Data
const defaultCandidates: Candidate[] = [
  {
    id: 101,
    candidate_code: 'UNIQ-2026-TR01',
    full_name: 'Lavan Yadav',
    phone: '9876543210',
    email: 'lavan.yadav@example.com',
    branch: 'Chennai',
    course: 'Full Stack Java Developer',
    batch: 'Batch B12',
    remarks: 'Strong coding logic, good feedback from trainer.',
    team_id: 'JAVA',
    candidate_type: 'TRAINING',
    placement_status: 'NOT_PLACED',
    amount_payable: 0,
    total_paid: 0,
    pending_amount: 0,
    payment_status: 'NOT_STARTED',
    created_by: 2,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 102,
    candidate_code: 'UNIQ-2026-TR02',
    full_name: 'Priyah Hari',
    phone: '9988776655',
    email: 'priyah.h@example.com',
    branch: 'Coimbatore',
    course: 'Python Data Science',
    batch: 'Batch P08',
    remarks: 'Cleared BGV successfully. Received offer letter.',
    date_of_birth: '2004-05-14',
    father_name: 'Hariprasad K',
    alternate_phone: '9988776600',
    address: '12, Gandhi Nagar, Coimbatore',
    pincode: '641012',
    placement_company: 'Zoho Corporation',
    designation: 'Software Associate',
    annual_ctc: 450000,
    team_id: 'PYTHON',
    candidate_type: 'TRAINING',
    placement_status: 'PENDING_APPROVAL',
    amount_payable: 0,
    total_paid: 0,
    pending_amount: 0,
    payment_status: 'NOT_STARTED',
    created_by: 3,
    created_at: '2026-08-03T11:15:00Z',
    updated_at: '2026-08-05T09:30:00Z'
  },
  {
    id: 103,
    candidate_code: 'UNIQ-2026-DP01',
    full_name: 'Vikram Seth',
    phone: '8877665544',
    email: 'vikram.s@example.com',
    branch: 'Bangalore',
    course: 'DotNet Core Development',
    batch: 'Direct Placement',
    remarks: 'Experienced candidate, direct corporate hiring.',
    year_of_passing: '2024',
    currently_working: true,
    experience_type: 'Experienced (2 Years)',
    placement_company: 'Infosys Ltd',
    designation: 'Senior Developer',
    annual_ctc: 800000,
    team_id: 'DOTNET',
    candidate_type: 'DIRECT_PLACEMENT',
    placement_status: 'APPROVED',
    collection_percentage: 10,
    amount_payable: 80000, // 8,00,000 * 10%
    total_paid: 30000,
    pending_amount: 50000,
    payment_status: 'PARTIALLY_PAID',
    due_date: '2026-08-30',
    created_by: 4,
    created_at: '2026-08-02T14:20:00Z',
    updated_at: '2026-08-06T15:45:00Z'
  },
  {
    id: 104,
    candidate_code: 'UNIQ-2026-DP02',
    full_name: 'Anjali Sharma',
    phone: '7766554433',
    email: 'anjali.s@example.com',
    branch: 'Chennai',
    course: 'Production Support & Cloud',
    batch: 'Direct Placement',
    remarks: 'Placed quickly, immediate joiner.',
    year_of_passing: '2025',
    currently_working: false,
    experience_type: 'Fresher',
    placement_company: 'TCS',
    designation: 'Support Engineer',
    annual_ctc: 360000,
    team_id: 'SUPPORT',
    candidate_type: 'DIRECT_PLACEMENT',
    placement_status: 'APPROVED',
    collection_percentage: 15,
    amount_payable: 54000, // 3,60,000 * 15%
    total_paid: 54000,
    pending_amount: 0,
    payment_status: 'FULLY_PAID',
    created_by: 5,
    created_at: '2026-08-04T09:00:00Z',
    updated_at: '2026-08-07T12:00:00Z'
  }
];

const defaultPayments: Payment[] = [
  {
    id: 501,
    candidate_id: 102,
    amount: 1500, // document/BGV fee
    payment_date: '2026-08-05',
    payment_mode: 'UPI',
    transaction_ref: 'TXN889920199',
    collected_by: 'Python Team Lead',
    remarks: 'Document charges for background check verification.',
    created_at: '2026-08-05T09:30:00Z'
  },
  {
    id: 502,
    candidate_id: 103,
    amount: 30000,
    payment_date: '2026-08-06',
    payment_mode: 'GPay',
    transaction_ref: 'GP-9081729221',
    collected_by: 'DotNet Team Lead',
    remarks: 'First installment paid.',
    created_at: '2026-08-06T15:45:00Z'
  },
  {
    id: 503,
    candidate_id: 104,
    amount: 20000,
    payment_date: '2026-08-06',
    payment_mode: 'Bank Transfer',
    transaction_ref: 'HDFCR520260806001',
    collected_by: 'Support Team Lead',
    remarks: 'First installment of placement collection.',
    created_at: '2026-08-06T09:30:00Z'
  },
  {
    id: 504,
    candidate_id: 104,
    amount: 34000,
    payment_date: '2026-08-07',
    payment_mode: 'UPI',
    transaction_ref: 'TXN7738291039',
    collected_by: 'Support Team Lead',
    remarks: 'Final installment paid. Account fully cleared.',
    created_at: '2026-08-07T12:00:00Z'
  }
];

const defaultDocuments: Document[] = [
  {
    id: 301,
    candidate_id: 102,
    doc_type: 'OFFER_LETTER',
    file_name: 'Zoho_Offer_Letter_Priyah.pdf',
    file_url: '#',
    uploaded_by: 3,
    created_at: '2026-08-05T09:15:00Z'
  },
  {
    id: 302,
    candidate_id: 103,
    doc_type: 'OFFER_LETTER',
    file_name: 'Infosys_Offer_Vikram.pdf',
    file_url: '#',
    uploaded_by: 4,
    created_at: '2026-08-02T14:25:00Z'
  },
  {
    id: 303,
    candidate_id: 103,
    doc_type: 'PAYSILIP',
    file_name: 'Previous_Company_Payslip_Vikram.pdf',
    file_url: '#',
    uploaded_by: 4,
    created_at: '2026-08-02T14:26:00Z'
  },
  {
    id: 304,
    candidate_id: 104,
    doc_type: 'OFFER_LETTER',
    file_name: 'TCS_Offer_Anjali.pdf',
    file_url: '#',
    uploaded_by: 5,
    created_at: '2026-08-04T09:05:00Z'
  }
];

const defaultAuditLogs: AuditLog[] = [
  {
    id: 1,
    user_id: 2,
    user_name: 'Java Team Lead',
    candidate_id: 101,
    candidate_name: 'Lavan Yadav',
    action: 'REGISTER_CANDIDATE',
    description: 'Registered new joinee candidate Lavan Yadav (Java team).',
    ip_address: '192.168.1.102',
    created_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 2,
    user_id: 3,
    user_name: 'Python Team Lead',
    candidate_id: 102,
    candidate_name: 'Priyah Hari',
    action: 'SUBMIT_BGV',
    description: 'Submitted BGV details and attached Zoho Offer Letter.',
    ip_address: '192.168.1.105',
    created_at: '2026-08-05T09:30:00Z'
  },
  {
    id: 3,
    user_id: 1,
    user_name: 'PyCRM Super Admin',
    candidate_id: 103,
    candidate_name: 'Vikram Seth',
    action: 'APPROVE_PLACEMENT',
    description: 'Approved placement for Vikram Seth. Set collection to 10%.',
    old_value: 'PENDING_APPROVAL',
    new_value: 'APPROVED',
    ip_address: '192.168.1.1',
    created_at: '2026-08-06T10:00:00Z'
  },
  {
    id: 4,
    user_id: 4,
    user_name: 'DotNet Team Lead',
    candidate_id: 103,
    candidate_name: 'Vikram Seth',
    action: 'RECORD_PAYMENT',
    description: 'Recorded installment payment of ₹30,000 via GPay.',
    old_value: 'total_paid = 0',
    new_value: 'total_paid = 30000',
    ip_address: '192.168.1.111',
    created_at: '2026-08-06T15:45:00Z'
  },
  {
    id: 5,
    user_id: 5,
    user_name: 'Support Team Lead',
    candidate_id: 104,
    candidate_name: 'Anjali Sharma',
    action: 'RECORD_PAYMENT',
    description: 'Recorded final payment of ₹34,000 via UPI. Status fully paid.',
    old_value: 'total_paid = 20000',
    new_value: 'total_paid = 54000',
    ip_address: '192.168.1.120',
    created_at: '2026-08-07T12:00:00Z'
  }
];

const defaultNotifications: Notification[] = [
  {
    id: 1,
    user_id: 1, // Super Admin
    title: 'Pending Placement Approval',
    message: 'Priyah Hari is pending placement approval by Java/Python HR.',
    type: 'warning',
    is_read: false,
    created_at: '2026-08-05T09:30:00Z'
  },
  {
    id: 2,
    user_id: 0, // Everyone
    title: 'System Migration Successful',
    message: 'Welcome to the new PostgreSQL-backed PyCRM Command Center prototype.',
    type: 'success',
    is_read: false,
    created_at: '2026-08-08T07:45:00Z'
  }
];

// Helper to load state from LocalStorage
const loadLocalState = <T>(key: string, defaultValue: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    console.error('Error reading localStorage', e);
    return defaultValue;
  }
};

// Helper to save state to LocalStorage
const saveLocalState = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
};

export const useCRMStore = create<CRMStore>((set, get) => ({
  // Database States loaded from LocalStorage or Defaults
  candidates: loadLocalState<Candidate[]>('crm_candidates', defaultCandidates),
  payments: loadLocalState<Payment[]>('crm_payments', defaultPayments),
  documents: loadLocalState<Document[]>('crm_documents', defaultDocuments),
  auditLogs: loadLocalState<AuditLog[]>('crm_audit_logs', defaultAuditLogs),
  notifications: loadLocalState<Notification[]>('crm_notifications', defaultNotifications),
  
  // Auth & UI States
  currentUser: mockUsers.superAdmin,
  currentTheme: loadLocalState<'sunny' | 'command'>('crm_theme', 'sunny'),
  selectedCandidateId: null,
  activeTab: 'DASHBOARD',
  isSyncing: false,

  // Theme Toggler
  setTheme: (theme) => {
    saveLocalState('crm_theme', theme);
    const htmlElement = document.documentElement;
    if (theme === 'command') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    set({ currentTheme: theme });
  },

  // Switch role during presentation
  setUserRole: (role, teamId) => {
    let selectedUser = mockUsers.superAdmin;
    if (role === 'TEAM_LEAD') {
      if (teamId === 'JAVA') selectedUser = mockUsers.javaTL;
      else if (teamId === 'PYTHON') selectedUser = mockUsers.pythonTL;
      else if (teamId === 'DOTNET') selectedUser = mockUsers.dotnetTL;
      else if (teamId === 'SUPPORT') selectedUser = mockUsers.supportTL;
    } else if (role === 'FINANCE') {
      selectedUser = mockUsers.financeUser;
    }
    set({ currentUser: selectedUser, selectedCandidateId: null });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedCandidateId: (id) => set({ selectedCandidateId: id }),

  // Simulates background syncing animation for presentation visual feedback
  triggerSync: () => {
    set({ isSyncing: true });
    setTimeout(() => {
      set({ isSyncing: false });
      const currentLogs = get().auditLogs;
      const newLog: AuditLog = {
        id: Date.now(),
        user_id: get().currentUser.id,
        user_name: get().currentUser.full_name,
        action: 'MANUAL_SYNC',
        description: 'Initiated manual sync to resolve Google Sheets race conditions.',
        ip_address: '192.168.1.1',
        created_at: new Date().toISOString(),
      };
      const updatedLogs = [newLog, ...currentLogs];
      saveLocalState('crm_audit_logs', updatedLogs);
      set({ auditLogs: updatedLogs });
    }, 1500);
  },

  // ----------------------------------------------------
  // DB OPERATIONS (with auto audit logs & calculations)
  // ----------------------------------------------------
  
  addCandidate: (candidateData, creatorId) => {
    const creator = creatorId ? Object.values(mockUsers).find(u => u.id === creatorId) || get().currentUser : get().currentUser;
    const newId = get().candidates.length > 0 ? Math.max(...get().candidates.map(c => c.id)) + 1 : 101;
    
    // Automatically map course to team if not specified
    let mappedTeam: TeamCode = candidateData.team_id || 'JAVA';
    if (!candidateData.team_id && candidateData.course) {
      const courseUpper = candidateData.course.toUpperCase();
      if (courseUpper.includes('PYTHON') || courseUpper.includes('DATA')) mappedTeam = 'PYTHON';
      else if (courseUpper.includes('DOTNET') || courseUpper.includes('.NET')) mappedTeam = 'DOTNET';
      else if (courseUpper.includes('SUPPORT') || courseUpper.includes('CLOUD')) mappedTeam = 'SUPPORT';
      else mappedTeam = 'JAVA';
    }

    const type = candidateData.candidate_type || 'TRAINING';
    // Direct placements default to PENDING_APPROVAL. Training defaults to NOT_PLACED.
    const placement_status: PlacementStatus = type === 'DIRECT_PLACEMENT' ? 'PENDING_APPROVAL' : 'NOT_PLACED';

    const newCandidate: Candidate = {
      id: newId,
      candidate_code: `UNIQ-2026-${type === 'DIRECT_PLACEMENT' ? 'DP' : 'TR'}${String(newId).slice(-2)}`,
      full_name: candidateData.full_name || 'New Student',
      phone: candidateData.phone || '',
      email: candidateData.email || '',
      branch: candidateData.branch || 'Main Branch',
      course: candidateData.course || 'Training Program',
      batch: candidateData.batch || 'Batch A',
      remarks: candidateData.remarks || '',
      
      date_of_birth: candidateData.date_of_birth,
      father_name: candidateData.father_name,
      alternate_phone: candidateData.alternate_phone,
      address: candidateData.address,
      pincode: candidateData.pincode,
      
      year_of_passing: candidateData.year_of_passing,
      currently_working: candidateData.currently_working || false,
      experience_type: candidateData.experience_type || 'Fresher',
      placement_company: candidateData.placement_company,
      designation: candidateData.designation,
      annual_ctc: candidateData.annual_ctc,
      
      team_id: mappedTeam,
      candidate_type: type,
      
      placement_status: placement_status,
      collection_percentage: candidateData.collection_percentage,
      amount_payable: 0, // initially 0, computed on approval
      total_paid: 0,
      pending_amount: 0,
      payment_status: 'NOT_STARTED',
      
      created_by: creator.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Calculate initial payments if any
    if (candidateData.total_paid && candidateData.total_paid > 0) {
      newCandidate.total_paid = candidateData.total_paid;
      newCandidate.payment_status = 'PARTIALLY_PAID';
    }

    const updatedCandidates = [newCandidate, ...get().candidates];
    saveLocalState('crm_candidates', updatedCandidates);

    // Create Audit Log
    const newLog: AuditLog = {
      id: Date.now(),
      user_id: creator.id,
      user_name: creator.full_name,
      candidate_id: newId,
      candidate_name: newCandidate.full_name,
      action: 'REGISTER_CANDIDATE',
      description: `Registered new candidate ${newCandidate.full_name} (${newCandidate.candidate_type} - ${newCandidate.team_id} team).`,
      ip_address: '192.168.1.100',
      created_at: new Date().toISOString(),
    };
    const updatedLogs = [newLog, ...get().auditLogs];
    saveLocalState('crm_audit_logs', updatedLogs);

    // Create Admin Notification if Direct Placement
    if (type === 'DIRECT_PLACEMENT') {
      const newNotif: Notification = {
        id: Date.now(),
        user_id: 1, // Admin
        title: 'New Placement Pending Approval',
        message: `${newCandidate.full_name} placed at ${newCandidate.placement_company} is pending Admin review.`,
        type: 'warning',
        is_read: false,
        created_at: new Date().toISOString()
      };
      const updatedNotifs = [newNotif, ...get().notifications];
      saveLocalState('crm_notifications', updatedNotifs);
      set({ notifications: updatedNotifs });
    }

    set({ candidates: updatedCandidates, auditLogs: updatedLogs });
    return newId;
  },

  updateCandidate: (id, candidateData, updaterId) => {
    const creator = updaterId ? Object.values(mockUsers).find(u => u.id === updaterId) || get().currentUser : get().currentUser;
    
    const updatedCandidates = get().candidates.map(candidate => {
      if (candidate.id === id) {
        // Capture old values for audit logging
        const oldVal = `Status: ${candidate.placement_status}, Company: ${candidate.placement_company || 'None'}`;
        const updated = {
          ...candidate,
          ...candidateData,
          updated_at: new Date().toISOString(),
        };
        
        // Log changes
        const newVal = `Status: ${updated.placement_status}, Company: ${updated.placement_company || 'None'}`;
        const newLog: AuditLog = {
          id: Date.now() + Math.random(),
          user_id: creator.id,
          user_name: creator.full_name,
          candidate_id: id,
          candidate_name: candidate.full_name,
          action: 'UPDATE_PROFILE',
          description: `Updated profile details for candidate ${candidate.full_name}.`,
          old_value: oldVal,
          new_value: newVal,
          ip_address: '192.168.1.100',
          created_at: new Date().toISOString(),
        };
        
        const updatedLogs = [newLog, ...get().auditLogs];
        saveLocalState('crm_audit_logs', updatedLogs);
        
        // Sync set
        setTimeout(() => set({ auditLogs: updatedLogs }), 0);
        return updated;
      }
      return candidate;
    });

    saveLocalState('crm_candidates', updatedCandidates);
    set({ candidates: updatedCandidates });
  },

  approveCandidate: (id, collectionPercentage, approverId) => {
    const approver = approverId ? Object.values(mockUsers).find(u => u.id === approverId) || get().currentUser : get().currentUser;
    
    const updatedCandidates = get().candidates.map(c => {
      if (c.id === id) {
        const annual_ctc = c.annual_ctc || 0;
        const amount_payable = (annual_ctc * collectionPercentage) / 100;
        const pending_amount = Math.max(amount_payable - c.total_paid, 0);
        
        let payment_status: PaymentStatus = 'NOT_STARTED';
        if (c.total_paid >= amount_payable && amount_payable > 0) {
          payment_status = 'FULLY_PAID';
        } else if (c.total_paid > 0) {
          payment_status = 'PARTIALLY_PAID';
        }

        const newLog: AuditLog = {
          id: Date.now(),
          user_id: approver.id,
          user_name: approver.full_name,
          candidate_id: id,
          candidate_name: c.full_name,
          action: 'APPROVE_PLACEMENT',
          description: `Approved placement for ${c.full_name}. Set collection percentage to ${collectionPercentage}%. Frozen Amount: ₹${amount_payable.toLocaleString()}.`,
          old_value: `Status: PENDING_APPROVAL`,
          new_value: `Status: APPROVED, Payable: ₹${amount_payable}`,
          ip_address: '192.168.1.1',
          created_at: new Date().toISOString(),
        };

        // Create notification for Team Lead
        const newNotif: Notification = {
          id: Date.now() + 1,
          user_id: c.created_by, // Team Lead who created it
          title: 'Placement Approved',
          message: `${c.full_name}'s placement has been approved. You can now record installment payments.`,
          type: 'success',
          is_read: false,
          created_at: new Date().toISOString()
        };

        setTimeout(() => {
          const updatedLogs = [newLog, ...get().auditLogs];
          const updatedNotifs = [newNotif, ...get().notifications];
          saveLocalState('crm_audit_logs', updatedLogs);
          saveLocalState('crm_notifications', updatedNotifs);
          set({ auditLogs: updatedLogs, notifications: updatedNotifs });
        }, 0);

        return {
          ...c,
          placement_status: 'APPROVED',
          collection_percentage: collectionPercentage,
          amount_payable: amount_payable,
          pending_amount: pending_amount,
          payment_status: payment_status,
          updated_at: new Date().toISOString(),
        } as Candidate;
      }
      return c;
    });

    saveLocalState('crm_candidates', updatedCandidates);
    set({ candidates: updatedCandidates });
  },

  rejectCandidate: (id, reason, approverId) => {
    const approver = approverId ? Object.values(mockUsers).find(u => u.id === approverId) || get().currentUser : get().currentUser;
    
    const updatedCandidates = get().candidates.map(c => {
      if (c.id === id) {
        const newLog: AuditLog = {
          id: Date.now(),
          user_id: approver.id,
          user_name: approver.full_name,
          candidate_id: id,
          candidate_name: c.full_name,
          action: 'REJECT_PLACEMENT',
          description: `Rejected placement for ${c.full_name}. Reason: ${reason}`,
          old_value: `Status: PENDING_APPROVAL`,
          new_value: `Status: REJECTED`,
          ip_address: '192.168.1.1',
          created_at: new Date().toISOString(),
        };

        const newNotif: Notification = {
          id: Date.now() + 1,
          user_id: c.created_by,
          title: 'Placement Rejected',
          message: `${c.full_name}'s placement was rejected. Reason: ${reason}`,
          type: 'error',
          is_read: false,
          created_at: new Date().toISOString()
        };

        setTimeout(() => {
          const updatedLogs = [newLog, ...get().auditLogs];
          const updatedNotifs = [newNotif, ...get().notifications];
          saveLocalState('crm_audit_logs', updatedLogs);
          saveLocalState('crm_notifications', updatedNotifs);
          set({ auditLogs: updatedLogs, notifications: updatedNotifs });
        }, 0);

        return {
          ...c,
          placement_status: 'REJECTED',
          updated_at: new Date().toISOString(),
        } as Candidate;
      }
      return c;
    });

    saveLocalState('crm_candidates', updatedCandidates);
    set({ candidates: updatedCandidates });
  },

  deleteCandidate: (id, deleterId) => {
    const deleter = deleterId ? Object.values(mockUsers).find(u => u.id === deleterId) || get().currentUser : get().currentUser;
    const target = get().candidates.find(c => c.id === id);
    if (!target) return;

    const updatedCandidates = get().candidates.filter(c => c.id !== id);
    saveLocalState('crm_candidates', updatedCandidates);

    const newLog: AuditLog = {
      id: Date.now(),
      user_id: deleter.id,
      user_name: deleter.full_name,
      candidate_id: id,
      candidate_name: target.full_name,
      action: 'SOFT_DELETE_CANDIDATE',
      description: `Soft deleted candidate ${target.full_name} from list.`,
      ip_address: '192.168.1.1',
      created_at: new Date().toISOString(),
    };
    const updatedLogs = [newLog, ...get().auditLogs];
    saveLocalState('crm_audit_logs', updatedLogs);
    
    set({ candidates: updatedCandidates, auditLogs: updatedLogs, selectedCandidateId: null });
  },

  addPayment: (paymentData, userId) => {
    const user = userId ? Object.values(mockUsers).find(u => u.id === userId) || get().currentUser : get().currentUser;
    const newPaymentId = get().payments.length > 0 ? Math.max(...get().payments.map(p => p.id)) + 1 : 501;

    const newPayment: Payment = {
      ...paymentData,
      id: newPaymentId,
      created_at: new Date().toISOString(),
    };

    const updatedPayments = [newPayment, ...get().payments];
    saveLocalState('crm_payments', updatedPayments);

    // Update candidate metrics
    const updatedCandidates = get().candidates.map(candidate => {
      if (candidate.id === paymentData.candidate_id) {
        const total_paid = candidate.total_paid + paymentData.amount;
        const amount_payable = candidate.amount_payable;
        const pending_amount = Math.max(amount_payable - total_paid, 0);
        
        let payment_status: PaymentStatus = 'PARTIALLY_PAID';
        if (amount_payable > 0 && total_paid >= amount_payable) {
          payment_status = 'FULLY_PAID';
        } else if (total_paid <= 0) {
          payment_status = 'NOT_STARTED';
        }

        // Add Audit Log
        const newLog: AuditLog = {
          id: Date.now() + Math.random(),
          user_id: user.id,
          user_name: user.full_name,
          candidate_id: candidate.id,
          candidate_name: candidate.full_name,
          action: 'RECORD_PAYMENT',
          description: `Recorded payment of ₹${paymentData.amount.toLocaleString()} via ${paymentData.payment_mode}.`,
          old_value: `Paid: ₹${candidate.total_paid}, Status: ${candidate.payment_status}`,
          new_value: `Paid: ₹${total_paid}, Status: ${payment_status}`,
          ip_address: '192.168.1.100',
          created_at: new Date().toISOString(),
        };

        // Notify if fully paid
        if (payment_status === 'FULLY_PAID') {
          const newNotif: Notification = {
            id: Date.now() + 2,
            user_id: 1, // Admin
            title: 'Candidate Fully Paid',
            message: `${candidate.full_name} has cleared all dues (₹${amount_payable.toLocaleString()}).`,
            type: 'success',
            is_read: false,
            created_at: new Date().toISOString()
          };
          setTimeout(() => {
            const updatedNotifs = [newNotif, ...get().notifications];
            saveLocalState('crm_notifications', updatedNotifs);
            set({ notifications: updatedNotifs });
          }, 0);
        }

        setTimeout(() => {
          const updatedLogs = [newLog, ...get().auditLogs];
          saveLocalState('crm_audit_logs', updatedLogs);
          set({ auditLogs: updatedLogs });
        }, 0);

        return {
          ...candidate,
          total_paid,
          pending_amount,
          payment_status,
          updated_at: new Date().toISOString(),
        };
      }
      return candidate;
    });

    saveLocalState('crm_candidates', updatedCandidates);
    set({ payments: updatedPayments, candidates: updatedCandidates });
  },

  addDocument: (documentData, userId) => {
    const user = userId ? Object.values(mockUsers).find(u => u.id === userId) || get().currentUser : get().currentUser;
    const newDocId = get().documents.length > 0 ? Math.max(...get().documents.map(d => d.id)) + 1 : 301;

    const newDocument: Document = {
      ...documentData,
      id: newDocId,
      created_at: new Date().toISOString(),
    };

    const updatedDocuments = [newDocument, ...get().documents];
    saveLocalState('crm_documents', updatedDocuments);

    const targetCandidate = get().candidates.find(c => c.id === documentData.candidate_id);
    const newLog: AuditLog = {
      id: Date.now(),
      user_id: user.id,
      user_name: user.full_name,
      candidate_id: documentData.candidate_id,
      candidate_name: targetCandidate?.full_name || 'Unknown',
      action: 'UPLOAD_DOCUMENT',
      description: `Uploaded document of type ${documentData.doc_type} (${documentData.file_name}).`,
      ip_address: '192.168.1.100',
      created_at: new Date().toISOString(),
    };
    const updatedLogs = [newLog, ...get().auditLogs];
    saveLocalState('crm_audit_logs', updatedLogs);

    set({ documents: updatedDocuments, auditLogs: updatedLogs });
  },

  markNotificationAsRead: (id) => {
    const updated = get().notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
    saveLocalState('crm_notifications', updated);
    set({ notifications: updated });
  },

  clearNotifications: () => {
    saveLocalState('crm_notifications', []);
    set({ notifications: [] });
  },

  resetDatabase: () => {
    localStorage.removeItem('crm_candidates');
    localStorage.removeItem('crm_payments');
    localStorage.removeItem('crm_documents');
    localStorage.removeItem('crm_audit_logs');
    localStorage.removeItem('crm_notifications');
    set({
      candidates: defaultCandidates,
      payments: defaultPayments,
      documents: defaultDocuments,
      auditLogs: defaultAuditLogs,
      notifications: defaultNotifications,
      selectedCandidateId: null
    });
  }
}));
