import React, { useState, useEffect } from 'react';
import { useCRMStore } from '../store/crmStore';
import type { Candidate, TeamCode } from '../store/crmStore';
import { Users, IndianRupee, Search, RefreshCw, Plus, X } from 'lucide-react';
import { StudentDetailView } from './StudentDetailView';

export const DirectPlacement: React.FC = () => {
  const {
    candidates,
    payments,
    currentUser,
    isSyncing,
    triggerSync,
    addCandidate,
    approveCandidate,
    rejectCandidate,
    addPayment,
    addDocument,
    selectedCandidateId,
    setSelectedCandidateId,
    auditLogs
  } = useCRMStore();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bgvFilter, setBgvFilter] = useState('ALL');
  const [expFilter, setExpFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('');
  const [yopFilter, setYopFilter] = useState('');

  // Modals Toggles
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (selectedCandidateId) {
      const match = candidates.find(c => c.id === selectedCandidateId);
      if (match) {
        setSelectedCandidate(match);
        setIsDetailModalOpen(true);
      }
    }
  }, [selectedCandidateId, candidates]);

  // New Placement Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('Chennai');
  const [course, setCourse] = useState('Java Full Stack');
  const batch = 'Direct Placement';
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [ctc, setCtc] = useState('');
  const [expType, setExpType] = useState('Experienced (1-2 Years)');
  const yop = '2025';
  const [initialPaid, setInitialPaid] = useState('');
  
  // Document checklist
  const [hasOffer, setHasOffer] = useState(true);
  const [hasRelieving, setHasRelieving] = useState(false);
  const [hasPf, setHasPf] = useState(false);
  const [hasPayslip, setHasPayslip] = useState(false);

  // Approval & Payment Form States
  const [collectionPercentage, setCollectionPercentage] = useState(10);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [txRef, setTxRef] = useState('');
  const [remarks, setRemarks] = useState('');

  // 1. FILTER CANDIDATES BASED ON TEAM & CLASSIFICATION
  const getDPCandidates = () => {
    // Only candidates of type DIRECT_PLACEMENT (or placed training candidates)
    let list = candidates.filter(c => c.candidate_type === 'DIRECT_PLACEMENT' || c.placement_company);
    
    // Team Isolation
    if (currentUser.role === 'TEAM_LEAD' && currentUser.team_id) {
      list = list.filter(c => c.team_id === currentUser.team_id);
    }
    return list;
  };

  const dpCandidates = getDPCandidates();

  // 2. METRICS FOR DIRECT PLACEMENTS
  const totalPlacements = dpCandidates.length;
  const placedApprovedCount = dpCandidates.filter(c => c.placement_status === 'APPROVED').length;
  const pendingBgvCount = dpCandidates.filter(c => !c.date_of_birth).length;

  const dpCandidateIds = new Set(dpCandidates.map(c => c.id));
  const revenueSum = payments
    .filter(p => dpCandidateIds.has(p.candidate_id))
    .reduce((sum, p) => sum + p.amount, 0);

  const duesSum = dpCandidates.reduce((sum, c) => sum + c.pending_amount, 0);

  // 3. APPLY SEARCH AND EXTENDED FILTERS
  const filteredDP = dpCandidates.filter(c => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidate_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.placement_company && c.placement_company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.designation && c.designation.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || c.placement_status === statusFilter;

    const matchesBGV =
      bgvFilter === 'ALL' ||
      (bgvFilter === 'COMPLETED' ? !!c.date_of_birth : !c.date_of_birth);

    const matchesExp =
      expFilter === 'ALL' ||
      (expFilter === 'FRESHER' ? c.experience_type?.toLowerCase().includes('fresher') : !c.experience_type?.toLowerCase().includes('fresher'));

    const matchesPayment =
      paymentFilter === 'ALL' || c.payment_status === paymentFilter;

    const matchesCompany =
      !companyFilter || c.placement_company?.toLowerCase().includes(companyFilter.toLowerCase());

    const matchesYOP =
      !yopFilter || c.year_of_passing?.includes(yopFilter);

    return matchesSearch && matchesStatus && matchesBGV && matchesExp && matchesPayment && matchesCompany && matchesYOP;
  });

  // 4. SUBMIT INTERNAL DIRECT PLACEMENT ENTRY
  const handleAddPlacement = () => {
    if (!name || !phone || !company || !ctc) {
      alert('Please fill out Name, Phone, Company, and CTC fields.');
      return;
    }

    // Capture mapped team lead's team or fallback to course analysis
    const targetTeam: TeamCode = (currentUser.role === 'TEAM_LEAD' && currentUser.team_id) 
      ? currentUser.team_id 
      : (course.toLowerCase().includes('python') ? 'PYTHON' : course.toLowerCase().includes('net') ? 'DOTNET' : course.toLowerCase().includes('support') ? 'SUPPORT' : 'JAVA');

    const newCandId = addCandidate({
      full_name: name,
      phone: phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@uniq-candidate.com`,
      branch: branch,
      course: course,
      batch: batch,
      placement_company: company,
      designation: designation || 'Associate Engineer',
      annual_ctc: Number(ctc),
      experience_type: expType,
      year_of_passing: yop,
      candidate_type: 'DIRECT_PLACEMENT',
      team_id: targetTeam,
      total_paid: Number(initialPaid) || 0
    });

    // Upload selected documents mock
    if (hasOffer) addDocument({ candidate_id: newCandId, doc_type: 'OFFER_LETTER', file_name: `${company}_Offer_${name.replace(/\s+/g, '_')}.pdf`, file_url: '#', uploaded_by: currentUser.id });
    if (hasRelieving) addDocument({ candidate_id: newCandId, doc_type: 'RELIEVING_LETTER', file_name: `${name.replace(/\s+/g, '_')}_Relieving.pdf`, file_url: '#', uploaded_by: currentUser.id });
    if (hasPf) addDocument({ candidate_id: newCandId, doc_type: 'PF_SERVICE_HISTORY', file_name: `${name.replace(/\s+/g, '_')}_PF_History.pdf`, file_url: '#', uploaded_by: currentUser.id });
    if (hasPayslip) addDocument({ candidate_id: newCandId, doc_type: 'PAYSLIP', file_name: `${name.replace(/\s+/g, '_')}_Payslip.pdf`, file_url: '#', uploaded_by: currentUser.id });

    // If initial paid is greater than 0, create payment record
    if (Number(initialPaid) > 0) {
      addPayment({
        candidate_id: newCandId,
        amount: Number(initialPaid),
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'UPI',
        transaction_ref: `INIT-TXN-${Date.now()}`,
        collected_by: currentUser.full_name,
        remarks: 'Initial payment recorded at placement entry.'
      });
    }

    // Reset Form
    setName('');
    setPhone('');
    setEmail('');
    setCompany('');
    setDesignation('');
    setCtc('');
    setInitialPaid('');
    setHasOffer(true);
    setHasRelieving(false);
    setHasPf(false);
    setHasPayslip(false);
    setIsAddModalOpen(false);
  };

  const handleOpenDetailModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDetailModalOpen(true);
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
      remarks: remarks || 'Installment Payment'
    });
    setIsPaymentModalOpen(false);
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
        breadcrumbSource="Direct Placement"
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 fade-in">
      
      {/* Header section with live sync */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-text-primary">
              Direct Placement
            </h1>
            <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded ${
              isSyncing 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse'
                : 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
            }`}>
              {isSyncing ? '🔄 Syncing' : '● Live'}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Review and track executive candidates directly hired by corporate clients.
          </p>
        </div>

        {/* Sync Controls & Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-border-primary bg-bg-card hover:bg-bg-hover active:scale-95 transition-all text-text-secondary"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-accent-orange' : ''}`} />
            Manual Sync
          </button>
          
          <button
            onClick={triggerSync}
            className="text-xs font-semibold px-3.5 py-2 rounded-lg border border-border-primary bg-bg-card hover:bg-bg-hover text-text-secondary"
          >
            Refresh
          </button>

          {currentUser.role !== 'FINANCE' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white shadow-md active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" /> Add Direct Placement
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid (core metrics only — the rest live in the filters below) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="rounded-xl border border-border-primary bg-bg-card p-5 shadow-premium flex items-center gap-4">
          <div className="p-3 rounded-lg bg-bg-secondary text-text-primary"><Users className="h-5 w-5" /></div>
          <div>
            <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted">Total Placements</div>
            <div className="text-2xl font-bold">{totalPlacements}</div>
          </div>
        </div>

        <div className="rounded-xl border border-border-primary bg-bg-card p-5 shadow-premium flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400"><IndianRupee className="h-5 w-5" /></div>
          <div>
            <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted">Revenue Received</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">₹{revenueSum.toLocaleString()}</div>
          </div>
        </div>

        <div className="rounded-xl border border-border-primary bg-bg-card p-5 shadow-premium flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400"><IndianRupee className="h-5 w-5" /></div>
          <div>
            <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted">Pending Dues</div>
            <div className="text-2xl font-bold text-red-500 dark:text-red-400">₹{duesSum.toLocaleString()}</div>
          </div>
        </div>

      </div>

      {/* Advanced Filters Console */}
      <div className="rounded-2xl border border-border-primary bg-bg-card p-5 shadow-glass space-y-4">
        
        {/* Search Input Row */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-5 w-5 text-text-muted" />
          <input
            type="text"
            placeholder="Search by DP Candidate Name, ID, Email, Phone or Company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-primary bg-bg-primary text-sm focus:outline-none focus:border-accent-orange focus:ring-2 focus:ring-accent-orange/15 shadow-inner"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          
          <div>
            <label className="text-[10px] uppercase font-mono text-text-muted block mb-1 font-semibold">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:border-accent-orange text-text-secondary"
            >
              <option value="ALL">Status: All</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved ({placedApprovedCount})</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-text-muted block mb-1 font-semibold">BGV Status</label>
            <select
              value={bgvFilter}
              onChange={(e) => setBgvFilter(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:border-accent-orange text-text-secondary"
            >
              <option value="ALL">BGV: All</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending BGV ({pendingBgvCount})</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-text-muted block mb-1 font-semibold">Experience</label>
            <select
              value={expFilter}
              onChange={(e) => setExpFilter(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:border-accent-orange text-text-secondary"
            >
              <option value="ALL">Exp: All</option>
              <option value="FRESHER">Fresher</option>
              <option value="EXPERIENCED">Experienced</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-text-muted block mb-1 font-semibold">Payments</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:border-accent-orange text-text-secondary"
            >
              <option value="ALL">Payment: All</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="FULLY_PAID">Fully Paid</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-text-muted block mb-1 font-semibold">Company</label>
            <input
              type="text"
              placeholder="Company"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-accent-orange text-text-secondary"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-text-muted block mb-1 font-semibold">Year of Passing</label>
            <input
              type="text"
              placeholder="Year of Passing"
              value={yopFilter}
              onChange={(e) => setYopFilter(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-accent-orange text-text-secondary"
            />
          </div>

        </div>

      </div>

      {/* Placements — compact cards (tap to view full details) */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDP.map(candidate => {
            const isBgvSubmitted = !!candidate.date_of_birth;
            return (
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
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    {isBgvSubmitted ? 'BGV completed' : 'BGV pending'}
                  </span>
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
            );
          })}
          {filteredDP.length === 0 && (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-border-primary p-8 text-center text-text-muted text-xs">
              No placements match this search query.
            </div>
          )}
        </div>
      </div>

      {/* Mini Audit Log widget */}
      <div className="rounded-2xl border border-border-primary bg-bg-card p-6 shadow-premium space-y-4">
        <h3 className="font-bold text-lg uppercase tracking-wide text-text-secondary">
          System Change Log
        </h3>
        <div className="border border-border-primary rounded-xl divide-y divide-border-secondary overflow-hidden bg-bg-card">
          {auditLogs.filter(log => log.action.includes('PLACEMENT') || log.action.includes('PAYMENT')).slice(0, 3).map(log => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
              <div>
                <span className="font-bold text-text-primary">{log.description}</span>
                <span className="text-text-muted block text-[10px] mt-0.5">By {log.user_name} on {new Date(log.created_at).toLocaleString()}</span>
              </div>
              <span className="text-[10px] font-mono bg-bg-secondary border border-border-primary text-text-secondary px-2.5 py-0.5 rounded">
                {log.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------------------------------ */}
      {/* MODALS IMPLEMENTATIONS */}
      {/* ------------------------------------------------------------------------------------------ */}

      {/* 0. Student Detail Screen replacing old modal */}

      {/* 1. Add Direct Placement Entry Modal (Workflow C) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-lg shadow-2xl text-text-primary space-y-4 my-8 fade-in">
            <div className="flex justify-between items-center border-b border-border-secondary pb-3">
              <div>
                <h3 className="font-bold text-lg">Add Direct Placement (Internal)</h3>
                <p className="text-[10px] text-text-muted">Workflow C: Registers placement & uploads BGV documents</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-bg-hover rounded-full"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Student Full Name *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>
              
              <div>
                <label className="font-semibold block mb-1">Mobile Number *</label>
                <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 9876543210" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. john@example.com" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Branch Location</label>
                <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange text-text-secondary">
                  <option value="Chennai">Chennai</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Course Domain</label>
                <select value={course} onChange={e => setCourse(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange text-text-secondary">
                  <option value="Java Full Stack">Java Full Stack</option>
                  <option value="Python Data Science">Python Data Science</option>
                  <option value="DotNet Core Developer">DotNet Core Developer</option>
                  <option value="Cloud Production Support">Cloud Production Support</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Experience Type</label>
                <select value={expType} onChange={e => setExpType(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange text-text-secondary">
                  <option value="Fresher">Fresher</option>
                  <option value="Experienced (1-2 Years)">Experienced (1-2 Years)</option>
                  <option value="Experienced (3+ Years)">Experienced (3+ Years)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Company Placed *</label>
                <input type="text" required value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Zoho Corporation" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Designation</label>
                <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Software Associate" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Annual CTC *</label>
                <input type="number" required value={ctc} onChange={e => setCtc(e.target.value)} placeholder="e.g. 450000" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div>
                <label className="font-semibold block mb-1">Initial Amount Paid (INR)</label>
                <input type="number" value={initialPaid} onChange={e => setInitialPaid(e.target.value)} placeholder="e.g. 10000" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>
            </div>

            {/* Document checklist section */}
            <div className="space-y-2 text-xs border-t border-border-secondary pt-3">
              <label className="font-semibold block">Attached BGV Documents Check</label>
              <div className="grid grid-cols-2 gap-2 bg-bg-secondary p-3 rounded-lg border border-border-primary">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasOffer} onChange={e => setHasOffer(e.target.checked)} className="rounded text-accent-orange focus:ring-accent-orange" />
                  <span>Offer Letter (Offer_Letter.pdf)</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasRelieving} onChange={e => setHasRelieving(e.target.checked)} className="rounded text-accent-orange focus:ring-accent-orange" />
                  <span>Relieving Letter (Relieving.pdf)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasPf} onChange={e => setHasPf(e.target.checked)} className="rounded text-accent-orange focus:ring-accent-orange" />
                  <span>PF Service History (PF_History.pdf)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasPayslip} onChange={e => setHasPayslip(e.target.checked)} className="rounded text-accent-orange focus:ring-accent-orange" />
                  <span>Payslip (Payslip.pdf)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-secondary pt-4">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-xs font-semibold">Cancel</button>
              <button onClick={handleAddPlacement} className="px-4 py-2 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white text-xs font-semibold">Record Placement</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Review & Approve Placement Modal */}
      {isApprovalModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-md shadow-2xl text-text-primary space-y-4 fade-in">
            <div className="flex justify-between items-center border-b border-border-secondary pb-3">
              <h3 className="font-bold text-lg">Approve Direct Placement</h3>
              <button onClick={() => setIsApprovalModalOpen(false)} className="p-1 hover:bg-bg-hover rounded-full"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-3 text-xs bg-bg-secondary p-4 rounded-xl border border-border-primary">
              <div className="flex justify-between"><span>Candidate Code:</span><span className="font-bold">{selectedCandidate.candidate_code}</span></div>
              <div className="flex justify-between"><span>Full Name:</span><span className="font-bold">{selectedCandidate.full_name}</span></div>
              <div className="flex justify-between"><span>Company Placed:</span><span className="font-bold text-accent-orange">{selectedCandidate.placement_company}</span></div>
              <div className="flex justify-between"><span>Annual CTC:</span><span className="font-bold">₹{(selectedCandidate.annual_ctc || 0).toLocaleString()}</span></div>
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

      {/* 3. Record Installment Payment Modal */}
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
                <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. 2nd Installment paid" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-orange" />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-secondary pt-4">
              <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover text-xs font-semibold">Cancel</button>
              <button onClick={handleSubmitPayment} className="px-4 py-2 rounded-lg bg-accent-orange hover:bg-accent-orangeHover text-white text-xs font-semibold">Record Payment</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
