import React, { useState } from 'react';
import { useCRMStore } from '../store/crmStore';
import { Database, Calendar, Users, ShieldCheck, IndianRupee, History, Download, Check } from 'lucide-react';

export const BackupCenter: React.FC = () => {
  const { candidates, payments, auditLogs } = useCRMStore();
  const [selectedMonth, setSelectedMonth] = useState('August, 2026');
  const [activeExport, setActiveExport] = useState<string | null>(null);

  const months = ['August, 2026', 'July, 2026', 'June, 2026', 'May, 2026'];

  // Universal CSV Downloader
  const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
    setActiveExport(filename);
    setTimeout(() => {
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [
          headers.join(','),
          ...rows.map(e => e.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${filename}_${selectedMonth.replace(/\s+/g, '')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setActiveExport(null);
    }, 800); // Simulate brief compression/generating time
  };

  // ----------------------------------------------------
  // DATA EXPORTERS DEFINITIONS
  // ----------------------------------------------------

  // 1. Training Master Candidates
  const exportTrainingMaster = () => {
    const data = candidates.filter(c => c.candidate_type === 'TRAINING');
    const headers = ['Candidate ID', 'Code', 'Name', 'Phone', 'Email', 'Branch', 'Course', 'Batch', 'Placement Status', 'Registered At'];
    const rows = data.map(c => [
      c.id.toString(),
      c.candidate_code,
      c.full_name,
      c.phone,
      c.email,
      c.branch,
      c.course,
      c.batch,
      c.placement_status,
      c.created_at
    ]);
    downloadCSV(headers, rows, 'Training_Master_Candidates');
  };

  // 2. Training BGV
  const exportTrainingBGV = () => {
    const data = candidates.filter(c => c.candidate_type === 'TRAINING' && c.date_of_birth);
    const headers = ['Code', 'Name', 'Phone', 'DOB', 'Father Name', 'Alternate Phone', 'Address', 'Pincode', 'Verification Date'];
    const rows = data.map(c => [
      c.candidate_code,
      c.full_name,
      c.phone,
      c.date_of_birth || '',
      c.father_name || '',
      c.alternate_phone || '',
      c.address || '',
      c.pincode || '',
      c.updated_at
    ]);
    downloadCSV(headers, rows, 'Training_BGV_Records');
  };

  // 3. Direct Placement Candidates
  const exportDPMaster = () => {
    const data = candidates.filter(c => c.candidate_type === 'DIRECT_PLACEMENT');
    const headers = ['Code', 'Name', 'Phone', 'Email', 'Company', 'Designation', 'CTC', 'Experience', 'Status', 'Registered At'];
    const rows = data.map(c => [
      c.candidate_code,
      c.full_name,
      c.phone,
      c.email,
      c.placement_company || '',
      c.designation || '',
      c.annual_ctc ? c.annual_ctc.toString() : '0',
      c.experience_type || '',
      c.placement_status,
      c.created_at
    ]);
    downloadCSV(headers, rows, 'Direct_Placement_Candidates');
  };

  // 4. Direct Placement BGV
  const exportDPBGV = () => {
    const data = candidates.filter(c => c.candidate_type === 'DIRECT_PLACEMENT' && c.date_of_birth);
    const headers = ['Code', 'Name', 'Phone', 'DOB', 'Father Name', 'Alternate Phone', 'Address', 'Pincode', 'Company', 'Verification Date'];
    const rows = data.map(c => [
      c.candidate_code,
      c.full_name,
      c.phone,
      c.date_of_birth || '',
      c.father_name || '',
      c.alternate_phone || '',
      c.address || '',
      c.pincode || '',
      c.placement_company || '',
      c.updated_at
    ]);
    downloadCSV(headers, rows, 'Direct_Placement_BGV_Records');
  };

  // 5. Training Finances
  const exportTrainingFinances = () => {
    const headers = ['Date', 'Candidate Name', 'Code', 'Amount Paid', 'Mode', 'Ref ID', 'Collected By', 'Remarks'];
    const rows = payments
      .filter(p => {
        const c = candidates.find(cand => cand.id === p.candidate_id);
        return c?.candidate_type === 'TRAINING';
      })
      .map(p => {
        const c = candidates.find(cand => cand.id === p.candidate_id);
        return [p.payment_date, c?.full_name || 'N/A', c?.candidate_code || 'N/A', p.amount.toString(), p.payment_mode, p.transaction_ref || '', p.collected_by, p.remarks || ''];
      });
    downloadCSV(headers, rows, 'Training_Finances_Ledger');
  };

  // 6. Direct Placement Finances
  const exportDPFinances = () => {
    const headers = ['Date', 'Candidate Name', 'Code', 'Amount Paid', 'Mode', 'Ref ID', 'Collected By', 'Remarks'];
    const rows = payments
      .filter(p => {
        const c = candidates.find(cand => cand.id === p.candidate_id);
        return c?.candidate_type === 'DIRECT_PLACEMENT';
      })
      .map(p => {
        const c = candidates.find(cand => cand.id === p.candidate_id);
        return [p.payment_date, c?.full_name || 'N/A', c?.candidate_code || 'N/A', p.amount.toString(), p.payment_mode, p.transaction_ref || '', p.collected_by, p.remarks || ''];
      });
    downloadCSV(headers, rows, 'Direct_Placement_Finances_Ledger');
  };

  // 7. Training Audit Logs
  const exportTrainingLogs = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Description', 'IP Address'];
    const rows = auditLogs
      .filter(log => {
        if (!log.candidate_id) return true;
        const c = candidates.find(cand => cand.id === log.candidate_id);
        return c?.candidate_type === 'TRAINING';
      })
      .map(l => [l.created_at, l.user_name, l.action, l.description, l.ip_address]);
    downloadCSV(headers, rows, 'Training_CRM_Audit_Logs');
  };

  // 8. Direct Placement Audit Logs
  const exportDPLogs = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Description', 'IP Address'];
    const rows = auditLogs
      .filter(log => {
        if (!log.candidate_id) return false;
        const c = candidates.find(cand => cand.id === log.candidate_id);
        return c?.candidate_type === 'DIRECT_PLACEMENT';
      })
      .map(l => [l.created_at, l.user_name, l.action, l.description, l.ip_address]);
    downloadCSV(headers, rows, 'Direct_Placement_Audit_Logs');
  };

  // 9. Full CRM Sheets Backup
  const exportFullBackup = () => {
    const headers = ['Database Sheet', 'Record Name / Code', 'Primary Attribute', 'Second Attribute', 'Third Attribute', 'Last Updated'];
    
    const rows: string[][] = [];
    candidates.forEach(c => {
      rows.push(['CANDIDATES', c.candidate_code, c.full_name, c.candidate_type, `Status: ${c.placement_status}, Payable: ${c.amount_payable}`, c.updated_at]);
    });
    payments.forEach(p => {
      rows.push(['PAYMENTS', `PAY-${p.id}`, `Candidate ID: ${p.candidate_id}`, `Amount: ₹${p.amount}`, `Ref: ${p.transaction_ref}`, p.created_at]);
    });
    auditLogs.forEach(l => {
      rows.push(['AUDIT_LOGS', `LOG-${l.id}`, l.user_name, l.action, l.description, l.created_at]);
    });

    downloadCSV(headers, rows, 'Full_CRM_Sheets_Backup');
  };

  const backupCards = [
    {
      title: 'Training Master Candidates',
      desc: 'Export all Training CRM candidate profiles from Master_Candidates.',
      handler: exportTrainingMaster,
      icon: Users,
      id: 'Training_Master_Candidates'
    },
    {
      title: 'Training BGV',
      desc: 'Export all Training CRM background verification records.',
      handler: exportTrainingBGV,
      icon: ShieldCheck,
      id: 'Training_BGV_Records'
    },
    {
      title: 'Direct Placement Candidates',
      desc: 'Export all Direct Placement candidate profiles.',
      handler: exportDPMaster,
      icon: Users,
      id: 'Direct_Placement_Candidates'
    },
    {
      title: 'Direct Placement BGV',
      desc: 'Export all Direct Placement background verification records.',
      handler: exportDPBGV,
      icon: ShieldCheck,
      id: 'Direct_Placement_BGV_Records'
    },
    {
      title: 'Training Finances',
      desc: 'Export Training CRM payment records and financial ledger.',
      handler: exportTrainingFinances,
      icon: IndianRupee,
      id: 'Training_Finances_Ledger'
    },
    {
      title: 'Direct Placement Finances',
      desc: 'Export Direct Placement payment records and financial ledger.',
      handler: exportDPFinances,
      icon: IndianRupee,
      id: 'Direct_Placement_Finances_Ledger'
    },
    {
      title: 'Training Audit Logs',
      desc: 'Export Training CRM system audit history.',
      handler: exportTrainingLogs,
      icon: History,
      id: 'Training_CRM_Audit_Logs'
    },
    {
      title: 'Direct Placement Audit Logs',
      desc: 'Export Direct Placement system audit history.',
      handler: exportDPLogs,
      icon: History,
      id: 'Direct_Placement_Audit_Logs'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 fade-in text-text-primary">
      
      {/* Page Title & Dropdown */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Database className="h-7 w-7 text-accent-orange" />
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight">Backup Center</h1>
            <p className="text-xs text-text-muted mt-1">Export local CRM sheets directly to spreadsheet formats.</p>
          </div>
        </div>

        {/* Month Selector dropdown */}
        <div className="flex items-center gap-2 bg-bg-card border border-border-primary rounded-xl px-4 py-2 shadow-sm">
          <Calendar className="h-4 w-4 text-accent-orange" />
          <span className="text-xs font-mono font-bold text-text-secondary uppercase">Select Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
          >
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Month Alert Banner */}
      <div className="rounded-xl border border-accent-green/20 bg-accent-green/5 p-4 flex items-center justify-between text-xs text-accent-green font-semibold">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent-green animate-pulse" />
          <span>Selected Backup Period: <strong className="text-text-primary uppercase font-mono">{selectedMonth}</strong></span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-bg-card border border-border-primary text-text-muted px-2 py-0.5 rounded">Active Partition</span>
      </div>

      {/* Main Grid of 8 Backup Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {backupCards.map(card => {
          const Icon = card.icon;
          const isExportingThis = activeExport === card.id;
          
          return (
            <div
              key={card.title}
              className="rounded-2xl border border-border-primary bg-bg-card p-5 shadow-premium space-y-3 hover:border-accent-orange/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-bg-secondary text-accent-orange">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-sm text-text-primary">{card.title}</h4>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{card.desc}</p>
              </div>

              <button
                onClick={card.handler}
                disabled={!!activeExport}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-bg-secondary hover:bg-bg-hover disabled:opacity-50 text-text-secondary border border-border-primary py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-all"
              >
                {isExportingThis ? (
                  <>
                    <Check className="h-4 w-4 text-accent-green animate-bounce" />
                    Generating CSV...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export {card.title.split(' ').slice(-1)[0]}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Large Bottom Full CRM Backup Card */}
      <div className="rounded-2xl border border-border-primary bg-bg-card p-8 shadow-premium text-center space-y-4 max-w-xl mx-auto">
        <div className="mx-auto h-12 w-12 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green">
          <Database className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base uppercase tracking-wide">Full CRM Backup</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Exports a consolidated, multidimensional spreadsheet containing all candidates, payment ledgers, and audit logs.
          </p>
        </div>

        <button
          onClick={exportFullBackup}
          disabled={!!activeExport}
          className="mx-auto flex items-center justify-center gap-2 bg-accent-green hover:bg-accent-greenHover disabled:opacity-50 text-white py-2.5 px-6 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all shadow-md"
        >
          <Download className="h-4 w-4" />
          Export Full CRM Backup
        </button>
      </div>

    </div>
  );
};
