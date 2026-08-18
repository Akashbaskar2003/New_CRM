import React, { useState } from 'react';
import { useCRMStore } from '../store/crmStore';
import type { Candidate } from '../store/crmStore';
import { BarChart2, Calendar, MapPin, BookOpen, AlertCircle, DollarSign, Download, CheckCircle, Clock, X, Pencil, Save, User as UserIcon } from 'lucide-react';

export const Reports: React.FC = () => {
  const { candidates, payments, updateCandidate } = useCRMStore();
  const [activeReportTab, setActiveReportTab] = useState<number>(1);

  // --- Student Details Card (view + edit) ---
  const [selectedStudent, setSelectedStudent] = useState<Candidate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Candidate>>({});

  const openStudentCard = (candidate?: Candidate | null) => {
    if (!candidate) return; // e.g. "Deleted Candidate" rows with no live record
    setSelectedStudent(candidate);
    setIsEditing(false);
    setEditForm(candidate);
  };

  const closeStudentCard = () => {
    setSelectedStudent(null);
    setIsEditing(false);
    setEditForm({});
  };

  const startEditStudent = () => {
    if (!selectedStudent) return;
    setEditForm(selectedStudent);
    setIsEditing(true);
  };

  const saveStudentEdit = () => {
    if (!selectedStudent) return;
    updateCandidate(selectedStudent.id, {
      full_name: editForm.full_name?.trim() || selectedStudent.full_name,
      phone: editForm.phone?.trim() || selectedStudent.phone,
      email: editForm.email?.trim() || selectedStudent.email,
      branch: editForm.branch?.trim() || selectedStudent.branch,
      course: editForm.course?.trim() || selectedStudent.course,
      batch: editForm.batch?.trim() || selectedStudent.batch,
    });
    const updated = { ...selectedStudent, ...editForm } as Candidate;
    setSelectedStudent(updated);
    setIsEditing(false);
  };

  // Small reusable "clickable name" cell used across every report table below
  const NameCell: React.FC<{ candidate?: Candidate | null; className?: string; children: React.ReactNode }> = ({ candidate, className, children }) => (
    <td className={className}>
      <button
        type="button"
        onClick={() => openStudentCard(candidate)}
        disabled={!candidate}
        className={`text-left hover:underline decoration-2 underline-offset-2 ${candidate ? 'cursor-pointer text-accent-orange hover:text-accent-orangeHover' : 'cursor-default'}`}
        title={candidate ? 'View student details' : undefined}
      >
        {children}
      </button>
    </td>
  );

  // Helper to trigger a CSV download for a report
  const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----------------------------------------------------
  // REPORT CALCULATIONS & DATA STRUCTURES
  // ----------------------------------------------------

  // Report 1: Pending Students (grouped by team)
  const pendingStudents = candidates.filter(c => c.placement_status === 'APPROVED' && c.payment_status !== 'FULLY_PAID');
  const getPendingStudentsRows = () => pendingStudents.map(c => [c.candidate_code, c.full_name, c.team_id, c.placement_company || 'N/A', c.amount_payable.toString(), c.total_paid.toString(), c.pending_amount.toString()]);

  // Report 2: Fully Paid Students
  const fullyPaidStudents = candidates.filter(c => c.placement_status === 'APPROVED' && c.payment_status === 'FULLY_PAID');
  const getFullyPaidRows = () => fullyPaidStudents.map(c => [c.candidate_code, c.full_name, c.team_id, c.placement_company || 'N/A', c.amount_payable.toString(), c.total_paid.toString()]);

  // Report 3: Installment History per Student
  const getInstallmentRows = () => payments.map(p => {
    const student = candidates.find(c => c.id === p.candidate_id);
    return [
      p.payment_date,
      student?.full_name || 'Unknown',
      student?.candidate_code || 'Unknown',
      p.amount.toString(),
      p.payment_mode,
      p.transaction_ref || 'N/A',
      p.collected_by
    ];
  });

  // Report 4: Team-wise Collection Summary (Expected vs Collected)
  const teams: ('JAVA' | 'PYTHON' | 'DOTNET' | 'SUPPORT')[] = ['JAVA', 'PYTHON', 'DOTNET', 'SUPPORT'];
  const teamSummaries = teams.map(team => {
    const teamCands = candidates.filter(c => c.team_id === team && c.placement_status === 'APPROVED');
    const expected = teamCands.reduce((sum, c) => sum + c.amount_payable, 0);
    const collected = payments
      .filter(p => {
        const c = candidates.find(cand => cand.id === p.candidate_id);
        return c?.team_id === team && c?.placement_status === 'APPROVED';
      })
      .reduce((sum, p) => sum + p.amount, 0);
    const pending = Math.max(expected - collected, 0);
    return {
      team,
      count: teamCands.length,
      expected,
      collected,
      pending,
      percent: expected > 0 ? Math.round((collected / expected) * 100) : 0
    };
  });
  const getTeamSummaryRows = () => teamSummaries.map(t => [t.team, t.count.toString(), t.expected.toString(), t.collected.toString(), t.pending.toString(), `${t.percent}%`]);

  // Report 5: Monthly Collection Statement
  const getMonthlyStatement = () => {
    const statement: Record<string, number> = {};
    payments.forEach(p => {
      const month = p.payment_date.substring(0, 7); // YYYY-MM
      statement[month] = (statement[month] || 0) + p.amount;
    });
    return Object.entries(statement)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, amount]) => ({ month, amount }));
  };
  const monthlyStatement = getMonthlyStatement();
  const getMonthlyRows = () => monthlyStatement.map(m => [m.month, m.amount.toString()]);

  // Report 6: Company-wise Placement Report
  const getCompanyPlacements = () => {
    const comps: Record<string, { count: number; totalCTC: number }> = {};
    candidates.forEach(c => {
      if (c.placement_company) {
        const entry = comps[c.placement_company] || { count: 0, totalCTC: 0 };
        entry.count += 1;
        entry.totalCTC += c.annual_ctc || 0;
        comps[c.placement_company] = entry;
      }
    });
    return Object.entries(comps).map(([company, data]) => ({
      company,
      count: data.count,
      avgCTC: data.count > 0 ? Math.round(data.totalCTC / data.count) : 0
    }));
  };
  const companyPlacements = getCompanyPlacements();
  const getCompanyRows = () => companyPlacements.map(c => [c.company, c.count.toString(), c.avgCTC.toString()]);

  // Report 7: Branch-wise Placement Report
  const getBranchPlacements = () => {
    const branches: Record<string, number> = {};
    candidates.forEach(c => {
      if (c.placement_company) {
        branches[c.branch] = (branches[c.branch] || 0) + 1;
      }
    });
    return Object.entries(branches).map(([branch, count]) => ({ branch, count }));
  };
  const branchPlacements = getBranchPlacements();
  const getBranchRows = () => branchPlacements.map(b => [b.branch, b.count.toString()]);

  // Report 8: Course-wise Placement Report
  const getCoursePlacements = () => {
    const courses: Record<string, number> = {};
    candidates.forEach(c => {
      if (c.placement_company) {
        courses[c.course] = (courses[c.course] || 0) + 1;
      }
    });
    return Object.entries(courses).map(([course, count]) => ({ course, count }));
  };
  const coursePlacements = getCoursePlacements();
  const getCourseRows = () => coursePlacements.map(c => [c.course, c.count.toString()]);

  // Report 9: Overdue Payments (Pending Dues & Due Date Passed)
  const overduePayments = candidates.filter(c => {
    if (c.placement_status !== 'APPROVED' || c.payment_status === 'FULLY_PAID') return false;
    if (!c.due_date) return false;
    const due = new Date(c.due_date);
    const today = new Date();
    return due < today; // Due date is in the past
  });
  const getOverdueRows = () => overduePayments.map(c => [c.candidate_code, c.full_name, c.team_id, c.pending_amount.toString(), c.due_date || 'N/A']);

  // ----------------------------------------------------
  // RENDER REPORT VIEWS
  // ----------------------------------------------------

  const renderReportContent = () => {
    switch (activeReportTab) {
      
      // 1. Pending Students
      case 1:
        return (
          <div className="space-y-4 fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-text-primary">1. Pending Dues Candidates</h4>
                <p className="text-xs text-text-muted">List of placed students with outstanding financial collections.</p>
              </div>
              <button
                onClick={() => downloadCSV(['Code', 'Name', 'Team', 'Company', 'Payable', 'Paid', 'Pending'], getPendingStudentsRows(), 'pending_students_report')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-border-primary bg-bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-primary font-mono uppercase text-text-secondary">
                    <th className="p-3">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Team</th>
                    <th className="p-3">Company</th>
                    <th className="p-3 text-right">Payable</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right text-red-500">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary">
                  {pendingStudents.map(c => (
                    <tr key={c.id} className="hover:bg-bg-hover/20">
                      <td className="p-3 font-mono text-text-muted">{c.candidate_code}</td>
                      <NameCell candidate={c} className="p-3 font-bold">{c.full_name}</NameCell>
                      <td className="p-3">{c.team_id}</td>
                      <td className="p-3 font-semibold text-accent-orange">{c.placement_company}</td>
                      <td className="p-3 text-right">₹{c.amount_payable.toLocaleString()}</td>
                      <td className="p-3 text-right text-green-600 dark:text-green-400">₹{c.total_paid.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-red-500 font-mono">₹{c.pending_amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {pendingStudents.length === 0 && (
                    <tr><td colSpan={7} className="p-6 text-center text-text-muted">No pending candidates found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 2. Fully Paid Students
      case 2:
        return (
          <div className="space-y-4 fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-text-primary">2. Fully Cleared Accounts</h4>
                <p className="text-xs text-text-muted">List of placed students who have completed all payment requirements.</p>
              </div>
              <button
                onClick={() => downloadCSV(['Code', 'Name', 'Team', 'Company', 'Payable', 'Paid'], getFullyPaidRows(), 'fully_paid_report')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-border-primary bg-bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-primary font-mono uppercase text-text-secondary">
                    <th className="p-3">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Team</th>
                    <th className="p-3">Company</th>
                    <th className="p-3 text-right">Amount Cleared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary">
                  {fullyPaidStudents.map(c => (
                    <tr key={c.id} className="hover:bg-bg-hover/20">
                      <td className="p-3 font-mono text-text-muted">{c.candidate_code}</td>
                      <NameCell candidate={c} className="p-3 font-bold text-green-700 dark:text-green-400">{c.full_name}</NameCell>
                      <td className="p-3">{c.team_id}</td>
                      <td className="p-3">{c.placement_company}</td>
                      <td className="p-3 text-right font-bold text-green-600 dark:text-green-400">₹{c.amount_payable.toLocaleString()}</td>
                    </tr>
                  ))}
                  {fullyPaidStudents.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-text-muted">No fully paid candidates found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 3. Installments Report
      case 3:
        return (
          <div className="space-y-4 fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-text-primary">3. Installment Ledger History</h4>
                <p className="text-xs text-text-muted">Detailed collection history of all individual payment installments received.</p>
              </div>
              <button
                onClick={() => downloadCSV(['Date', 'Name', 'Code', 'Amount', 'Mode', 'Ref ID', 'Collected By'], getInstallmentRows(), 'installments_report')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-border-primary bg-bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-primary font-mono uppercase text-text-secondary">
                    <th className="p-3">Date</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Transaction Reference</th>
                    <th className="p-3">Collected By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary">
                  {payments.map(p => {
                    const student = candidates.find(c => c.id === p.candidate_id);
                    return (
                      <tr key={p.id} className="hover:bg-bg-hover/20">
                        <td className="p-3 font-mono">{p.payment_date}</td>
                        <NameCell candidate={student} className="p-3 font-bold">
                          {student?.full_name || 'Deleted Candidate'}
                          <span className="text-[10px] text-text-muted block font-mono">{student?.candidate_code}</span>
                        </NameCell>
                        <td className="p-3 font-bold text-green-600 dark:text-green-400">₹{p.amount.toLocaleString()}</td>
                        <td className="p-3 font-semibold">{p.payment_mode}</td>
                        <td className="p-3 font-mono text-text-muted">{p.transaction_ref || 'N/A'}</td>
                        <td className="p-3 text-text-secondary">{p.collected_by}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 4. Team-wise collection summary (Expected vs Collected)
      case 4:
        return (
          <div className="space-y-6 fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-text-primary">4. Team Performance Ledger</h4>
                <p className="text-xs text-text-muted">Overview of collections expected versus actual payments processed per language team.</p>
              </div>
              <button
                onClick={() => downloadCSV(['Team', 'Placed Count', 'Expected Collection', 'Actual Collected', 'Dues', 'Cleared %'], getTeamSummaryRows(), 'team_wise_summary_report')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>

            {/* Custom CSS charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamSummaries.map(t => (
                <div key={t.team} className="rounded-xl border border-border-primary bg-bg-card p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase tracking-wider text-xs">{t.team} Team</span>
                    <span className="text-[11px] font-mono text-text-secondary">{t.count} Placement(s)</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-text-muted font-mono">
                      <span>Collections Cleared</span>
                      <span className="font-bold text-text-primary">{t.percent}%</span>
                    </div>
                    <div className="w-full bg-bg-secondary rounded-full h-3 overflow-hidden border border-border-secondary">
                      <div className="bg-accent-orange h-full rounded-full transition-all duration-500" style={{ width: `${t.percent}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
                    <div className="bg-bg-secondary/40 border border-border-primary rounded p-1">
                      <span className="text-text-muted block uppercase">Expected</span>
                      <strong className="text-xs text-text-primary">₹{t.expected.toLocaleString()}</strong>
                    </div>
                    <div className="bg-bg-secondary/40 border border-border-primary rounded p-1">
                      <span className="text-text-muted block uppercase">Collected</span>
                      <strong className="text-xs text-green-600 dark:text-green-400">₹{t.collected.toLocaleString()}</strong>
                    </div>
                    <div className="bg-bg-secondary/40 border border-border-primary rounded p-1">
                      <span className="text-text-muted block uppercase">Dues</span>
                      <strong className="text-xs text-red-500 dark:text-red-400 font-mono">₹{t.pending.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-border-primary bg-bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-primary font-mono uppercase text-text-secondary">
                    <th className="p-3">Team</th>
                    <th className="p-3">Placements</th>
                    <th className="p-3 text-right">Expected Collections</th>
                    <th className="p-3 text-right">Revenue Received</th>
                    <th className="p-3 text-right">Pending Dues</th>
                    <th className="p-3 text-right">% Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary">
                  {teamSummaries.map(t => (
                    <tr key={t.team} className="hover:bg-bg-hover/20">
                      <td className="p-3 font-bold">{t.team}</td>
                      <td className="p-3 font-mono">{t.count}</td>
                      <td className="p-3 text-right">₹{t.expected.toLocaleString()}</td>
                      <td className="p-3 text-right text-green-600 dark:text-green-400">₹{t.collected.toLocaleString()}</td>
                      <td className="p-3 text-right text-red-500 font-mono">₹{t.pending.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold font-mono text-accent-orange">{t.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 5. Monthly Collection Statement
      case 5:
        return (
          <div className="space-y-4 fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-text-primary">5. Monthly Collection Statement</h4>
                <p className="text-xs text-text-muted">Receipt breakdowns aggregated by month.</p>
              </div>
              <button
                onClick={() => downloadCSV(['Month', 'Total Amount Received'], getMonthlyRows(), 'monthly_statement_report')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-border-primary bg-bg-card max-w-md">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-primary font-mono uppercase text-text-secondary">
                    <th className="p-3">Billing Month</th>
                    <th className="p-3 text-right">Total Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary">
                  {monthlyStatement.map(m => (
                    <tr key={m.month} className="hover:bg-bg-hover/20">
                      <td className="p-3 font-bold font-mono">{m.month}</td>
                      <td className="p-3 text-right font-bold text-green-600 dark:text-green-400">₹{m.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {monthlyStatement.length === 0 && (
                    <tr><td colSpan={2} className="p-6 text-center text-text-muted">No monthly payments logged yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 6. Company-wise Placement Report
      case 6:
        return (
          <div className="space-y-4 fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-text-primary">6. Company Placement Distribution</h4>
                <p className="text-xs text-text-muted">Analysis of companies recruiting candidates and average CTC levels achieved.</p>
              </div>
              <button
                onClick={() => downloadCSV(['Company', 'Placed Count', 'Average CTC'], getCompanyRows(), 'company_placements_report')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-border-primary bg-bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-primary font-mono uppercase text-text-secondary">
                    <th className="p-3">Recruiting Company</th>
                    <th className="p-3">Candidate Placed</th>
                    <th className="p-3 text-right">Average Package (CTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary">
                  {companyPlacements.map(c => (
                    <tr key={c.company} className="hover:bg-bg-hover/20">
                      <td className="p-3 font-bold text-accent-orange">{c.company}</td>
                      <td className="p-3 font-mono">{c.count} student(s)</td>
                      <td className="p-3 text-right font-bold text-text-primary">₹{c.avgCTC.toLocaleString()}</td>
                    </tr>
                  ))}
                  {companyPlacements.length === 0 && (
                    <tr><td colSpan={3} className="p-6 text-center text-text-muted">No placement records logged.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 7. Branch-wise Placement Report
      case 7:
        return (
          <div className="space-y-4 fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-text-primary">7. Branch-wise Recruitment Report</h4>
                <p className="text-xs text-text-muted">Comparison of placement distribution across regional branches.</p>
              </div>
              <button
                onClick={() => downloadCSV(['Branch', 'Placed Count'], getBranchRows(), 'branch_placements_report')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-border-primary bg-bg-card max-w-md">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-primary font-mono uppercase text-text-secondary">
                    <th className="p-3">Regional Branch</th>
                    <th className="p-3 text-right">Total Placements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary">
                  {branchPlacements.map(b => (
                    <tr key={b.branch} className="hover:bg-bg-hover/20">
                      <td className="p-3 font-bold">{b.branch}</td>
                      <td className="p-3 text-right font-mono font-bold text-accent-orange">{b.count}</td>
                    </tr>
                  ))}
                  {branchPlacements.length === 0 && (
                    <tr><td colSpan={2} className="p-6 text-center text-text-muted">No branches with placement logs.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 8. Course-wise Placement Report
      case 8:
        return (
          <div className="space-y-4 fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-text-primary">8. Course Performance Report</h4>
                <p className="text-xs text-text-muted">Breakdown of placements completed according to student study domains.</p>
              </div>
              <button
                onClick={() => downloadCSV(['Course', 'Placed Count'], getCourseRows(), 'course_placements_report')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-border-primary bg-bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-primary font-mono uppercase text-text-secondary">
                    <th className="p-3">Course / Domain Curriculum</th>
                    <th className="p-3 text-right">Total Placements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary">
                  {coursePlacements.map(c => (
                    <tr key={c.course} className="hover:bg-bg-hover/20">
                      <td className="p-3 font-bold">{c.course}</td>
                      <td className="p-3 text-right font-mono font-bold text-accent-orange">{c.count}</td>
                    </tr>
                  ))}
                  {coursePlacements.length === 0 && (
                    <tr><td colSpan={2} className="p-6 text-center text-text-muted">No courses with placement logs.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 9. Overdue Payments
      case 9:
        return (
          <div className="space-y-4 fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-text-primary text-red-500">9. Overdue Collection Accounts</h4>
                <p className="text-xs text-text-muted">Alert listings of students whose payments are past their specified installment due dates.</p>
              </div>
              <button
                onClick={() => downloadCSV(['Code', 'Name', 'Team', 'Dues', 'Due Date'], getOverdueRows(), 'overdue_payments_report')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-border-primary bg-bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-primary font-mono uppercase text-text-secondary">
                    <th className="p-3">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Team</th>
                    <th className="p-3 text-right text-red-500">Dues Pending</th>
                    <th className="p-3 text-right text-red-500">Due Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary">
                  {overduePayments.map(c => (
                    <tr key={c.id} className="bg-red-50/20 dark:bg-red-950/5 hover:bg-bg-hover/20">
                      <td className="p-3 font-mono text-text-muted">{c.candidate_code}</td>
                      <NameCell candidate={c} className="p-3 font-bold text-red-600 dark:text-red-400">{c.full_name}</NameCell>
                      <td className="p-3">{c.team_id}</td>
                      <td className="p-3 text-right font-bold text-red-500 font-mono">₹{c.pending_amount.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-red-500 font-mono">{c.due_date}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/50">
                          <AlertCircle className="h-3 w-3" /> Overdue
                        </span>
                      </td>
                    </tr>
                  ))}
                  {overduePayments.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-text-muted">No overdue candidates found. All accounts up-to-date!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const reportPills = [
    { id: 1, label: 'Pending Students Dues', icon: Clock },
    { id: 2, label: 'Fully Paid Students', icon: CheckCircle },
    { id: 3, label: 'Installment History Log', icon: DollarSign },
    { id: 4, label: 'Team Collection Summary', icon: BarChart2 },
    { id: 5, label: 'Monthly Statement', icon: Calendar },
    { id: 7, label: 'Branch Placements', icon: MapPin },
    { id: 8, label: 'Course Placements', icon: BookOpen },
    { id: 9, label: 'Overdue Dues Alerts', icon: AlertCircle, count: overduePayments.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6 fade-in text-text-primary">
      <div>
        <h1 className="text-3xl font-extrabold uppercase tracking-tight">Business Reports</h1>
        <p className="text-xs text-text-muted mt-1">Select from the 8 specified audit and financial breakdown modules below.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar Menu */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-1.5 bg-bg-card border border-border-primary p-3 rounded-2xl shadow-premium self-start">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted px-2.5 mb-1.5 block">Report Selection</span>
          {reportPills.map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setActiveReportTab(p.id)}
                className={`w-full flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl border transition-all ${
                  activeReportTab === p.id
                    ? 'bg-accent-orange border-accent-orange text-white font-bold shadow'
                    : 'bg-bg-card border-border-secondary text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{p.label}</span>
                </div>
                {p.count !== undefined && p.count > 0 && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    activeReportTab === p.id 
                      ? 'bg-white text-accent-orange' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {p.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Report Contents Pane */}
        <div className="flex-1 rounded-2xl border border-border-primary bg-bg-card p-6 shadow-glass min-h-[420px]">
          {renderReportContent()}
        </div>

      </div>

      {/* Student Details Card (opens when a name is clicked in any report table) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 w-full max-w-lg shadow-2xl text-text-primary space-y-4 my-8 fade-in">

            {/* Header */}
            <div className="flex items-start justify-between border-b border-border-secondary pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center shrink-0">
                  <UserIcon className="h-5 w-5 text-accent-orange" />
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono tracking-wider bg-bg-secondary text-text-secondary border border-border-primary px-2.5 py-0.5 rounded-md">
                    {selectedStudent.candidate_code}
                  </span>
                  {!isEditing ? (
                    <h4 className="font-bold text-lg mt-1.5 text-text-primary">{selectedStudent.full_name}</h4>
                  ) : (
                    <input
                      type="text"
                      value={editForm.full_name ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="Full name"
                      className="mt-1.5 w-full text-sm font-bold bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange/40"
                    />
                  )}
                </div>
              </div>
              <button onClick={closeStudentCard} className="p-1 hover:bg-bg-hover rounded-full shrink-0"><X className="h-5 w-5" /></button>
            </div>

            {/* Details grid — view mode vs edit mode */}
            {!isEditing ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-b border-border-secondary pb-3">
                <div>
                  <span className="text-text-muted block">Course / Domain</span>
                  <span className="font-medium">{selectedStudent.course}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Batch & Branch</span>
                  <span className="font-medium">{selectedStudent.batch} ({selectedStudent.branch})</span>
                </div>
                <div>
                  <span className="text-text-muted block">Contact</span>
                  <span className="font-mono">{selectedStudent.phone}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Email</span>
                  <span className="font-mono truncate block">{selectedStudent.email}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Team</span>
                  <span className="font-medium">{selectedStudent.team_id}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Placement Status</span>
                  <span className="font-medium">{selectedStudent.placement_status.replace('_', ' ')}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs border-b border-border-secondary pb-4">
                <label className="space-y-1">
                  <span className="text-text-muted block">Course / Domain</span>
                  <input
                    type="text"
                    value={editForm.course ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent-orange/40"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-text-muted block">Batch</span>
                  <input
                    type="text"
                    value={editForm.batch ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent-orange/40"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-text-muted block">Branch</span>
                  <input
                    type="text"
                    value={editForm.branch ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent-orange/40"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-text-muted block">Phone</span>
                  <input
                    type="text"
                    value={editForm.phone ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-accent-orange/40"
                  />
                </label>
                <label className="col-span-2 space-y-1">
                  <span className="text-text-muted block">Email</span>
                  <input
                    type="email"
                    value={editForm.email ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-accent-orange/40"
                  />
                </label>
              </div>
            )}

            {/* Financial snapshot (view mode only) */}
            {!isEditing && selectedStudent.placement_status === 'APPROVED' && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-bg-secondary/50 rounded-lg p-2 border border-border-secondary">
                  <div className="text-[9px] font-mono text-text-muted uppercase">Payable</div>
                  <div className="text-sm font-bold text-text-primary">₹{selectedStudent.amount_payable.toLocaleString()}</div>
                </div>
                <div className="bg-bg-secondary/50 rounded-lg p-2 border border-border-secondary">
                  <div className="text-[9px] font-mono text-text-muted uppercase">Paid</div>
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">₹{selectedStudent.total_paid.toLocaleString()}</div>
                </div>
                <div className="bg-bg-secondary/50 rounded-lg p-2 border border-border-secondary">
                  <div className="text-[9px] font-mono text-text-muted uppercase">Pending</div>
                  <div className="text-sm font-bold text-red-500 dark:text-red-400">₹{selectedStudent.pending_amount.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Action row */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border-secondary">
              {!isEditing ? (
                <>
                  <button
                    onClick={closeStudentCard}
                    className="text-xs bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary px-3.5 py-2 rounded-lg font-semibold transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={startEditStudent}
                    className="flex items-center gap-1.5 text-xs bg-accent-orange hover:bg-accent-orangeHover text-white px-3.5 py-2 rounded-lg font-semibold shadow-sm transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit Details
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setIsEditing(false); setEditForm(selectedStudent); }}
                    className="text-xs bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-secondary px-3.5 py-2 rounded-lg font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveStudentEdit}
                    className="flex items-center gap-1.5 text-xs bg-accent-orange hover:bg-accent-orangeHover text-white px-3.5 py-2 rounded-lg font-semibold shadow-sm transition-all"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Changes
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
