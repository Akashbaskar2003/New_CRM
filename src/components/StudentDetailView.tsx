import React, { useState, useEffect, useRef } from 'react';
import { useCRMStore } from '../store/crmStore';
import type { Candidate } from '../store/crmStore';
import { 
  X, Plus, FileText, IndianRupee, Edit2, 
  RefreshCw, Layers, Upload, Eye, Download, Trash2, History, LogOut, CreditCard,
  Search, Clock, User
} from 'lucide-react';

interface StudentDetailViewProps {
  candidate: Candidate;
  onClose: () => void;
  breadcrumbSource: 'Dashboard' | 'Direct Placement';
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ 
  candidate: initialCandidate, 
  onClose,
  breadcrumbSource
}) => {
  const {
    candidates,
    payments,
    documents,
    currentUser,
    updateCandidate,
    addPayment,
    addDocument,
    auditLogs
  } = useCRMStore();

  // Find the fresh candidate instance from store to reflect updates immediately
  const candidate = candidates.find(c => c.id === initialCandidate.id) || initialCandidate;

  // Global Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Payment Modal State
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  // Upload modal states
  const [uploadTarget, setUploadTarget] = useState<{
    category: 'received' | 'applied';
    docType: DocType;
    label: string;
  } | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Financial Tab State
  const [activeFinTab, setActiveFinTab] = useState<'REGISTRATION' | 'COURSE_FEE' | 'DOCUMENT' | 'PLACEMENT'>('PLACEMENT');

  // Net Payable Fee Configuration (Full Cost + %) — Persistent per student/tab in LocalStorage.
  // Applies to REGISTRATION, COURSE_FEE, DOCUMENT tabs. No default is auto-applied on load;
  // the tab shows "Not Set" until the pencil icon is used to configure it.
  const defaultFeeFullCosts: Record<string, number> = {
    REGISTRATION: 5000,
    COURSE_FEE: 45000,
    DOCUMENT: 1500,
  };
  const [feeConfig, setFeeConfig] = useState<Record<string, { fullCost: number; percentage: number } | null>>(() => {
    const saved = localStorage.getItem(`fee_config_${candidate.id}`);
    if (saved) return JSON.parse(saved);
    return { REGISTRATION: null, COURSE_FEE: null, DOCUMENT: null };
  });
  const [editingFeeTab, setEditingFeeTab] = useState<string | null>(null);
  const [feeFullCostInput, setFeeFullCostInput] = useState('');
  const [feePercentageInput, setFeePercentageInput] = useState(100);
  const [isFeeEnteringCustomPct, setIsFeeEnteringCustomPct] = useState(false);
  const [feeCustomPctValue, setFeeCustomPctValue] = useState('');
  const presetFeePercentages = [25, 28, 32, 40];

  const openFeeEditor = (tab: string) => {
    if (tab === 'PLACEMENT') {
      // Placement's "Full Cost" is the Annual CTC and "%" is the collection percentage
      setFeeFullCostInput(String(candidate.annual_ctc ?? ''));
      setFeePercentageInput(candidate.collection_percentage ?? 100);
      setIsFeeEnteringCustomPct(false);
      setFeeCustomPctValue('');
      setEditingFeeTab(tab);
      return;
    }
    const existing = feeConfig[tab];
    setFeeFullCostInput(String(existing?.fullCost ?? defaultFeeFullCosts[tab] ?? ''));
    setFeePercentageInput(existing?.percentage ?? 100);
    setIsFeeEnteringCustomPct(false);
    setFeeCustomPctValue('');
    setEditingFeeTab(tab);
  };

  const handleSaveFeeConfig = () => {
    if (!editingFeeTab) return;
    const fullCost = Number(feeFullCostInput);
    if (!feeFullCostInput || isNaN(fullCost) || fullCost < 0) return;

    if (editingFeeTab === 'PLACEMENT') {
      // Update the candidate's CTC + collection % directly (same fields the
      // Placement % selector below writes to), so Net Payable stays in sync.
      const payableAmount = Math.round((fullCost * feePercentageInput) / 100);
      updateCandidate(candidate.id, {
        annual_ctc: fullCost,
        collection_percentage: feePercentageInput,
        amount_payable: payableAmount
      });
      setEditingFeeTab(null);
      return;
    }

    const updated = {
      ...feeConfig,
      [editingFeeTab]: { fullCost, percentage: feePercentageInput }
    };
    setFeeConfig(updated);
    localStorage.setItem(`fee_config_${candidate.id}`, JSON.stringify(updated));
    setEditingFeeTab(null);
  };

  const handleFeeCustomPctSave = () => {
    const val = parseInt(feeCustomPctValue, 10);
    if (!isNaN(val) && val >= 1 && val <= 100) {
      setFeePercentageInput(val);
    }
    setIsFeeEnteringCustomPct(false);
  };

  // Edit Form Fields
  const [editName, setEditName] = useState(candidate.full_name);
  const [editPhone, setEditPhone] = useState(candidate.phone);
  const [editEmail, setEditEmail] = useState(candidate.email);
  const [editAltPhone, setEditAltPhone] = useState(candidate.alternate_phone || '');
  const [editDob, setEditDob] = useState(candidate.date_of_birth || '');
  const [editFatherName, setEditFatherName] = useState(candidate.father_name || '');
  const [editAddress, setEditAddress] = useState(candidate.address || '');
  const [editPincode, setEditPincode] = useState(candidate.pincode || '');
  const [editBranch, setEditBranch] = useState(candidate.branch);
  const [editCourse, setEditCourse] = useState(candidate.course);
  const [editWorking, setEditWorking] = useState(candidate.currently_working ?? false);
  const [editCompany, setEditCompany] = useState(candidate.placement_company || '');
  const [editDesignation, setEditDesignation] = useState(candidate.designation || '');
  const [editCtc, setEditCtc] = useState(candidate.annual_ctc ? String(candidate.annual_ctc) : '');
  const [editStatus, setEditStatus] = useState(candidate.placement_status);

  // Sync edit form fields when candidate changes
  useEffect(() => {
    setEditName(candidate.full_name);
    setEditPhone(candidate.phone);
    setEditEmail(candidate.email);
    setEditAltPhone(candidate.alternate_phone || '');
    setEditDob(candidate.date_of_birth || '');
    setEditFatherName(candidate.father_name || '');
    setEditAddress(candidate.address || '');
    setEditPincode(candidate.pincode || '');
    setEditBranch(candidate.branch);
    setEditCourse(candidate.course);
    setEditWorking(candidate.currently_working ?? false);
    setEditCompany(candidate.placement_company || '');
    setEditDesignation(candidate.designation || '');
    setEditCtc(candidate.annual_ctc ? String(candidate.annual_ctc) : '');
    setEditStatus(candidate.placement_status);
  }, [candidate]);

  // Payment Form Fields
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payTxRef, setPayTxRef] = useState('');
  const [payRemarks, setPayRemarks] = useState('');

  // Past Employment Tags State (Persistent per student in LocalStorage)
  const [pastCompanies, setPastCompanies] = useState<string[]>(() => {
    const saved = localStorage.getItem(`past_companies_${candidate.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [newCompanyTag, setNewCompanyTag] = useState('');

  const handleAddCompanyTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyTag.trim()) return;
    const updated = [...pastCompanies, newCompanyTag.trim()];
    setPastCompanies(updated);
    localStorage.setItem(`past_companies_${candidate.id}`, JSON.stringify(updated));
    setNewCompanyTag('');
  };

  const handleRemoveCompanyTag = (indexToRemove: number) => {
    const updated = pastCompanies.filter((_, i) => i !== indexToRemove);
    setPastCompanies(updated);
    localStorage.setItem(`past_companies_${candidate.id}`, JSON.stringify(updated));
  };

  // Adjustments State (Persistent per student/tab in LocalStorage)
  const [adjustments, setAdjustments] = useState<Record<string, { id: number, description: string, amount: number, reason: string }[]>>(() => {
    const saved = localStorage.getItem(`adjustments_${candidate.id}`);
    return saved ? JSON.parse(saved) : {
      REGISTRATION: [],
      COURSE_FEE: [],
      DOCUMENT: [],
      PLACEMENT: [],
    };
  });
  const [isAddingAdjustment, setIsAddingAdjustment] = useState(false);
  const [adjDesc, setAdjDesc] = useState('');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');

  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjDesc.trim() || !adjAmount || !adjReason.trim()) return;
    const newAdj = {
      id: Date.now(),
      description: adjDesc.trim(),
      amount: Number(adjAmount),
      reason: adjReason.trim()
    };
    const updated = {
      ...adjustments,
      [activeFinTab]: [...(adjustments[activeFinTab] || []), newAdj]
    };
    setAdjustments(updated);
    localStorage.setItem(`adjustments_${candidate.id}`, JSON.stringify(updated));
    setAdjDesc('');
    setAdjAmount('');
    setAdjReason('');
    setIsAddingAdjustment(false);
  };

  const handleRemoveAdjustment = (id: number) => {
    const updated = {
      ...adjustments,
      [activeFinTab]: (adjustments[activeFinTab] || []).filter(a => a.id !== id)
    };
    setAdjustments(updated);
    localStorage.setItem(`adjustments_${candidate.id}`, JSON.stringify(updated));
  };

  type DocType = 'OFFER_LETTER' | 'APPRAISALS' | 'PAYSLIP' | 'RELIEVING_LETTER' | 'COUNTER_OFFER' | 'PF_SERVICE_HISTORY';
  type DocChecklist = Record<DocType, boolean>;

  // Document Checklist states
  const storeDocs = documents.filter(d => d.candidate_id === candidate.id);
  const [receivedDocs, setReceivedDocs] = useState<DocChecklist>(() => {
    return {
      OFFER_LETTER: storeDocs.some(d => d.doc_type === 'OFFER_LETTER'),
      APPRAISALS: storeDocs.some(d => d.doc_type === 'APPRAISALS'),
      PAYSLIP: storeDocs.some(d => d.doc_type === 'PAYSLIP'),
      RELIEVING_LETTER: storeDocs.some(d => d.doc_type === 'RELIEVING_LETTER'),
      COUNTER_OFFER: storeDocs.some(d => d.doc_type === 'COUNTER_OFFER'),
      PF_SERVICE_HISTORY: storeDocs.some(d => d.doc_type === 'PF_SERVICE_HISTORY' || d.doc_type === 'PF_SERVICE_HISTORY_APPLIED'),
    };
  });

  const [appliedDocs, setAppliedDocs] = useState<DocChecklist>(() => {
    const saved = localStorage.getItem(`applied_docs_${candidate.id}`);
    return saved ? JSON.parse(saved) : {
      OFFER_LETTER: false,
      APPRAISALS: false,
      PAYSLIP: false,
      RELIEVING_LETTER: false,
      COUNTER_OFFER: false,
      PF_SERVICE_HISTORY: false,
    };
  });

  const handleToggleReceived = (docType: DocType, label: string) => {
    const isCurrentRec = receivedDocs[docType];
    if (isCurrentRec) {
      setReceivedDocs(prev => ({ ...prev, [docType]: false }));
    } else {
      setUploadTarget({ category: 'received', docType, label });
      setUploadFileName(`${candidate.full_name.replace(/\s+/g, '_')}_${label.replace(/\s+/g, '_')}.pdf`);
    }
  };

  const handleToggleApplied = (docType: DocType, label: string) => {
    const isCurrentApp = appliedDocs[docType];
    if (isCurrentApp) {
      const updated = { ...appliedDocs, [docType]: false };
      setAppliedDocs(updated);
      localStorage.setItem(`applied_docs_${candidate.id}`, JSON.stringify(updated));
    } else {
      setUploadTarget({ category: 'applied', docType, label });
      setUploadFileName(`${candidate.full_name.replace(/\s+/g, '_')}_${label.replace(/\s+/g, '_')}_applied.pdf`);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTarget) return;

    const { category, docType, label } = uploadTarget;
    if (category === 'received') {
      setReceivedDocs(prev => ({ ...prev, [docType]: true }));
      addDocument({
        candidate_id: candidate.id,
        doc_type: docType,
        file_name: uploadFileName || `${candidate.full_name.replace(/\s+/g, '_')}_${label.replace(/\s+/g, '_')}.pdf`,
        file_url: '#',
        uploaded_by: currentUser.id
      });
    } else {
      const updated = { ...appliedDocs, [docType]: true };
      setAppliedDocs(updated);
      localStorage.setItem(`applied_docs_${candidate.id}`, JSON.stringify(updated));
      addDocument({
        candidate_id: candidate.id,
        doc_type: `${docType}_APPLIED`,
        file_name: uploadFileName || `${candidate.full_name.replace(/\s+/g, '_')}_${label.replace(/\s+/g, '_')}_applied.pdf`,
        file_url: '#',
        uploaded_by: currentUser.id
      });
    }

    setUploadTarget(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
    }
  };

  const handleViewDoc = (_category: 'received' | 'applied', _docType: DocType, label: string) => {
    alert(`Viewing ${label}: ${candidate.full_name.replace(/\s+/g, '_')}_${label.replace(/\s+/g, '_')}.pdf`);
  };

  const handleDownloadDoc = (_category: 'received' | 'applied', _docType: DocType, label: string) => {
    alert(`Downloading ${label} PDF...`);
  };

  const handleReuploadDoc = (category: 'received' | 'applied', docType: DocType, label: string) => {
    setUploadTarget({ category, docType, label });
    setUploadFileName(`${candidate.full_name.replace(/\s+/g, '_')}_${label.replace(/\s+/g, '_')}${category === 'applied' ? '_applied' : ''}.pdf`);
  };

  const handleDeleteDoc = (category: 'received' | 'applied', docType: DocType, label: string) => {
    if (confirm(`Are you sure you want to delete ${label}?`)) {
      if (category === 'received') {
        setReceivedDocs(prev => ({ ...prev, [docType]: false }));
      } else {
        const updated = { ...appliedDocs, [docType]: false };
        setAppliedDocs(updated);
        localStorage.setItem(`applied_docs_${candidate.id}`, JSON.stringify(updated));
      }
    }
  };

  // Placement Screenshot Upload State (persisted per student in LocalStorage)
  const [placementScreenshot, setPlacementScreenshot] = useState<string | null>(() => {
    return localStorage.getItem(`placement_screenshot_${candidate.id}`);
  });
  const [placementScreenshotName, setPlacementScreenshotName] = useState<string>(() => {
    return localStorage.getItem(`placement_screenshot_name_${candidate.id}`) || '';
  });
  const placementScreenshotInputRef = useRef<HTMLInputElement>(null);

  const handlePlacementScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPlacementScreenshot(dataUrl);
      setPlacementScreenshotName(file.name);
      localStorage.setItem(`placement_screenshot_${candidate.id}`, dataUrl);
      localStorage.setItem(`placement_screenshot_name_${candidate.id}`, file.name);
      addDocument({
        candidate_id: candidate.id,
        doc_type: 'PLACEMENT_SCREENSHOT',
        file_name: file.name,
        file_url: dataUrl,
        uploaded_by: currentUser.id
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePlacementScreenshot = () => {
    setPlacementScreenshot(null);
    setPlacementScreenshotName('');
    localStorage.removeItem(`placement_screenshot_${candidate.id}`);
    localStorage.removeItem(`placement_screenshot_name_${candidate.id}`);
  };

  // Lists
  const dashboardRecDocsList = [
    { key: 'OFFER_LETTER' as const, label: 'Offer Letter', icon: FileText },
    { key: 'APPRAISALS' as const, label: 'Appraisals', icon: Layers },
    { key: 'PAYSLIP' as const, label: 'Payslips', icon: IndianRupee },
    { key: 'RELIEVING_LETTER' as const, label: 'Relieving Letter', icon: X },
    { key: 'COUNTER_OFFER' as const, label: 'Counter Offer', icon: RefreshCw },
  ];
  const directPlacementDocsList = [
    { key: 'OFFER_LETTER' as const, label: 'Offer Letter', icon: FileText },
    { key: 'RELIEVING_LETTER' as const, label: 'Relieving Letter', icon: LogOut },
    { key: 'PF_SERVICE_HISTORY' as const, label: 'PF Service History', icon: History },
    { key: 'PAYSLIP' as const, label: 'Payslip', icon: CreditCard },
  ];

  const currentDocsList = breadcrumbSource === 'Dashboard' ? dashboardRecDocsList : directPlacementDocsList;
  const receivedCount = currentDocsList.filter(doc => receivedDocs[doc.key]).length;
  const appliedCount = dashboardRecDocsList.filter(doc => appliedDocs[doc.key]).length;

  // Financial Tab calculations
  const getTabFinancials = () => {
    const activePayments = payments.filter(
      p => p.candidate_id === candidate.id && p.remarks?.startsWith(`[${activeFinTab}]`)
    );
    const sumPayments = activePayments.reduce((sum, p) => sum + p.amount, 0);
    const tabAdjustments = adjustments[activeFinTab] || [];
    const sumAdjustments = tabAdjustments.reduce((sum, a) => sum + a.amount, 0);

    let baseFee = 0;
    let fullCost = 0;
    let feeIsSet = true;
    if (activeFinTab === 'REGISTRATION' || activeFinTab === 'COURSE_FEE' || activeFinTab === 'DOCUMENT') {
      const cfg = feeConfig[activeFinTab];
      feeIsSet = !!cfg;
      fullCost = cfg?.fullCost ?? 0;
      baseFee = cfg ? Math.round((cfg.fullCost * cfg.percentage) / 100) : 0;
    } else if (activeFinTab === 'PLACEMENT') {
      baseFee = candidate.amount_payable;
      fullCost = candidate.annual_ctc || 0;
    }

    const netPayable = Math.max(0, baseFee + sumAdjustments);
    
    // For placement, we also fall back to candidate's own tracking if no custom remarks exist
    if (activeFinTab === 'PLACEMENT') {
      const placementPayments = payments.filter(
        p => p.candidate_id === candidate.id && 
        (!p.remarks?.startsWith('[REGISTRATION]') && 
         !p.remarks?.startsWith('[COURSE_FEE]') && 
         !p.remarks?.startsWith('[DOCUMENT]'))
      );
      const paid = placementPayments.reduce((sum, p) => sum + p.amount, 0);
      return {
        baseFee,
        fullCost,
        feeIsSet: true,
        netPayable: candidate.amount_payable + sumAdjustments,
        paidToDate: paid,
        pendingDues: Math.max(0, (candidate.amount_payable + sumAdjustments) - paid),
        history: placementPayments,
        adjustmentsList: tabAdjustments
      };
    }

    return {
      baseFee,
      fullCost,
      feeIsSet,
      netPayable: feeIsSet ? netPayable : 0,
      paidToDate: sumPayments,
      pendingDues: feeIsSet ? Math.max(0, netPayable - sumPayments) : 0,
      history: activePayments,
      adjustmentsList: tabAdjustments
    };
  };

  const financials = getTabFinancials();

  // Save Candidate Profile Edits
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCandidate(candidate.id, {
      full_name: editName,
      phone: editPhone,
      email: editEmail,
      alternate_phone: editAltPhone || undefined,
      date_of_birth: editDob || undefined,
      father_name: editFatherName || undefined,
      address: editAddress || undefined,
      pincode: editPincode || undefined,
      branch: editBranch,
      course: editCourse,
      currently_working: editWorking,
      placement_company: editCompany || undefined,
      designation: editDesignation || undefined,
      annual_ctc: editCtc ? Number(editCtc) : undefined,
      placement_status: editStatus
    });
    setIsEditModalOpen(false);
  };

  // Record Payment Submit
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) return;
    
    // Record payment prefixed with active financial tab
    addPayment({
      candidate_id: candidate.id,
      amount: Number(payAmount),
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: payMode,
      transaction_ref: payTxRef || `TXN-${Date.now()}`,
      collected_by: currentUser.full_name,
      remarks: `[${activeFinTab}] ${payRemarks || 'Installment Payment'}`
    });

    setPayAmount('');
    setPayTxRef('');
    setPayRemarks('');
    setIsAddingPayment(false);
  };

  // Format creation date nicely
  const getJoiningDate = () => {
    if (!candidate.created_at) return 'N/A';
    const date = new Date(candidate.created_at);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const [isChangesDrawerOpen, setIsChangesDrawerOpen] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('ALL');

  const studentLogs = auditLogs.filter(log => {
    const isThisCandidate = 
      log.candidate_id === candidate.id || 
      (log.candidate_name && log.candidate_name.toLowerCase() === candidate.full_name.toLowerCase());
      
    if (!isThisCandidate) return false;

    const matchesSearch =
      log.user_name.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(logSearchQuery.toLowerCase());

    const matchesAction = logActionFilter === 'ALL' || log.action === logActionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'APPROVE_PLACEMENT':
        return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/20 dark:border-green-900/30';
      case 'REJECT_PLACEMENT':
      case 'SOFT_DELETE_CANDIDATE':
        return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-900/30';
      case 'REGISTER_CANDIDATE':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900/30';
      case 'RECORD_PAYMENT':
        return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30';
      case 'UPLOAD_DOCUMENT':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950/20 dark:border-indigo-900/30';
      default:
        return 'text-text-secondary bg-bg-secondary border-border-primary';
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const logActionTypes = ['ALL', 'REGISTER_CANDIDATE', 'UPDATE_PROFILE', 'APPROVE_PLACEMENT', 'REJECT_PLACEMENT', 'RECORD_PAYMENT', 'UPLOAD_DOCUMENT'];

  const isBgvSubmitted = !!candidate.date_of_birth;

  return (
    <div className="w-full space-y-6 fade-in pb-16">
      
      {/* 1. Breadcrumb navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-primary pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted font-medium">
            <button onClick={onClose} className="hover:text-accent-orange flex items-center gap-1 transition-all">
              Dashboard
            </button>
            <span className="text-[10px]">/</span>
            <button onClick={onClose} className="hover:text-accent-orange transition-all">
              {breadcrumbSource}
            </button>
            <span className="text-[10px]">/</span>
            <span className="text-text-primary font-semibold">{candidate.full_name}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Status pills */}
            <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${
              isBgvSubmitted 
                ? 'bg-green-950/20 text-green-400 border-green-900/30 animate-pulse'
                : 'bg-amber-950/20 text-amber-400 border-amber-900/30'
            }`}>
              BGV: {isBgvSubmitted ? 'COMPLETED' : 'PENDING'}
            </span>
            <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${
              candidate.placement_status === 'APPROVED'
                ? 'bg-green-950/20 text-green-400 border-green-900/30'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}>
              Placed: {candidate.placement_status === 'APPROVED' ? 'YES' : 'NO'}
            </span>
          </div>
        </div>

        {/* Global edit button */}
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg border border-border-primary bg-bg-card hover:bg-bg-hover active:scale-95 transition-all text-text-secondary flex items-center gap-1.5 shadow-sm"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Global Edit
        </button>
      </div>

      {/* 2. Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Candidate details, employment tags, documents, bgv */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. Candidate Profile */}
          <div className="rounded-xl border border-border-primary bg-bg-card p-6 shadow-premium">
            <h3 className="text-[11px] font-extrabold font-mono tracking-widest text-amber-500/85 uppercase mb-5">
              Candidate Profile
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div className="flex justify-between border-b border-border-secondary/40 pb-2">
                <span className="text-text-muted font-mono uppercase text-[10px]">Full Name</span>
                <span className="font-semibold text-text-primary text-right">{candidate.full_name}</span>
              </div>
              <div className="flex justify-between border-b border-border-secondary/40 pb-2">
                <span className="text-text-muted font-mono uppercase text-[10px]">Phone Number</span>
                <span className="font-mono text-text-primary text-right">{candidate.phone}</span>
              </div>
              <div className="flex justify-between border-b border-border-secondary/40 pb-2">
                <span className="text-text-muted font-mono uppercase text-[10px]">Alt Contact</span>
                <span className="font-mono text-text-primary text-right">{candidate.alternate_phone || '--'}</span>
              </div>
              <div className="flex justify-between border-b border-border-secondary/40 pb-2">
                <span className="text-text-muted font-mono uppercase text-[10px]">Date of Birth</span>
                <span className="font-mono text-text-primary text-right">{candidate.date_of_birth || '--'}</span>
              </div>
              <div className="flex justify-between border-b border-border-secondary/40 pb-2">
                <span className="text-text-muted font-mono uppercase text-[10px]">Father Name</span>
                <span className="font-semibold text-text-primary text-right">{candidate.father_name || '--'}</span>
              </div>
              <div className="flex justify-between border-b border-border-secondary/40 pb-2">
                <span className="text-text-muted font-mono uppercase text-[10px]">Address</span>
                <span className="text-text-primary text-right max-w-[200px] truncate" title={candidate.address}>{candidate.address || '--'}</span>
              </div>
              <div className="flex justify-between border-b border-border-secondary/40 pb-2">
                <span className="text-text-muted font-mono uppercase text-[10px]">Pincode</span>
                <span className="font-mono text-text-primary text-right">{candidate.pincode || '--'}</span>
              </div>
              <div className="flex justify-between border-b border-border-secondary/40 pb-2">
                <span className="text-text-muted font-mono uppercase text-[10px]">Branch</span>
                <span className="font-semibold text-text-primary text-right">{candidate.branch}</span>
              </div>
              <div className="flex justify-between border-b border-border-secondary/40 pb-2">
                <span className="text-text-muted font-mono uppercase text-[10px]">Course</span>
                <span className="font-semibold text-text-primary text-right">{candidate.course}</span>
              </div>
              <div className="flex justify-between border-b border-border-secondary/40 pb-2">
                <span className="text-text-muted font-mono uppercase text-[10px]">Date of Joining</span>
                <span className="font-mono text-text-primary text-right">{getJoiningDate()}</span>
              </div>
              <div className="flex justify-between border-b border-border-secondary/40 pb-2 sm:col-span-2">
                <span className="text-text-muted font-mono uppercase text-[10px]">Current Status</span>
                <span className="font-semibold text-text-secondary text-right">
                  {candidate.placement_company ? `Placed at ${candidate.placement_company}` : 'active'}
                </span>
              </div>
            </div>
          </div>

          {/* B. Past Employment */}
          <div className="rounded-xl border border-border-primary bg-bg-card p-6 shadow-premium">
            <h3 className="text-[11px] font-extrabold font-mono tracking-widest text-amber-500/85 uppercase mb-2">
              Past Employment
            </h3>
            <p className="text-[11px] text-text-muted mb-4">
              Add previous companies as tags
            </p>

            <form onSubmit={handleAddCompanyTag} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="+ Add company..."
                value={newCompanyTag}
                onChange={e => setNewCompanyTag(e.target.value)}
                className="bg-bg-primary border border-border-primary rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-orange flex-1"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-bg-hover hover:bg-border-primary text-text-primary rounded-lg text-xs font-semibold border border-border-primary flex items-center gap-1 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {pastCompanies.map((company, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-bg-secondary text-text-secondary border border-border-primary px-2.5 py-1 rounded-md"
                >
                  {company}
                  <button 
                    type="button"
                    onClick={() => handleRemoveCompanyTag(index)}
                    className="text-text-muted hover:text-red-500 p-0.5 rounded-full hover:bg-bg-hover transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {pastCompanies.length === 0 && (
                <span className="text-xs text-text-muted italic">No past companies added.</span>
              )}
            </div>
          </div>

          {/* C. Document Vault */}
          <div className="rounded-xl border border-border-primary bg-bg-card p-6 shadow-premium">
            <h3 className="text-[11px] font-extrabold font-mono tracking-widest text-amber-500/85 uppercase mb-4">
              Document Vault
            </h3>

            {breadcrumbSource === 'Dashboard' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Documents Received */}
                <div className="space-y-3 bg-bg-primary/30 p-4 rounded-xl border border-border-primary/50">
                  <div className="flex justify-between items-center pb-2 border-b border-border-secondary/40">
                    <span className="text-xs font-bold text-text-secondary">DOCUMENTS RECEIVED</span>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-bg-secondary border border-border-primary rounded text-text-muted">
                      {receivedCount}/5
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {dashboardRecDocsList.map(doc => {
                      const DocIcon = doc.icon;
                      const isRec = receivedDocs[doc.key];
                      return (
                        <div 
                          key={doc.key}
                          className="flex items-center justify-between p-2 rounded bg-bg-card/40 border border-border-secondary/30 hover:bg-bg-hover transition-all"
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <input 
                              type="checkbox"
                              checked={isRec}
                              onChange={() => handleToggleReceived(doc.key, doc.label)}
                              className="rounded border-border-primary text-emerald-500 focus:ring-emerald-500 accent-[#10b981] cursor-pointer w-4 h-4"
                            />
                            <DocIcon className="h-3.5 w-3.5 text-text-muted" />
                            <span className="text-text-secondary text-[13px]">{doc.label}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isRec && (
                              <div className="flex items-center gap-1 border-r border-border-secondary/60 pr-2 mr-1">
                                <button 
                                  type="button" 
                                  onClick={() => handleViewDoc('received', doc.key, doc.label)}
                                  className="p-0.5 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-all"
                                  title="View"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleDownloadDoc('received', doc.key, doc.label)}
                                  className="p-0.5 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-all"
                                  title="Download"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleReuploadDoc('received', doc.key, doc.label)}
                                  className="p-0.5 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-all"
                                  title="Sync"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleDeleteDoc('received', doc.key, doc.label)}
                                  className="p-0.5 hover:bg-bg-hover rounded text-text-muted hover:text-red-500 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}

                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                              isRec 
                                ? 'text-emerald-500' 
                                : 'text-amber-500/80'
                            }`}>
                              {isRec ? 'RECEIVED' : 'PENDING'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Documents Applied */}
                <div className="space-y-3 bg-bg-primary/30 p-4 rounded-xl border border-border-primary/50">
                  <div className="flex justify-between items-center pb-2 border-b border-border-secondary/40">
                    <span className="text-xs font-bold text-text-secondary">DOCUMENTS APPLIED</span>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-bg-secondary border border-border-primary rounded text-text-muted">
                      {appliedCount}/5
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {dashboardRecDocsList.map(doc => {
                      const DocIcon = doc.icon;
                      const isApp = appliedDocs[doc.key];
                      return (
                        <div 
                          key={doc.key}
                          className="flex items-center justify-between p-2 rounded bg-bg-card/40 border border-border-secondary/30 hover:bg-bg-hover transition-all"
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <input 
                              type="checkbox"
                              checked={isApp}
                              onChange={() => handleToggleApplied(doc.key, doc.label)}
                              className="rounded border-border-primary text-emerald-500 focus:ring-emerald-500 accent-[#10b981] cursor-pointer w-4 h-4"
                            />
                            <DocIcon className="h-3.5 w-3.5 text-text-muted" />
                            <span className="text-text-secondary text-[13px]">{doc.label}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isApp && (
                              <div className="flex items-center gap-1 border-r border-border-secondary/60 pr-2 mr-1">
                                <button 
                                  type="button" 
                                  onClick={() => handleViewDoc('applied', doc.key, doc.label)}
                                  className="p-0.5 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-all"
                                  title="View"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleDownloadDoc('applied', doc.key, doc.label)}
                                  className="p-0.5 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-all"
                                  title="Download"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleReuploadDoc('applied', doc.key, doc.label)}
                                  className="p-0.5 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-all"
                                  title="Sync"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleDeleteDoc('applied', doc.key, doc.label)}
                                  className="p-0.5 hover:bg-bg-hover rounded text-text-muted hover:text-red-500 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}

                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                              isApp 
                                ? 'text-emerald-500' 
                                : 'text-amber-500/80'
                            }`}>
                              {isApp ? 'RECEIVED' : 'PENDING'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="space-y-3 bg-bg-primary/30 p-4 rounded-xl border border-border-primary/50">
                <div className="flex justify-between items-center pb-2 border-b border-border-secondary/40">
                  <span className="text-xs font-bold text-text-secondary">DOCUMENTS RECEIVED</span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-bg-secondary border border-border-primary rounded text-text-muted">
                    {receivedCount}/4
                  </span>
                </div>
                
                <div className="space-y-2">
                  {directPlacementDocsList.map(doc => {
                    const DocIcon = doc.icon;
                    const isRec = receivedDocs[doc.key];
                    return (
                      <div 
                        key={doc.key}
                        className="flex items-center justify-between p-2.5 rounded bg-bg-card/40 border border-border-secondary/30 hover:bg-bg-hover transition-all"
                      >
                        <div className="flex items-center gap-2.5 text-xs">
                          <input 
                            type="checkbox"
                            checked={isRec}
                            onChange={() => handleToggleReceived(doc.key, doc.label)}
                            className="rounded border-border-primary text-emerald-500 focus:ring-emerald-500 accent-[#10b981] cursor-pointer w-4.5 h-4.5"
                          />
                          <DocIcon className="h-4 w-4 text-text-muted" />
                          <span className={`font-semibold text-text-secondary text-sm ${isRec ? 'text-text-primary' : 'opacity-85'}`}>{doc.label}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {isRec && (
                            <div className="flex items-center gap-1.5 border-r border-border-secondary/60 pr-3 mr-1">
                              <button 
                                type="button" 
                                onClick={() => handleViewDoc('received', doc.key, doc.label)}
                                className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-all"
                                title="View Document"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleDownloadDoc('received', doc.key, doc.label)}
                                className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-all"
                                title="Download File"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleReuploadDoc('received', doc.key, doc.label)}
                                className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-all"
                                title="Re-upload File"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleDeleteDoc('received', doc.key, doc.label)}
                                className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-red-500 transition-all"
                                title="Delete Document"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}

                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isRec 
                              ? 'text-emerald-500' 
                              : 'text-amber-500/90'
                          }`}>
                            {isRec ? 'RECEIVED' : 'PENDING'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* D. Background Verification */}
          <div className="rounded-xl border border-border-primary bg-bg-card p-6 shadow-premium flex items-center justify-between">
            <div>
              <h3 className="text-[11px] font-extrabold font-mono tracking-widest text-amber-500/85 uppercase mb-1">
                Background Verification
              </h3>
              <p className="text-xs text-text-secondary">
                {isBgvSubmitted 
                  ? `BGV cleared successfully on submission of DOB: ${candidate.date_of_birth}` 
                  : 'No BGV form submitted yet.'
                }
              </p>
            </div>
            <span className={`text-[10px] font-bold font-mono uppercase px-3 py-1 rounded border ${
              isBgvSubmitted 
                ? 'bg-green-950/20 text-green-400 border-green-900/30' 
                : 'bg-amber-950/20 text-amber-400 border-amber-900/30'
            }`}>
              {isBgvSubmitted ? 'CLEARED' : 'PENDING'}
            </span>
          </div>

        </div>

        {/* Right Side: Financial console */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Financial Management Console */}
          <div className="relative overflow-hidden rounded-xl border border-border-primary bg-bg-card p-6 shadow-premium flex flex-col justify-between h-full min-h-[500px]">
            
            <div className="space-y-5">
              
              {/* Header with Add Payment Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-[11px] font-extrabold font-mono tracking-widest text-amber-500/85 uppercase">
                  Financial Management
                </h3>
                {!isAddingPayment && (
                  <button
                    onClick={() => setIsAddingPayment(true)}
                    className="text-[10px] font-bold px-2 py-1 rounded bg-accent-orange/10 hover:bg-accent-orange/20 text-accent-orange border border-accent-orange/20 transition-all flex items-center gap-0.5"
                  >
                    + ADD PAYMENT
                  </button>
                )}
              </div>

              {/* Inline Add Payment Panel (stays within Financial Management — no separate page/modal) */}
              {isAddingPayment && (
                <form
                  onSubmit={handleRecordPayment}
                  className="bg-bg-primary/50 p-3 rounded-lg border border-border-secondary space-y-2.5 fade-in"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-mono text-text-muted">
                      Add Payment
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingPayment(false)}
                      className="p-0.5 hover:bg-bg-hover rounded-full"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="font-semibold block mb-1 text-text-secondary">Payment Type *</label>
                      <select
                        value={activeFinTab}
                        onChange={e => setActiveFinTab(e.target.value as typeof activeFinTab)}
                        className="w-full bg-bg-card border border-border-primary rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-accent-orange text-text-secondary"
                      >
                        <option value="REGISTRATION">Registration Fee</option>
                        <option value="COURSE_FEE">Course Fee</option>
                        <option value="DOCUMENT">Document Fee</option>
                        <option value="PLACEMENT">Placement Payment</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-text-secondary">Payment Amount (INR) *</label>
                      <input
                        type="number"
                        required
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full bg-bg-card border border-border-primary rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-accent-orange"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-text-secondary">Payment Mode *</label>
                      <select
                        value={payMode}
                        onChange={e => setPayMode(e.target.value)}
                        className="w-full bg-bg-card border border-border-primary rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-accent-orange text-text-secondary"
                      >
                        <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                        <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Credit/Debit Card</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-text-secondary">Transaction Ref ID / Proof</label>
                      <input
                        type="text"
                        value={payTxRef}
                        onChange={e => setPayTxRef(e.target.value)}
                        placeholder="e.g. UPI820182018"
                        className="w-full bg-bg-card border border-border-primary rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-accent-orange"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="font-semibold block mb-1 text-text-secondary">Remarks</label>
                      <input
                        type="text"
                        value={payRemarks}
                        onChange={e => setPayRemarks(e.target.value)}
                        placeholder="e.g. Paid via GPay"
                        className="w-full bg-bg-card border border-border-primary rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-accent-orange"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 text-[10px] font-bold pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingPayment(false)}
                      className="px-3 py-1.5 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-text-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white"
                    >
                      Save Payment
                    </button>
                  </div>
                </form>
              )}

              {/* Tabs */}
              <div className="grid grid-cols-4 gap-1 border-b border-border-secondary pb-1 text-[9px] font-bold font-mono text-center">
                {[
                  { key: 'REGISTRATION' as const, label: 'REGISTRATION' },
                  { key: 'COURSE_FEE' as const, label: 'COURSE FEE' },
                  { key: 'DOCUMENT' as const, label: 'DOCUMENT' },
                  { key: 'PLACEMENT' as const, label: 'PLACEMENT' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveFinTab(tab.key);
                      setIsAddingAdjustment(false);
                    }}
                    className={`pb-2 border-b-2 transition-all tracking-wider ${
                      activeFinTab === tab.key 
                        ? 'border-accent-orange text-text-primary' 
                        : 'border-transparent text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Fee Information Details */}
              <div className="space-y-4 text-xs">
                
                <div className="flex justify-between items-start pt-1 gap-2">
                  <div className="space-y-4 flex-1">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-text-muted flex items-center gap-1">
                        Net Payable
                        <button
                          type="button"
                          onClick={() => {
                            if (editingFeeTab === activeFinTab) {
                              setEditingFeeTab(null);
                            } else {
                              openFeeEditor(activeFinTab);
                            }
                          }}
                          title="Set Net Payable"
                          className="text-text-muted hover:text-accent-orange transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </span>
                      {financials.feeIsSet ? (
                        <span className="text-xl font-black text-text-primary">
                          ₹{financials.netPayable.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-text-muted italic">
                          Not set — use the pencil icon to configure
                        </span>
                      )}
                    </div>

                    {financials.feeIsSet && (
                      <div>
                        <span className="text-[10px] uppercase font-mono text-text-muted block">
                          Full Cost{activeFinTab !== 'PLACEMENT' ? ` (${feeConfig[activeFinTab]?.percentage ?? 100}% applied)` : ''}
                        </span>
                        <span className="text-sm font-semibold text-text-secondary">
                          ₹{(financials.fullCost || financials.baseFee).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Inline Net Payable Editor — set Full Cost + % for Registration / Course Fee / Document / Placement */}
                {editingFeeTab === activeFinTab && (
                  <div className="bg-bg-primary/50 p-2.5 rounded-lg border border-border-secondary space-y-2.5 mt-1 fade-in">
                    <div>
                      <label className="text-[10px] uppercase font-mono text-text-muted block mb-1">Full Cost (INR)</label>
                      <input
                        type="number"
                        min="0"
                        value={feeFullCostInput}
                        onChange={e => setFeeFullCostInput(e.target.value)}
                        placeholder="e.g. 45000"
                        className="w-full bg-bg-card border border-border-primary rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-accent-orange"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono text-text-muted block mb-1">Percentage of Full Cost</label>
                      <div className="flex gap-1 border border-border-primary rounded-lg p-0.5 bg-bg-card w-fit">
                        {presetFeePercentages.map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => { setFeePercentageInput(pct); setIsFeeEnteringCustomPct(false); }}
                            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                              feePercentageInput === pct && !isFeeEnteringCustomPct
                                ? 'bg-[#ff6b35] text-white'
                                : 'hover:bg-bg-hover text-text-secondary'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                        {isFeeEnteringCustomPct ? (
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={feeCustomPctValue}
                            onChange={e => setFeeCustomPctValue(e.target.value)}
                            onBlur={handleFeeCustomPctSave}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleFeeCustomPctSave();
                              if (e.key === 'Escape') setIsFeeEnteringCustomPct(false);
                            }}
                            placeholder="%"
                            autoFocus
                            className="w-12 bg-bg-primary text-text-primary text-xs font-bold text-center border-0 focus:ring-1 focus:ring-accent-orange focus:outline-none rounded py-0.5"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setIsFeeEnteringCustomPct(true);
                              setFeeCustomPctValue(
                                !presetFeePercentages.includes(feePercentageInput) ? String(feePercentageInput) : ''
                              );
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                              !presetFeePercentages.includes(feePercentageInput)
                                ? 'bg-[#ff6b35] text-white'
                                : 'hover:bg-bg-hover text-text-secondary'
                            }`}
                          >
                            {!presetFeePercentages.includes(feePercentageInput) ? `${feePercentageInput}%` : 'Custom'}
                          </button>
                        )}
                      </div>
                    </div>

                    {feeFullCostInput && !isNaN(Number(feeFullCostInput)) && (
                      <div className="text-[11px] text-text-secondary">
                        Net Payable will be{' '}
                        <strong className="text-accent-orange">
                          ₹{Math.round((Number(feeFullCostInput) * feePercentageInput) / 100).toLocaleString()}
                        </strong>{' '}
                        ({feePercentageInput}% of ₹{Number(feeFullCostInput).toLocaleString()})
                      </div>
                    )}

                    <div className="flex justify-end gap-1.5 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setEditingFeeTab(null)}
                        className="px-2.5 py-1 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-text-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveFeeConfig}
                        className="px-2.5 py-1 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Placement Screenshot Upload — shown only under PLACEMENT tab */}
                {activeFinTab === 'PLACEMENT' && (
                  <div className="space-y-2 pt-2 border-t border-border-secondary/40">
                    <span className="text-[10px] uppercase font-mono text-text-muted block">Placement Screenshot</span>
                    <input
                      ref={placementScreenshotInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePlacementScreenshotChange}
                    />
                    {placementScreenshot ? (
                      <div className="flex items-center gap-3 bg-bg-primary/50 border border-border-secondary rounded-lg p-2">
                        <img
                          src={placementScreenshot}
                          alt="Placement screenshot"
                          className="w-14 h-14 object-cover rounded border border-border-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-text-secondary truncate">
                            {placementScreenshotName || 'Uploaded screenshot'}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => window.open(placementScreenshot, '_blank')}
                              className="text-[9px] font-bold text-accent-orange hover:underline flex items-center gap-0.5"
                            >
                              <Eye className="w-3 h-3" /> VIEW
                            </button>
                            <button
                              type="button"
                              onClick={() => placementScreenshotInputRef.current?.click()}
                              className="text-[9px] font-bold text-text-muted hover:text-text-secondary flex items-center gap-0.5"
                            >
                              <RefreshCw className="w-3 h-3" /> REPLACE
                            </button>
                            <button
                              type="button"
                              onClick={handleRemovePlacementScreenshot}
                              className="text-[9px] font-bold text-red-400 hover:text-red-300 flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3 h-3" /> REMOVE
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => placementScreenshotInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold px-2 py-2.5 rounded-lg border border-dashed border-border-primary hover:border-accent-orange hover:bg-accent-orange/5 text-text-muted hover:text-accent-orange transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" /> UPLOAD SCREENSHOT
                      </button>
                    )}
                  </div>
                )}

                {/* Adjustments Sub-section */}
                <div className="space-y-2 pt-2 border-t border-border-secondary/40">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-mono text-text-muted">Adjustments</span>
                    {!isAddingAdjustment && (
                      <button 
                        onClick={() => setIsAddingAdjustment(true)}
                        className="text-[9px] font-mono text-accent-orange hover:underline font-semibold"
                      >
                        + ADD ADJUSTMENT
                      </button>
                    )}
                  </div>

                  {isAddingAdjustment && (
                    <form onSubmit={handleAddAdjustment} className="bg-bg-primary/50 p-2.5 rounded-lg border border-border-secondary space-y-2 mt-1 fade-in">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsAddingAdjustment(false)}
                          className="p-0.5 hover:bg-bg-hover rounded-full -mt-1 -mr-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input 
                          type="number"
                          required
                          placeholder="Amount"
                          value={adjAmount}
                          onChange={e => setAdjAmount(e.target.value)}
                          className="bg-bg-card border border-border-primary rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-accent-orange"
                        />
                        <input 
                          type="text"
                          required
                          placeholder="Label"
                          value={adjDesc}
                          onChange={e => setAdjDesc(e.target.value)}
                          className="bg-bg-card border border-border-primary rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-accent-orange"
                        />
                      </div>
                      <textarea
                        required
                        placeholder="Reason required (e.g., Branch Manager approved corporate waiver)"
                        value={adjReason}
                        onChange={e => setAdjReason(e.target.value)}
                        rows={2}
                        className="w-full bg-bg-card border border-border-primary rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-accent-orange resize-none"
                      />
                      <button 
                        type="submit" 
                        className="w-full py-1.5 bg-accent-orange hover:bg-accent-orangeHover text-white rounded-lg text-[10px] font-bold uppercase tracking-wider"
                      >
                        Apply
                      </button>
                    </form>
                  )}

                  <div className="space-y-1">
                    {financials.adjustmentsList.map(a => (
                      <div key={a.id} title={a.reason} className="flex justify-between items-center text-[11px] bg-bg-primary/20 px-2 py-1 rounded border border-border-primary/30">
                        <span className="text-text-secondary">{a.description}</span>
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span className={a.amount < 0 ? 'text-green-500' : 'text-accent-orange'}>
                            {a.amount < 0 ? '-' : '+'}₹{Math.abs(a.amount).toLocaleString()}
                          </span>
                          <button 
                            onClick={() => handleRemoveAdjustment(a.id)}
                            className="text-text-muted hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {financials.adjustmentsList.length === 0 && !isAddingAdjustment && (
                      <span className="text-[11px] text-text-muted italic block">No adjustments applied.</span>
                    )}
                  </div>
                </div>

                {/* Tab Transaction History */}
                <div className="space-y-2 pt-2 border-t border-border-secondary/40">
                  <span className="text-[10px] uppercase font-mono text-text-muted block">Payment History</span>
                  
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {financials.history.map(p => (
                      <div key={p.id} className="flex justify-between items-center text-[10px] bg-bg-primary/40 border border-border-secondary/30 px-2.5 py-1.5 rounded">
                        <div className="flex flex-col">
                          <span className="font-semibold text-green-500">₹{p.amount.toLocaleString()}</span>
                          <span className="text-text-muted text-[8px]">{p.payment_mode} ({p.payment_date})</span>
                        </div>
                        <span className="text-text-secondary font-mono text-[9px] truncate max-w-[100px]" title={p.transaction_ref}>
                          {p.transaction_ref}
                        </span>
                      </div>
                    ))}
                    {financials.history.length === 0 && (
                      <span className="text-[11px] text-text-muted italic block">No payments recorded.</span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom summary panel */}
            <div className="mt-8 border-t border-border-secondary pt-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted font-mono uppercase text-[10px]">Net Payable</span>
                <span className="font-semibold text-text-primary">
                  ₹{financials.netPayable.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted font-mono uppercase text-[10px]">Paid to Date</span>
                <span className="font-semibold text-green-500">
                  ₹{financials.paidToDate.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted font-mono uppercase text-[10px]">Pending Dues</span>
                <span className="font-bold text-red-500 text-lg">
                  ₹{financials.pendingDues.toLocaleString()}
                </span>
              </div>
            </div>

            {/* CHANGES button nestled inside the card */}
            <button 
              type="button"
              onClick={() => setIsChangesDrawerOpen(true)}
              className="absolute top-1/2 -translate-y-1/2 right-0 bg-[#ff6b35] text-white text-[10px] font-extrabold font-mono uppercase tracking-wider py-4 px-2.5 rounded-l-md cursor-pointer hover:bg-[#e05621] transition-all shadow-lg flex flex-col justify-center items-center gap-1 z-30 select-none" 
              style={{ writingMode: 'vertical-rl' }}
            >
              <History className="h-3.5 w-3.5" />
              <span>CHANGES</span>
            </button>

            {/* Slide-out Panel nestled inside the card */}
            <div
              className={`absolute inset-0 bg-bg-card border-l border-border-primary shadow-2xl z-40 transition-transform duration-300 ease-in-out flex flex-col text-text-primary p-5 ${
                isChangesDrawerOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              {/* Header */}
              <div className="pb-3 border-b border-border-secondary flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">System Change Log</h3>
                  <p className="text-[10px] text-text-muted">Changes for {candidate.full_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangesDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Filters */}
              <div className="py-3 border-b border-border-secondary space-y-2">
                {/* Search bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search actions or details..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border-primary bg-bg-card focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange/20"
                  />
                </div>

                {/* Action types horizontal scroll pills */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
                  {logActionTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLogActionFilter(type)}
                      className={`text-[8px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border whitespace-nowrap transition-all ${
                        logActionFilter === type
                          ? 'bg-accent-orange border-accent-orange text-white'
                          : 'bg-bg-card border-border-primary text-text-secondary hover:bg-bg-hover'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logs List */}
              <div className="flex-1 overflow-y-auto pt-3 space-y-2.5">
                {studentLogs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-text-muted italic">
                    No system changes match the criteria.
                  </div>
                ) : (
                  studentLogs.map(log => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-border-primary bg-bg-card shadow-sm space-y-1.5 hover:border-text-muted/30 transition-all text-[11px]"
                    >
                      {/* Meta Row: Action Badge & Time */}
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-mono border font-semibold ${getActionColor(log.action)}`}>
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-[9px] text-text-muted flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatTimestamp(log.created_at)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-text-primary leading-relaxed font-medium">
                        {log.description}
                      </p>

                      {/* User Metadata */}
                      <div className="flex items-center justify-between text-[9px] text-text-secondary bg-bg-secondary/40 px-1.5 py-0.5 rounded border border-border-secondary">
                        <span className="flex items-center gap-1">
                          <User className="h-2.5 w-2.5 text-text-muted" />
                          By: <strong className="text-text-primary">{log.user_name}</strong>
                        </span>
                        <span className="font-mono text-text-muted text-[8px]">{log.ip_address}</span>
                      </div>

                      {/* Expandable Old/New Diffs if present */}
                      {(log.old_value || log.new_value) && (
                        <div className="mt-1 space-y-0.5 bg-bg-secondary/20 p-1.5 rounded border border-border-secondary font-mono text-[8px] overflow-x-auto">
                          {log.old_value && (
                            <div className="text-red-600 dark:text-red-400 flex items-start gap-1">
                              <span className="font-semibold">-</span>
                              <span>{log.old_value}</span>
                            </div>
                          )}
                          {log.new_value && (
                            <div className="text-green-600 dark:text-green-400 flex items-start gap-1">
                              <span className="font-semibold">+</span>
                              <span>{log.new_value}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3. MODALS IMPLEMENTATIONS */}

      {/* GLOBAL EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 overflow-y-auto">
          <form 
            onSubmit={handleSaveProfile}
            className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-xl shadow-2xl text-text-primary space-y-4 my-8 fade-in"
          >
            <div className="flex justify-between items-center border-b border-border-secondary pb-3">
              <div>
                <h3 className="font-bold text-lg">Global Edit: {candidate.full_name}</h3>
                <p className="text-[11px] text-text-muted">Modify student details, placements, and verification info.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)} 
                className="p-1 hover:bg-bg-hover rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Full Name *</label>
                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Phone Number *</label>
                <input type="text" required value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Email Address *</label>
                <input type="email" required value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Alternate Contact</label>
                <input type="text" value={editAltPhone} onChange={e => setEditAltPhone(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Date of Birth</label>
                <input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange text-text-secondary" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Father Name</label>
                <input type="text" value={editFatherName} onChange={e => setEditFatherName(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1">Address</label>
                <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Pincode</label>
                <input type="text" value={editPincode} onChange={e => setEditPincode(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Branch</label>
                <input type="text" value={editBranch} onChange={e => setEditBranch(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Course Domain</label>
                <input type="text" value={editCourse} onChange={e => setEditCourse(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input type="checkbox" checked={editWorking} onChange={e => setEditWorking(e.target.checked)} className="rounded text-accent-orange focus:ring-accent-orange" />
                  <span>Currently Working</span>
                </label>
              </div>

              <div className="sm:col-span-2 border-t border-border-secondary pt-3 mt-1">
                <h4 className="font-bold text-accent-orange mb-2 text-xs uppercase tracking-wide">Corporate Placement Info</h4>
              </div>

              <div>
                <label className="font-semibold block mb-1">Placement Company</label>
                <input type="text" value={editCompany} onChange={e => setEditCompany(e.target.value)} placeholder="e.g. Zoho Corporation" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Designation</label>
                <input type="text" value={editDesignation} onChange={e => setEditDesignation(e.target.value)} placeholder="e.g. Software Associate" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Annual CTC (INR)</label>
                <input type="number" value={editCtc} onChange={e => setEditCtc(e.target.value)} placeholder="e.g. 450000" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Placement Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value as Candidate['placement_status'])} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange text-text-secondary">
                  <option value="NOT_PLACED">Not Placed</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-secondary pt-4">
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                className="px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white text-xs font-semibold"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {uploadTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <form 
            onSubmit={handleUploadSubmit}
            className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-md shadow-2xl text-text-primary space-y-4 fade-in"
          >
            <div className="flex justify-between items-center border-b border-border-secondary pb-3">
              <h3 className="font-bold text-lg">Upload Document: {uploadTarget.label}</h3>
              <button 
                type="button" 
                onClick={() => setUploadTarget(null)} 
                className="p-1 hover:bg-bg-hover rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Document Category</label>
                <input 
                  type="text" 
                  disabled 
                  value={uploadTarget.category === 'received' ? 'Received Document' : 'Applied Document'} 
                  className="w-full bg-bg-primary/50 border border-border-primary rounded-lg px-3 py-2 text-sm text-text-muted select-none focus:outline-none" 
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">File Name *</label>
                <input 
                  type="text" 
                  required 
                  value={uploadFileName} 
                  onChange={e => setUploadFileName(e.target.value)} 
                  className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" 
                />
              </div>

              {/* Simulated Upload drag/drop area */}
              <div 
                className="border-2 border-dashed border-border-primary hover:border-accent-orange/45 rounded-xl p-6 text-center space-y-2 cursor-pointer transition-all bg-bg-secondary/20 relative"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <Upload className="h-8 w-8 text-text-muted mx-auto" />
                <span className="text-[11px] text-text-secondary block">Click to select files or drag-and-drop</span>
                <span className="text-[9px] text-text-muted block">PDF, PNG, JPG up to 10MB</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-secondary pt-4">
              <button 
                type="button" 
                onClick={() => setUploadTarget(null)} 
                className="px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white text-xs font-semibold"
              >
                Upload File
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
