import React, { useState } from 'react';
import { useCRMStore } from '../store/crmStore';
import { FileText, CheckCircle2, Upload } from 'lucide-react';

export const PublicForms: React.FC = () => {
  const { candidates, addCandidate, addPayment, addDocument, updateCandidate } = useCRMStore();
  const [activeFormType, setActiveFormType] = useState<'REGISTER' | 'BGV' | 'DP_BGV'>('REGISTER');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // ----------------------------------------------------
  // FORM 1: NEW JOINEE REGISTRATION FORM STATES
  // ----------------------------------------------------
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regBranch, setRegBranch] = useState('Chennai');
  const [regCourse, setRegCourse] = useState('Java Full Stack');
  const [regBatch, setRegBatch] = useState('Batch B12');
  const [regRemarks, setRegRemarks] = useState('');

  // ----------------------------------------------------
  // FORM 2 & 3: BGV SUBMISSION FORM STATES
  // ----------------------------------------------------
  const [bgvName, setBgvName] = useState('');
  const [bgvPhone, setBgvPhone] = useState('');
  const [bgvDob, setBgvDob] = useState('');
  const [bgvFather, setBgvFather] = useState('');
  const [bgvAltPhone, setBgvAltPhone] = useState('');
  const [bgvAddress, setBgvAddress] = useState('');
  const [bgvPincode, setBgvPincode] = useState('');
  const [bgvCourse, setBgvCourse] = useState('Java Full Stack');
  const bgvBatch = 'Batch B12';
  const [bgvAmount, setBgvAmount] = useState('1500'); // Default document charge Rs.1500

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------

  // Submit Form 1: New Joinee Registration
  const handleRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone) {
      alert('Please fill out Name and Phone fields.');
      return;
    }

    addCandidate({
      full_name: regName,
      phone: regPhone,
      email: regEmail || `${regName.toLowerCase().replace(/\s+/g, '')}@uniq-student.com`,
      branch: regBranch,
      course: regCourse,
      batch: regBatch,
      remarks: regRemarks || 'Registered via public form.',
      candidate_type: 'TRAINING',
      placement_status: 'NOT_PLACED'
    });

    setSuccessMsg(`Registration Successful! ${regName} has been enrolled in the database.`);
    setIsSuccess(true);
    
    // Clear fields
    setRegName('');
    setRegPhone('');
    setRegEmail('');
    setRegRemarks('');
  };

  // Submit Form 2: BGV (Training / DP)
  const handleBgvSubmit = (e: React.FormEvent, isDP: boolean) => {
    e.preventDefault();
    if (!bgvName || !bgvPhone) {
      alert('Please enter Name and Phone.');
      return;
    }

    // Workflow B: System finds candidate by phone number
    const targetType = isDP ? 'DIRECT_PLACEMENT' : 'TRAINING';
    const match = candidates.find(
      c => c.phone.replace(/\D/g, '') === bgvPhone.replace(/\D/g, '') && c.candidate_type === targetType
    );

    if (match) {
      // 1. Update candidate demographics
      updateCandidate(match.id, {
        date_of_birth: bgvDob,
        father_name: bgvFather,
        alternate_phone: bgvAltPhone,
        address: bgvAddress,
        pincode: bgvPincode,
        course: bgvCourse,
        batch: bgvBatch,
      });

      // 2. Insert payment: mode='DOCUMENT'
      if (Number(bgvAmount) > 0) {
        addPayment({
          candidate_id: match.id,
          amount: Number(bgvAmount),
          payment_date: new Date().toISOString().split('T')[0],
          payment_mode: 'UPI',
          transaction_ref: `BGV-UPI-${Date.now()}`,
          collected_by: 'BGV System Gateway',
          remarks: `BGV Document Verification payment received.`
        });

        // 3. Attach BGV Receipt
        addDocument({
          candidate_id: match.id,
          doc_type: 'BGV',
          file_name: `BGV_Verification_Receipt_${bgvName.replace(/\s+/g, '_')}.pdf`,
          file_url: '#',
          uploaded_by: 6 // Finance System
        });
      }

      setSuccessMsg(`BGV details updated for placed candidate ${match.full_name}. Verified BGV receipt attached.`);
    } else {
      // Create orphan record
      const newOrphanId = addCandidate({
        full_name: bgvName,
        phone: bgvPhone,
        email: `${bgvName.toLowerCase().replace(/\s+/g, '')}@orphan-bgv.com`,
        branch: 'Unverified Branch',
        course: bgvCourse,
        batch: bgvBatch,
        date_of_birth: bgvDob,
        father_name: bgvFather,
        alternate_phone: bgvAltPhone,
        address: bgvAddress,
        pincode: bgvPincode,
        candidate_type: targetType,
        remarks: 'Orphan BGV Record: Registered via BGV Form without pre-existing master profile.'
      });

      // Insert payment for BGV
      if (Number(bgvAmount) > 0) {
        addPayment({
          candidate_id: newOrphanId,
          amount: Number(bgvAmount),
          payment_date: new Date().toISOString().split('T')[0],
          payment_mode: 'UPI',
          transaction_ref: `BGV-UPI-${Date.now()}`,
          collected_by: 'BGV System Gateway',
          remarks: `Orphan BGV Document payment.`
        });
      }

      setSuccessMsg(`BGV submitted! Phone number not found in master records. Created BGV record for manual merge review.`);
    }
    
    setIsSuccess(true);
    // Clear BGV fields
    setBgvName('');
    setBgvPhone('');
    setBgvDob('');
    setBgvFather('');
    setBgvAltPhone('');
    setBgvAddress('');
    setBgvPincode('');
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-6 fade-in text-text-primary">
      
      {/* Tab selection */}
      <div className="flex flex-col items-center text-center space-y-2 mb-4">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-accent-orange">Branded Portal Forms</h1>
        <p className="text-xs text-text-muted">Simulate student-facing portals. Submitting these updates the PyCRM Command Center.</p>
        
        <div className="flex bg-bg-secondary p-1 rounded-xl border border-border-primary mt-2">
          <button
            onClick={() => { setActiveFormType('REGISTER'); setIsSuccess(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeFormType === 'REGISTER'
                ? 'bg-bg-card text-accent-orange shadow-sm font-bold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Form 1: Registration
          </button>
          
          <button
            onClick={() => { setActiveFormType('BGV'); setIsSuccess(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeFormType === 'BGV'
                ? 'bg-bg-card text-accent-orange shadow-sm font-bold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Form 2: Training BGV
          </button>

          <button
            onClick={() => { setActiveFormType('DP_BGV'); setIsSuccess(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeFormType === 'DP_BGV'
                ? 'bg-bg-card text-accent-orange shadow-sm font-bold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Form 4: DP BGV
          </button>
        </div>
      </div>

      {/* Success View */}
      {isSuccess ? (
        <div className="rounded-2xl border border-accent-green/20 bg-bg-card p-8 shadow-premium text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base uppercase tracking-wide">Form Submitted Successfully!</h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto">{successMsg}</p>
          </div>
          <button
            onClick={() => setIsSuccess(false)}
            className="bg-accent-orange hover:bg-accent-orangeHover text-white py-2 px-5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow"
          >
            Submit Another Form
          </button>
        </div>
      ) : (
        
        <div className="rounded-2xl border border-border-primary bg-bg-card p-6 shadow-premium">
          
          {/* FORM 1: STUDENT REGISTRATION */}
          {activeFormType === 'REGISTER' && (
            <form onSubmit={handleRegSubmit} className="space-y-4 text-xs">
              <h3 className="font-bold text-base uppercase tracking-wide border-b border-border-secondary pb-2 mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-orange" />
                New Student Enrollment Form
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Full Name *</label>
                  <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} placeholder="e.g. Lavan Yadav" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Mobile Number *</label>
                  <input type="text" required value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="e.g. 9876543210" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Email Address</label>
                  <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="e.g. lavan@example.com" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Regional Branch</label>
                  <select value={regBranch} onChange={e => setRegBranch(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange text-text-secondary">
                    <option value="Chennai">Chennai</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Course Curriculum</label>
                  <select value={regCourse} onChange={e => setRegCourse(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange text-text-secondary">
                    <option value="Java Full Stack">Java Full Stack</option>
                    <option value="Python Data Science">Python Data Science</option>
                    <option value="DotNet Core Developer">DotNet Core Developer</option>
                    <option value="Cloud Production Support">Cloud Production Support</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Batch Mode</label>
                  <select value={regBatch} onChange={e => setRegBatch(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange text-text-secondary">
                    <option value="Batch B12">Regular Batch (B12)</option>
                    <option value="Batch P08">Weekend Batch (P08)</option>
                    <option value="Direct Placement">Corporate Placement Track</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Remarks / Comments</label>
                <textarea rows={3} value={regRemarks} onChange={e => setRegRemarks(e.target.value)} placeholder="Enter any specific queries or training expectations..." className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <button type="submit" className="w-full bg-accent-orange hover:bg-accent-orangeHover text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs active:scale-98 transition-all shadow">
                Submit Registration
              </button>
            </form>
          )}

          {/* FORM 2 & 4: BACKGROUND VERIFICATION FORMS */}
          {(activeFormType === 'BGV' || activeFormType === 'DP_BGV') && (
            <form onSubmit={(e) => handleBgvSubmit(e, activeFormType === 'DP_BGV')} className="space-y-4 text-xs">
              <h3 className="font-bold text-base uppercase tracking-wide border-b border-border-secondary pb-2 mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-orange" />
                {activeFormType === 'DP_BGV' ? 'Direct Placement BGV Form' : 'Training BGV & Verification Form'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Verify Placed Student Name *</label>
                  <input type="text" required value={bgvName} onChange={e => setBgvName(e.target.value)} placeholder="e.g. Priyah Hari" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Primary Mobile Number *</label>
                  <input type="text" required value={bgvPhone} onChange={e => setBgvPhone(e.target.value)} placeholder="e.g. 9988776655" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange" />
                </div>
                
                <div>
                  <label className="font-semibold block mb-1">Date of Birth *</label>
                  <input type="date" required value={bgvDob} onChange={e => setBgvDob(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange text-text-secondary" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Father's Name *</label>
                  <input type="text" required value={bgvFather} onChange={e => setBgvFather(e.target.value)} placeholder="e.g. Hariprasad K" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Alternate Contact Number</label>
                  <input type="text" value={bgvAltPhone} onChange={e => setBgvAltPhone(e.target.value)} placeholder="e.g. 9988776600" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange" />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Residential Pincode *</label>
                  <input type="text" required value={bgvPincode} onChange={e => setBgvPincode(e.target.value)} placeholder="e.g. 641012" className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange" />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Residential Address *</label>
                <textarea rows={2} required value={bgvAddress} onChange={e => setBgvAddress(e.target.value)} placeholder="Enter full mailing address..." className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border-secondary pt-3">
                <div>
                  <label className="font-semibold block mb-1">Confirm Placed Course</label>
                  <select value={bgvCourse} onChange={e => setBgvCourse(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange text-text-secondary">
                    <option value="Java Full Stack">Java Full Stack</option>
                    <option value="Python Data Science">Python Data Science</option>
                    <option value="DotNet Core Developer">DotNet Core Developer</option>
                    <option value="Cloud Production Support">Cloud Production Support</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Verify BGV Verification Fee (INR)</label>
                  <input type="number" value={bgvAmount} onChange={e => setBgvAmount(e.target.value)} className="w-full bg-bg-primary border border-border-primary rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent-orange" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold block">Attach Payment Proof / Screenshot *</label>
                <div className="border-2 border-dashed border-border-primary hover:border-accent-orange/45 rounded-xl p-4 text-center cursor-pointer transition-all bg-bg-secondary/25">
                  <Upload className="h-6 w-6 text-text-muted mx-auto mb-1" />
                  <span className="text-[10px] text-text-secondary block font-semibold">Upload receipt bank proof</span>
                  <span className="text-[8px] text-text-muted block">PNG, JPG, PDF up to 5MB</span>
                </div>
              </div>

              <button type="submit" className="w-full bg-accent-orange hover:bg-accent-orangeHover text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs active:scale-98 transition-all shadow">
                Submit BGV Details
              </button>
            </form>
          )}

        </div>
      )}
    </div>
  );
};
