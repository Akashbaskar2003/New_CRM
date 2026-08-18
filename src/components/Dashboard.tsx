import React, { useState } from 'react';
import { useCRMStore } from '../store/crmStore';
import type { Candidate } from '../store/crmStore';
import { Users, UserPlus, CheckCircle, IndianRupee, Search, Mail, Send, Activity, ShieldAlert, X, Upload } from 'lucide-react';
import { StudentDetailView } from './StudentDetailView';

export const Dashboard: React.FC = () => {
  const {
    candidates,
    payments,
    auditLogs,
    currentUser,
    updateCandidate,
    approveCandidate,
    rejectCandidate,
    addPayment,
    addDocument,
    setActiveTab,
    setSelectedCandidateId
  } = useCRMStore();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Custom Filter Pills
  const [formPendingOnly, setFormPendingOnly] = useState(false);
  const [bgvClearedOnly, setBgvClearedOnly] = useState(false);
  const [hasDuesOnly, setHasDuesOnly] = useState(false);

  // Workflow Dispatcher States
  const [workflowEmail, setWorkflowEmail] = useState('');
  const [workflowType, setWorkflowType] = useState<'NEW_REG' | 'DP_REG' | 'BGV' | 'DP_BGV' | 'CONTACT'>('NEW_REG');

  // Interactive Modal States
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form Fields for Modals
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [ctc, setCtc] = useState('');
  const [collectionPercentage, setCollectionPercentage] = useState(10);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [txRef, setTxRef] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [docType, setDocType] = useState('OFFER_LETTER');
  const [docName, setDocName] = useState('');

  // 1. FILTER CANDIDATES BASED ON ACTIVE ROLE & ISOLATION
  const getVisibleCandidates = () => {
    let list = candidates;
    // Team Isolation: Team Leads can only see their own team's candidates
    if (currentUser.role === 'TEAM_LEAD' && currentUser.team_id) {
      list = candidates.filter(c => c.team_id === currentUser.team_id);
    }
    return list;
  };

  const visibleCandidates = getVisibleCandidates();

  // 2. METRICS CALCULATIONS
  const totalCandidatesCount = visibleCandidates.length;
  
  // New Joinees = Training candidates who haven't completed BGV details yet
  const newJoineesCount = visibleCandidates.filter(
    c => c.candidate_type === 'TRAINING' && !c.date_of_birth
  ).length;

  // Placed Candidates
  const placedCandidatesCount = visibleCandidates.filter(
    c => c.placement_status === 'APPROVED' || c.placement_status === 'PENDING_APPROVAL'
  ).length;

  // Revenue Received for visible candidates
  const visibleCandidateIds = new Set(visibleCandidates.map(c => c.id));
  const revenueReceived = payments
    .filter(p => visibleCandidateIds.has(p.candidate_id))
    .reduce((sum, p) => sum + p.amount, 0);

  // Pending Dues for visible candidates
  const pendingDues = visibleCandidates.reduce((sum, c) => sum + c.pending_amount, 0);

  // 3. EXTRACT DROP-DOWN FILTER VALUES DYNAMICALLY
  const branches = ['ALL', ...Array.from(new Set(visibleCandidates.map(c => c.branch)))];
  const courses = ['ALL', ...Array.from(new Set(visibleCandidates.map(c => c.course)))];

  // 4. APPLY SEARCH & FILTER CONTROLS
  const filteredCandidates = visibleCandidates.filter(c => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidate_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.batch && c.batch.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBranch = branchFilter === 'ALL' || c.branch === branchFilter;
    const matchesCourse = courseFilter === 'ALL' || c.course === courseFilter;
    
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PLACED') {
        matchesStatus = c.placement_status === 'APPROVED';
      } else if (statusFilter === 'PENDING_APPROVAL') {
        matchesStatus = c.placement_status === 'PENDING_APPROVAL';
      } else if (statusFilter === 'NOT_PLACED') {
        matchesStatus = c.placement_status === 'NOT_PLACED';
      }
    }

    // Filter pills logic
    const matchesFormPending = !formPendingOnly || !c.date_of_birth; // No DOB means BGV form pending
    const matchesBgvCleared = !bgvClearedOnly || !!c.date_of_birth;  // Has DOB means BGV submitted
    const matchesHasDues = !hasDuesOnly || c.pending_amount > 0;

    return matchesSearch && matchesBranch && matchesCourse && matchesStatus && matchesFormPending && matchesBgvCleared && matchesHasDues;
  });

  // 5. HANDLERS
  const handleDispatchWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowEmail) return;

    // Simulate sending email notification
    alert(`Branded email workflow dispatched successfully to ${workflowEmail}`);
    
    // Log the event in Zustand store
    useCRMStore.getState().addCandidate({
      full_name: workflowEmail.split('@')[0],
      email: workflowEmail,
      phone: '',
      course: 'Pending Registration',
      branch: 'Online',
      batch: 'Pending Batch',
      candidate_type: workflowType.includes('DP') ? 'DIRECT_PLACEMENT' : 'TRAINING',
      placement_status: 'NOT_PLACED'
    });

    setWorkflowEmail('');
  };

  const handleOpenDetailModal = (candidate: Candidate) => {
    if (candidate.candidate_type === 'DIRECT_PLACEMENT') {
      setActiveTab('DIRECT_PLACEMENT');
      setSelectedCandidateId(candidate.id);
    } else {
      setSelectedCandidate(candidate);
      setIsDetailModalOpen(true);
    }
  };



  const handleSubmitPlacement = () => {
    if (!selectedCandidate || !companyName || !designation || !ctc) return;
    
    updateCandidate(selectedCandidate.id, {
      placement_company: companyName,
      designation: designation,
      annual_ctc: Number(ctc),
      placement_status: 'PENDING_APPROVAL'
    });

    // Mock upload of initial offer letter
    addDocument({
      candidate_id: selectedCandidate.id,
      doc_type: 'OFFER_LETTER',
      file_name: `${companyName.replace(/\s+/g, '_')}_Offer_Letter.pdf`,
      file_url: '#',
      uploaded_by: currentUser.id
    });

    setIsPlacementModalOpen(false);
    setSelectedCandidate(null);
  };



  const handleApprove = () => {
    if (!selectedCandidate) return;
    approveCandidate(selectedCandidate.id, collectionPercentage);
    setIsApprovalModalOpen(false);
    setSelectedCandidate(null);
  };

  const handleReject = () => {
    if (!selectedCandidate) return;
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      rejectCandidate(selectedCandidate.id, reason);
    }
    setIsApprovalModalOpen(false);
    setSelectedCandidate(null);
  };



  const handleSubmitPayment = () => {
    if (!selectedCandidate || !paymentAmount) return;
    addPayment({
      candidate_id: selectedCandidate.id,
      amount: Number(paymentAmount),
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: paymentMode,
      transaction_ref: txRef || `TXN${Date.now()}`,
      collected_by: currentUser.full_name,
      remarks: paymentRemarks || 'Installment Payment'
    });
    setIsPaymentModalOpen(false);
    setSelectedCandidate(null);
  };



  const handleSubmitDoc = () => {
    if (!selectedCandidate || !docName) return;
    addDocument({
      candidate_id: selectedCandidate.id,
      doc_type: docType,
      file_name: docName,
      file_url: '#',
      uploaded_by: currentUser.id
    });
    setIsDocModalOpen(false);
    setSelectedCandidate(null);
  };

  if (isDetailModalOpen && selectedCandidate) {
    return (
      <StudentDetailView
        candidate={selectedCandidate}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCandidate(null);
          setSelectedCandidateId(null);
        }}
        breadcrumbSource="Dashboard"
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 fade-in">
      
      {/* 1. Header Hero section */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-text-primary">
          Command Center
        </h1>
        <p className="text-sm text-text-secondary max-w-lg mx-auto">
          Enter a student email to begin registration workflows, or query matching candidates below.
        </p>
      </div>

      {/* 2. KPI Cards Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Candidates */}
        <div className="rounded-xl border border-border-primary bg-bg-card p-5 shadow-premium flex items-center gap-4">
          <div className="p-3 rounded-lg bg-bg-secondary text-text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted">Total Candidates</div>
            <div className="text-2xl font-bold">{totalCandidatesCount}</div>
          </div>
        </div>

        {/* New Joinees */}
        <div className="rounded-xl border border-border-primary bg-bg-card p-5 shadow-premium flex items-center gap-4">
          <div className="p-3 rounded-lg bg-bg-secondary text-text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted">New Joinees</div>
            <div className="text-2xl font-bold text-accent-orange">{newJoineesCount}</div>
          </div>
        </div>

        {/* Placed Candidates */}
        <div className="rounded-xl border border-border-primary bg-bg-card p-5 shadow-premium flex items-center gap-4">
          <div className="p-3 rounded-lg bg-bg-secondary text-text-primary">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted">Placed Candidates</div>
            <div className="text-2xl font-bold">{placedCandidatesCount}</div>
          </div>
        </div>

        {/* Revenue Received */}
        <div className="rounded-xl border border-border-primary bg-bg-card p-5 shadow-premium flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted">Revenue Received</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">₹{revenueReceived.toLocaleString()}</div>
          </div>
        </div>

        {/* Pending Dues */}
        <div className="rounded-xl border border-border-primary bg-bg-card p-5 shadow-premium flex items-center gap-4 col-span-2 lg:col-span-1">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted">Pending Dues</div>
            <div className="text-2xl font-bold text-red-500 dark:text-red-400">₹{pendingDues.toLocaleString()}</div>
          </div>
        </div>

      </div>

      {/* 3. Search & Advanced Filtering Console */}
      <div className="rounded-2xl border border-border-primary bg-bg-card p-5 shadow-glass space-y-4">
        
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Main search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search by Student Name, Code, Batch, Email, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-primary bg-bg-primary text-sm focus:outline-none focus:border-accent-orange focus:ring-2 focus:ring-accent-orange/15 shadow-inner"
            />
          </div>

          {/* Filtering selectors */}
          <div className="grid grid-cols-3 gap-2">
            
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-accent-orange text-text-secondary"
            >
              <option value="ALL">All Branches</option>
              {branches.filter(b => b !== 'ALL').map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-accent-orange text-text-secondary"
            >
              <option value="ALL">All Courses</option>
              {courses.filter(c => c !== 'ALL').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-bg-primary border border-border-primary rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-accent-orange text-text-secondary"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_PLACED">Training (Unplaced)</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="PLACED">Placed & Approved</option>
            </select>

          </div>

        </div>

        {/* Filter pills togglers */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-secondary">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted mr-2">Filters:</span>
          
          <button
            onClick={() => setFormPendingOnly(!formPendingOnly)}
            className={`text-xs px-3.5 py-1.5 rounded-full border font-semibold transition-all ${
              formPendingOnly
                ? 'bg-accent-orange border-accent-orange text-white'
                : 'bg-bg-secondary border-border-primary text-text-secondary hover:bg-bg-hover'
            }`}
          >
            📋 BGV Pending
          </button>

          <button
            onClick={() => setBgvClearedOnly(!bgvClearedOnly)}
            className={`text-xs px-3.5 py-1.5 rounded-full border font-semibold transition-all ${
              bgvClearedOnly
                ? 'bg-accent-orange border-accent-orange text-white'
                : 'bg-bg-secondary border-border-primary text-text-secondary hover:bg-bg-hover'
            }`}
          >
            🛡️ BGV Completed
          </button>

          <button
            onClick={() => setHasDuesOnly(!hasDuesOnly)}
            className={`text-xs px-3.5 py-1.5 rounded-full border font-semibold transition-all ${
              hasDuesOnly
                ? 'bg-accent-orange border-accent-orange text-white'
                : 'bg-bg-secondary border-border-primary text-text-secondary hover:bg-bg-hover'
            }`}
          >
            💸 Has Outstanding Dues
          </button>
        </div>

      </div>

      {/* 4. Student Listings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg uppercase tracking-wide text-text-secondary">
            Students Database ({filteredCandidates.length})
          </h3>
        </div>

        {filteredCandidates.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border-primary p-12 text-center space-y-4 bg-bg-card/50">
            <div className="mx-auto h-12 w-12 rounded-full bg-accent-orange/10 flex items-center justify-center text-accent-orange">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-base">No candidates loaded / matched</h4>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                No profiles match your search criteria. Verify filters or click manually sync.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCandidates.map(candidate => (
              <div
                key={candidate.id}
                onClick={() => handleOpenDetailModal(candidate)}
                className="rounded-xl border border-border-primary bg-bg-card p-4 shadow-premium cursor-pointer hover:border-accent-orange/50 hover:shadow-glass transition-all duration-200 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-[9px] font-bold font-mono tracking-wider bg-bg-secondary text-text-secondary border border-border-primary px-2 py-0.5 rounded-md">
                    {candidate.candidate_code}
                  </span>
                  <h4 className="font-bold text-sm mt-1.5 text-text-primary truncate">{candidate.full_name}</h4>
                </div>
                <span className={`shrink-0 text-[9px] font-bold font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                  candidate.placement_status === 'APPROVED'
                    ? 'bg-green-100 border-green-200 text-green-800 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/50'
                    : candidate.placement_status === 'PENDING_APPROVAL'
                    ? 'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
                    : candidate.placement_status === 'REJECTED'
                    ? 'bg-red-100 border-red-200 text-red-800 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50'
                    : 'bg-gray-100 border-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                }`}>
                  {candidate.placement_status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Dispatch New Workflow Module */}
      <div className="rounded-2xl border border-border-primary bg-bg-card p-6 shadow-premium space-y-4">
        <h3 className="font-bold text-lg uppercase tracking-wide text-text-secondary flex items-center gap-2">
          <Send className="h-5 w-5 text-accent-orange" />
          Dispatch New Workflow
        </h3>
        
        <form onSubmit={handleDispatchWorkflow} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-5 w-5 text-text-muted" />
            <input
              type="email"
              required
              placeholder="Enter candidate email address..."
              value={workflowEmail}
              onChange={(e) => setWorkflowEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-primary bg-bg-primary text-sm focus:outline-none focus:border-accent-orange focus:ring-2 focus:ring-accent-orange/15 shadow-inner"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            
            {/* Form Picker Pills */}
            <div className="flex flex-wrap gap-1.5">
              
              <button
                type="button"
                onClick={() => setWorkflowType('NEW_REG')}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border transition-all ${
                  workflowType === 'NEW_REG'
                    ? 'bg-accent-orange border-accent-orange text-white'
                    : 'bg-bg-secondary border-border-primary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                📝 New Reg Form
              </button>

              <button
                type="button"
                onClick={() => setWorkflowType('DP_REG')}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border transition-all ${
                  workflowType === 'DP_REG'
                    ? 'bg-accent-orange border-accent-orange text-white'
                    : 'bg-bg-secondary border-border-primary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                📄 DP Reg Form
              </button>

              <button
                type="button"
                onClick={() => setWorkflowType('BGV')}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border transition-all ${
                  workflowType === 'BGV'
                    ? 'bg-accent-orange border-accent-orange text-white'
                    : 'bg-bg-secondary border-border-primary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                🛡️ BGV Form
              </button>

              <button
                type="button"
                onClick={() => setWorkflowType('DP_BGV')}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border transition-all ${
                  workflowType === 'DP_BGV'
                    ? 'bg-accent-orange border-accent-orange text-white'
                    : 'bg-bg-secondary border-border-primary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                🔒 DP BGV Form
              </button>

              <button
                type="button"
                onClick={() => setWorkflowType('CONTACT')}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border transition-all ${
                  workflowType === 'CONTACT'
                    ? 'bg-accent-orange border-accent-orange text-white'
                    : 'bg-bg-secondary border-border-primary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                ✉️ Contact Mail
              </button>

            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-accent-green hover:bg-accent-greenHover text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg active:scale-95 transition-all shadow"
            >
              <Send className="h-4 w-4" /> Send Workflow
            </button>

          </div>
        </form>
      </div>

      {/* 6. System Change Log Card (Quick View) */}
      <div className="rounded-2xl border border-border-primary bg-bg-card p-6 shadow-premium space-y-4">
        <h3 className="font-bold text-lg uppercase tracking-wide text-text-secondary flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent-orange" />
          System Change Log
        </h3>
        
        <div className="border border-border-primary rounded-xl divide-y divide-border-secondary overflow-hidden bg-bg-card">
          {auditLogs.slice(0, 3).map(log => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
              <div>
                <span className="font-bold text-text-primary">{log.description}</span>
                <span className="text-text-muted block text-[10px] mt-0.5">By {log.user_name} on {new Date(log.created_at).toLocaleString()}</span>
              </div>
              <span className="text-[10px] font-mono bg-bg-secondary border border-border-primary text-text-secondary px-2.5 py-0.5 rounded shrink-0 self-start sm:self-center">
                {log.action}
              </span>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div className="p-6 text-center text-xs text-text-muted">No system changes recorded yet.</div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------------------------------ */}
      {/* MODALS IMPLEMENTATIONS */}
      {/* ------------------------------------------------------------------------------------------ */}

      {/* 0. Student Detail Screen replacing old modal */}

      {/* A. Register Placement Details Modal */}
      {isPlacementModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-md shadow-2xl text-text-primary space-y-4 fade-in">
            <div className="flex justify-between items-center border-b border-border-secondary pb-3">
              <h3 className="font-bold text-lg">Register Placement: {selectedCandidate.full_name}</h3>
              <button onClick={() => setIsPlacementModalOpen(false)} className="p-1 hover:bg-bg-hover rounded-full"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Company Name</label>
                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Zoho Corporation" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Designation</label>
                <input type="text" required value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Software Engineer" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Annual CTC (INR)</label>
                <input type="number" required value={ctc} onChange={e => setCtc(e.target.value)} placeholder="e.g. 600000" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-secondary pt-4">
              <button onClick={() => setIsPlacementModalOpen(false)} className="px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-xs font-semibold">Cancel</button>
              <button onClick={handleSubmitPlacement} className="px-4 py-2 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white text-xs font-semibold">Submit Placement</button>
            </div>
          </div>
        </div>
      )}

      {/* B. Review & Approve Placement Modal */}
      {isApprovalModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-md shadow-2xl text-text-primary space-y-4 fade-in">
            <div className="flex justify-between items-center border-b border-border-secondary pb-3">
              <h3 className="font-bold text-lg">Approve Placement - Review</h3>
              <button onClick={() => setIsApprovalModalOpen(false)} className="p-1 hover:bg-bg-hover rounded-full"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-3 text-xs bg-bg-secondary/40 p-4 rounded-xl border border-border-secondary">
              <div className="flex justify-between"><span>Candidate Code:</span><span className="font-bold">{selectedCandidate.candidate_code}</span></div>
              <div className="flex justify-between"><span>Full Name:</span><span className="font-bold">{selectedCandidate.full_name}</span></div>
              <div className="flex justify-between"><span>Company:</span><span className="font-bold text-accent-orange">{selectedCandidate.placement_company}</span></div>
              <div className="flex justify-between"><span>Designation:</span><span className="font-bold">{selectedCandidate.designation}</span></div>
              <div className="flex justify-between"><span>Annual CTC:</span><span className="font-bold text-green-600 dark:text-green-400">₹{(selectedCandidate.annual_ctc || 0).toLocaleString()}</span></div>
              <div className="flex justify-between items-center border-t border-border-secondary pt-2.5 mt-2">
                <span className="font-semibold text-text-primary">Verify Offer Letter:</span>
                <span className="bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border border-green-200 px-2 py-0.5 rounded font-mono text-[10px]">Verified PDF</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold block">Define Collection Percentage (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={collectionPercentage}
                  onChange={e => setCollectionPercentage(Number(e.target.value))}
                  placeholder="e.g. 7"
                  className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-accent-orange"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-semibold">%</span>
              </div>
              <div className="text-[10px] text-text-muted mt-1.5 bg-bg-secondary/40 border border-border-secondary rounded-lg px-3 py-2">
                Calculated Payable: <strong className="text-text-primary">₹{((selectedCandidate.annual_ctc || 0) * collectionPercentage / 100).toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex justify-between gap-2 border-t border-border-secondary pt-4">
              <button onClick={handleReject} className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold">Reject</button>
              <div className="flex gap-2">
                <button onClick={() => setIsApprovalModalOpen(false)} className="px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-xs font-semibold">Cancel</button>
                <button onClick={handleApprove} className="px-4 py-2 rounded-lg bg-accent-green hover:bg-accent-greenHover text-white text-xs font-semibold">Approve & Freeze</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* C. Record Installment Payment Modal */}
      {isPaymentModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-md shadow-2xl text-text-primary space-y-4 fade-in">
            <div className="flex justify-between items-center border-b border-border-secondary pb-3">
              <h3 className="font-bold text-lg">Record Installment: {selectedCandidate.full_name}</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 hover:bg-bg-hover rounded-full"><X className="h-5 w-5" /></button>
            </div>

            <div className="text-xs bg-bg-secondary p-3 rounded-lg flex justify-between">
              <span>Remaining Balance:</span>
              <strong className="text-red-500 font-mono">₹{selectedCandidate.pending_amount.toLocaleString()}</strong>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Installment Amount (INR)</label>
                <input type="number" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="e.g. 20000" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Payment Mode</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange text-text-secondary">
                  <option value="UPI">UPI (GPay / PhonePe)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Transaction Ref ID / Bank Proof</label>
                <input type="text" value={txRef} onChange={e => setTxRef(e.target.value)} placeholder="e.g. UPI808129038" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Remarks</label>
                <input type="text" value={paymentRemarks} onChange={e => setPaymentRemarks(e.target.value)} placeholder="e.g. 2nd Installment paid" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-secondary pt-4">
              <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-xs font-semibold">Cancel</button>
              <button onClick={handleSubmitPayment} className="px-4 py-2 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white text-xs font-semibold">Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* D. Upload Document Modal */}
      {isDocModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-md shadow-2xl text-text-primary space-y-4 fade-in">
            <div className="flex justify-between items-center border-b border-border-secondary pb-3">
              <h3 className="font-bold text-lg">Upload Document: {selectedCandidate.full_name}</h3>
              <button onClick={() => setIsDocModalOpen(false)} className="p-1 hover:bg-bg-hover rounded-full"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Document Type</label>
                <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange text-text-secondary">
                  <option value="OFFER_LETTER">Offer Letter (Mandatory)</option>
                  <option value="SALARY_SLIP">Salary Slip</option>
                  <option value="JOINING_LETTER">Joining Letter</option>
                  <option value="EXPERIENCE_LETTER">Experience Letter</option>
                  <option value="BGV">BGV Document</option>
                  <option value="RECEIPT">Payment Receipt</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">File Name</label>
                <input type="text" required value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Infosys_Offer_Letter.pdf" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              {/* Simulated Upload drag/drop area */}
              <div className="border-2 border-dashed border-border-primary hover:border-accent-orange/45 rounded-xl p-6 text-center space-y-2 cursor-pointer transition-all bg-bg-secondary/20">
                <Upload className="h-8 w-8 text-text-muted mx-auto" />
                <span className="text-[11px] text-text-secondary block">Click to select files or drag-and-drop</span>
                <span className="text-[9px] text-text-muted block">PDF, PNG, JPG up to 10MB</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-secondary pt-4">
              <button onClick={() => setIsDocModalOpen(false)} className="px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-xs font-semibold">Cancel</button>
              <button onClick={handleSubmitDoc} className="px-4 py-2 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white text-xs font-semibold">Upload Attachment</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
