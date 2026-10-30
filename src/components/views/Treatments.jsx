import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import {
  Sparkles, Plus, Search, Calendar, CheckCircle2, Clock,
  ArrowRight, Printer, FileText, ChevronRight, Check, X,
  AlertCircle, DollarSign, User, ShieldCheck, Tag, Receipt,
  CheckCircle, ArrowUpRight, ChevronDown, Layers, HelpCircle,
  FileCheck, Shield, HeartPulse, Stethoscope, Trash2, Edit3,
  Share2, Eye, Filter, Sparkle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ContextProvider } from '../../context/store';
import { invoiceService } from '../../services/invoiceService';

const RUPEE = '\u20B9';
const fmt = (v) => `${RUPEE}${Number(v || 0).toLocaleString('en-IN')}`;

const SKIN_AREAS = [
  'Forehead', 'Temples', 'Cheeks', 'Nose', 'Chin', 'Jawline',
  'Neck', 'Chest', 'Upper back', 'Arms', 'Hands', 'Abdomen', 'Legs'
];

const INITIAL_MOCK_PLANS = [
  {
    id: 'TP-2026-001',
    patientName: 'Rahul Verma',
    patientPhone: '+91 98765 43210',
    doctorName: 'Dr. Testing3',
    title: 'Acne & Post-Inflammatory Marks',
    diagnosis: 'Active breakouts with post-acne marks',
    teethInvolved: 'Cheeks, jawline',
    priority: 'Urgent',
    createdAt: '2026-09-26',
    status: 'In Progress',
    phases: [
      {
        id: 'P1',
        title: 'Phase 1: Skin assessment',
        description: 'Review skin history, current routine, and breakout pattern.',
        teeth: 'Cheeks, jawline',
        cost: 4500,
        status: 'Completed',
        completedDate: '2026-09-26',
        billed: true
      },
      {
        id: 'P2',
        title: 'Phase 2: Acne care routine',
        description: 'Personalized topical care plan and barrier-support guidance.',
        teeth: 'Cheeks, jawline',
        cost: 2500,
        status: 'In Progress',
        dueDate: '2026-09-30',
        billed: false
      },
      {
        id: 'P3',
        title: 'Phase 3: Progress review',
        description: 'Follow-up to assess response and refine the treatment plan.',
        teeth: 'Cheeks, jawline',
        cost: 7500,
        status: 'Pending',
        dueDate: '2026-10-05',
        billed: false
      }
    ]
  },
  {
    id: 'TP-2026-002',
    patientName: 'Priya Sharma',
    patientPhone: '+91 99887 66554',
    doctorName: 'Dr. Testing3',
    title: 'Melasma & Uneven Skin Tone',
    diagnosis: 'Facial hyperpigmentation',
    teethInvolved: 'Forehead, cheeks',
    priority: 'Normal',
    createdAt: '2026-09-28',
    status: 'Proposed',
    phases: [
      {
        id: 'P1',
        title: 'Phase 1: Pigmentation assessment',
        description: 'Review skin tone, sun exposure, and current skin-care routine.',
        teeth: 'Forehead, cheeks',
        cost: 6000,
        status: 'Completed',
        completedDate: '2026-09-28',
        billed: true
      },
      {
        id: 'P2',
        title: 'Phase 2: Brightening care plan',
        description: 'Personalized topical care and sun-protection recommendations.',
        teeth: 'Forehead, cheeks',
        cost: 32000,
        status: 'Pending',
        dueDate: '2026-10-08',
        billed: false
      }
    ]
  },
  {
    id: 'TP-2026-003',
    patientName: 'Anand Kulkarni',
    patientPhone: '+91 98221 00987',
    doctorName: 'Dr. Testing3',
    title: 'Back & Shoulder Scar Care',
    diagnosis: 'Post-acne scarring and uneven texture',
    teethInvolved: 'Upper back, shoulders',
    priority: 'High',
    createdAt: '2026-09-29',
    status: 'Proposed',
    phases: [
      {
        id: 'P1',
        title: 'Phase 1: Skin and scar review',
        description: 'Assess scar type, skin sensitivity, and treatment suitability.',
        teeth: 'Upper back, shoulders',
        cost: 5000,
        status: 'Pending',
        dueDate: '2026-10-02',
        billed: false
      },
      {
        id: 'P2',
        title: 'Phase 2: Scar treatment',
        description: 'Plan an appropriate in-clinic treatment and aftercare.',
        teeth: 'Upper back, shoulders',
        cost: 45000,
        status: 'Pending',
        dueDate: '2026-10-10',
        billed: false
      },
      {
        id: 'P3',
        title: 'Phase 3: Follow-up',
        description: 'Review healing and document progress at the next visit.',
        teeth: 'Upper back, shoulders',
        cost: 20000,
        status: 'Pending',
        dueDate: '2026-12-15',
        billed: false
      }
    ]
  }
];

export const Treatments = () => {
  const navigate = useNavigate();
  const { Patients } = useContext(ContextProvider) || {};
  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('skin_treatment_plans');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_PLANS;
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printPlan, setPrintPlan] = useState(null);
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  // New Plan Form State
  const [newPlan, setNewPlan] = useState({
    patientName: '',
    patientPhone: '',
    doctorName: 'Dr. Testing3',
    title: '',
    diagnosis: '',
    teethInvolved: 'Face',
    priority: 'Normal',
    phases: [
      {
        id: 'P1',
        title: 'Phase 1: Primary Treatment & Preparation',
        description: 'Skin assessment, routine review, and care recommendations',
        teeth: '',
        cost: 4000,
        status: 'Pending',
        billed: false
      }
    ]
  });

  useEffect(() => {
    localStorage.setItem('skin_treatment_plans', JSON.stringify(plans));
  }, [plans]);

  // Calculations
  const calculatePlanTotal = (phases = []) =>
    phases.reduce((acc, p) => acc + Number(p.cost || 0), 0);

  const calculatePlanProgress = (phases = []) => {
    if (!phases.length) return 0;
    const completed = phases.filter(p => p.status === 'Completed').length;
    return Math.round((completed / phases.length) * 100);
  };

  // Add next phase
  const handleAddPhase = () => {
    setNewPlan(prev => ({
      ...prev,
      phases: [
        ...prev.phases,
        {
          id: `P${prev.phases.length + 1}`,
          title: `Phase ${prev.phases.length + 1}: Next Clinical Stage`,
          description: '',
          teeth: prev.teethInvolved || '',
          cost: 3500,
          status: 'Pending',
          billed: false
        }
      ]
    }));
  };

  const handleRemovePhase = (index) => {
    if (newPlan.phases.length <= 1) {
      toast.warning('A treatment plan must have at least 1 phase');
      return;
    }
    const updated = newPlan.phases.filter((_, idx) => idx !== index);
    setNewPlan({ ...newPlan, phases: updated });
  };

  const handlePhaseChange = (index, field, value) => {
    const updated = [...newPlan.phases];
    updated[index][field] = value;
    setNewPlan({ ...newPlan, phases: updated });
  };

  // Create new plan
  const handleCreatePlan = (e) => {
    e.preventDefault();
    if (!newPlan.patientName.trim() || !newPlan.title.trim()) {
      toast.error('Please enter patient name and plan title');
      return;
    }

    const created = {
      ...newPlan,
      id: `TP-2026-${String(Math.floor(100 + Math.random() * 900))}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Proposed',
      phases: newPlan.phases.map((p, idx) => ({
        ...p,
        id: p.id || `P${idx + 1}`,
        teeth: p.teeth || newPlan.teethInvolved
      }))
    };

    setPlans([created, ...plans]);
    toast.success('Clinical Treatment Plan created successfully!');
    setIsModalOpen(false);
    // Reset form
    setNewPlan({
      patientName: '',
      patientPhone: '',
      doctorName: 'Dr. Testing3',
      title: '',
      diagnosis: '',
      teethInvolved: 'Face',
      priority: 'Normal',
      phases: [
        {
          id: 'P1',
          title: 'Phase 1: Primary Treatment & Preparation',
          description: 'Skin assessment, routine review, and care recommendations',
          teeth: '',
          cost: 4000,
          status: 'Pending',
          billed: false
        }
      ]
    });
  };

  // Phase status toggling
  const handleTogglePhaseStatus = (planId, phaseIdx) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const updatedPhases = [...p.phases];
      const current = updatedPhases[phaseIdx];
      const newStatus = current.status === 'Completed' ? 'Pending' : 'Completed';
      updatedPhases[phaseIdx] = {
        ...current,
        status: newStatus,
        completedDate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : null
      };

      const allCompleted = updatedPhases.every(ph => ph.status === 'Completed');
      const anyCompleted = updatedPhases.some(ph => ph.status === 'Completed');

      return {
        ...p,
        phases: updatedPhases,
        status: allCompleted ? 'Completed' : anyCompleted ? 'In Progress' : 'Proposed'
      };
    }));
  };

  // 1-Click Convert Phase to Invoice
  const handleConvertToInvoice = async (plan, phase, phaseIdx) => {
    try {
      toast.info(`Generating Tax Invoice for ${phase.title}...`);
      const invoicePayload = {
        patientId: plan.patientName,
        doctorId: plan.doctorName,
        items: [
          {
            description: `${plan.title} [${phase.title}] - ${phase.description || 'Clinical procedure'}`,
            qty: 1,
            rate: Number(phase.cost || 0),
            discount: 0
          }
        ],
        taxPercent: 18,
        status: 'Pending',
        paymentMethod: 'UPI',
        notes: `Auto-billed from Treatment Plan ${plan.id} (${phase.title})`
      };

      await invoiceService.createInvoice(invoicePayload);

      // Mark phase as billed in state
      setPlans(prev => prev.map(p => {
        if (p.id !== plan.id) return p;
        const updatedPhases = [...p.phases];
        updatedPhases[phaseIdx] = { ...updatedPhases[phaseIdx], billed: true };
        return { ...p, phases: updatedPhases };
      }));

      toast.success('Tax Invoice created successfully! Redirecting to Billing...');
      navigate('/billing');
    } catch (err) {
      console.error(err);
      toast.info('Invoice draft ready in Billing.');
      navigate('/billing');
    }
  };

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const term = search.toLowerCase();
      const matchesSearch =
        p.patientName.toLowerCase().includes(term) ||
        p.title.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(term)) ||
        (p.teethInvolved && p.teethInvolved.toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [plans, search, statusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalPlans = plans.length;
    const inProgress = plans.filter(p => p.status === 'In Progress').length;
    const completed = plans.filter(p => p.status === 'Completed').length;
    const proposed = plans.filter(p => p.status === 'Proposed').length;
    const totalRevenue = plans.reduce((acc, p) => acc + calculatePlanTotal(p.phases), 0);
    const billedRevenue = plans.reduce((acc, p) => {
      return acc + (p.phases || []).filter(ph => ph.billed || ph.status === 'Completed').reduce((s, ph) => s + Number(ph.cost || 0), 0);
    }, 0);

    return { totalPlans, inProgress, completed, proposed, totalRevenue, billedRevenue };
  }, [plans]);

  // Robust isolated iframe print
  const handlePrintQuotation = (plan) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Treatment Quotation - ${plan.id}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 16px;
            border-bottom: 2px solid #0f172a;
          }
          .brand-title { font-size: 22px; font-weight: 900; color: #1e3a8a; margin: 0; }
          .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
          .badge {
            display: inline-block;
            background: #0f172a;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
          }
          .meta-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 16px 0;
            padding: 12px 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            text-align: left;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-top: 2px solid #0f172a;
            font-size: 16px;
            font-weight: 900;
            margin-top: 12px;
          }
          .consent-section {
            margin-top: 48px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
          .sig-line {
            border-top: 1px solid #94a3b8;
            padding-top: 6px;
            font-size: 11px;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">KYDOC HEALTHCARE</h1>
            <p class="brand-sub">Skin Care &amp; Aesthetic Treatment Clinic</p>
            <p class="brand-sub">104 Health City, Pune &bull; Ph: +91 98765 43210 &bull; Reg: MH-DENT-2024</p>
          </div>
          <div style="text-align: right;">
            <span class="badge">Official Clinical Estimate</span>
            <div style="font-family: monospace; font-weight: 800; font-size: 15px; margin-top: 6px;">${plan.id}</div>
            <div style="color: #64748b; font-size: 11px;">Date: ${plan.createdAt}</div>
          </div>
        </div>

        <div class="meta-box">
          <div>
            <strong>Patient:</strong> ${plan.patientName} &bull; ${plan.patientPhone}<br/>
            <strong>Practitioner:</strong> ${plan.doctorName}
          </div>
          <div>
            <strong>Case Title:</strong> ${plan.title}<br/>
            <strong>Areas:</strong> ${plan.teethInvolved || 'General'} &bull; <strong>Assessment:</strong> ${plan.diagnosis || 'Skin consultation'}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px;">#</th>
              <th>Treatment Stage &amp; Care Details</th>
              <th style="width: 130px; text-align: center;">Area</th>
              <th style="width: 100px; text-align: center;">Status</th>
              <th style="width: 120px; text-align: right;">Estimated Cost</th>
            </tr>
          </thead>
          <tbody>
            ${plan.phases.map((ph, idx) => `
              <tr>
                <td style="color: #64748b; font-weight: 700;">${idx + 1}</td>
                <td>
                  <strong>${ph.title}</strong>
                  <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${ph.description || 'Standard operative and clinical protocol.'}</div>
                </td>
                <td style="text-align: center; font-weight: 700;">${ph.teeth || plan.teethInvolved || '—'}</td>
                <td style="text-align: center;">${ph.status}</td>
                <td style="text-align: right; font-weight: 800; font-family: monospace;">₹${Number(ph.cost || 0).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-row">
          <span>TOTAL ESTIMATED TREATMENT COST (INR)</span>
          <span style="color: #4338ca; font-size: 20px;">₹${calculatePlanTotal(plan.phases).toLocaleString('en-IN')}</span>
        </div>

        <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-size: 11px; color: #475569; margin-top: 16px;">
          <strong>Consent Note:</strong> This treatment quotation outlines estimated clinical procedures and costs. Complex biological factors may require minor phase alterations during healing.
        </div>

        <div class="consent-section">
          <div>
            <div class="sig-line">Patient / Legal Guardian Acceptance</div>
            <div style="font-size: 10px; color: #94a3b8;">I consent to the phased clinical treatment outlined above.</div>
          </div>
          <div style="text-align: right;">
            <div class="sig-line" style="margin-left: auto; width: 200px;">Authorized Skin Care Practitioner</div>
            <div style="font-size: 10px; color: #94a3b8;">For Kydoc Healthcare</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printContent);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 350);
    };
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 animate-[fadeIn_0.2s_ease-out] pb-28 sm:pb-32 md:pb-8 overflow-hidden">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-600 via-cyan-700 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-cyan-600/30 shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                Treatment Plans &amp; Quotation Studio
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200 shrink-0">
                Phase-Wise Care
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
              Build phased skin-care plans, map treatment areas, share client estimates, and bill each stage.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl sm:rounded-2xl text-xs font-black shadow-lg shadow-cyan-600/25 transition-all cursor-pointer w-full sm:w-auto hover:scale-[1.01] active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" /> <span>Create Treatment Plan</span>
        </button>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider truncate">Total Active Plans</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-black text-slate-900 mt-1.5 sm:mt-2 truncate">{metrics.totalPlans}</p>
          <div className="flex items-center gap-1.5 mt-1 truncate">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
              <strong className="text-cyan-700 font-bold">{metrics.inProgress}</strong> in active stages
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-600 tracking-wider truncate">Pending Execution</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-black text-amber-600 mt-1.5 sm:mt-2 truncate">{metrics.proposed}</p>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1 truncate">Awaiting patient visit</span>
        </div>

        <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-cyan-700 tracking-wider truncate">Planned Value</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-3xl font-black text-cyan-700 mt-1.5 sm:mt-2 font-mono truncate">
            {fmt(metrics.totalRevenue)}
          </p>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1 truncate">Total projected value</span>
        </div>

        <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-600 tracking-wider truncate">Completed / Billed</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-3xl font-black text-emerald-600 mt-1.5 sm:mt-2 font-mono truncate">
            {fmt(metrics.billedRevenue)}
          </p>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1 truncate">Realized procedural revenue</span>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative w-full sm:w-80 md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search client, treatment area, or plan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-cyan-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100/80 rounded-xl sm:rounded-2xl no-scrollbar">
          {[
            { id: 'ALL', label: 'All Plans', count: plans.length },
            { id: 'Proposed', label: 'Proposed', count: plans.filter(p => p.status === 'Proposed').length },
            { id: 'In Progress', label: 'In Progress', count: plans.filter(p => p.status === 'In Progress').length },
            { id: 'Completed', label: 'Completed', count: plans.filter(p => p.status === 'Completed').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Luxury Treatment Plans Card List */}
      <div className="space-y-4">
        {filteredPlans.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 text-slate-400 space-y-3">
            <Sparkles className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No Treatment Plans Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No clinical treatment plans match your criteria. Click &quot;Create Treatment Plan&quot; to design a new multi-stage case.
            </p>
          </div>
        ) : (
          filteredPlans.map(plan => {
            const planTotal = calculatePlanTotal(plan.phases);
            const progress = calculatePlanProgress(plan.phases);
            const isCompleted = plan.status === 'Completed';
            const isProposed = plan.status === 'Proposed';

            return (
              <div
                key={plan.id}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200"
              >
                {/* 1. Header Banner */}
                <div className="p-3.5 sm:p-5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-mono text-xs font-black text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200 shrink-0">
                      {plan.id}
                    </span>
                    <h3 className="font-black text-slate-900 text-sm sm:text-lg break-words">
                      {plan.title}
                    </h3>

                    {plan.teethInvolved && (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 shrink-0">
                        Areas: {plan.teethInvolved}
                      </span>
                    )}

                    <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-black border shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isProposed
                        ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        isCompleted ? 'bg-emerald-500' : isProposed ? 'bg-cyan-500' : 'bg-amber-500 animate-pulse'
                      }`} />
                      {plan.status}
                    </span>
                  </div>

                  {/* Actions & Cost */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Estimated</span>
                      <span className="text-base sm:text-xl font-black text-cyan-700 font-mono">
                        {fmt(planTotal)}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePrintQuotation(plan)}
                      className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      title="Print Quotation Pad for Patient"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Print Estimate</span>
                    </button>
                  </div>
                </div>

                {/* 2. Unified Clinical & Patient Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white text-xs">
                  <div className="p-3.5 sm:p-4 sm:px-6 space-y-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Patient</span>
                    <p className="font-extrabold text-slate-900 text-sm truncate">{plan.patientName}</p>
                    {plan.patientPhone ? (
                      <a
                        href={`tel:${String(plan.patientPhone).replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-900 font-bold hover:underline truncate max-w-full"
                        title="Call patient"
                      >
                        📞 {String(plan.patientPhone)}
                      </a>
                    ) : (
                      <p className="text-slate-500 font-medium">📞 Not specified</p>
                    )}
                  </div>

                  <div className="p-3.5 sm:p-4 sm:px-6 space-y-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Treating Clinician</span>
                    <p className="font-extrabold text-slate-900 text-sm truncate">{plan.doctorName}</p>
                    <p className="text-cyan-700 font-bold truncate">Skin Care Practitioner</p>
                  </div>

                  <div className="p-3.5 sm:p-4 sm:px-6 space-y-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Primary Diagnosis</span>
                    <p className="font-bold text-slate-800 text-xs truncate" title={plan.diagnosis}>
                      {plan.diagnosis || 'Clinical evaluation required'}
                    </p>
                    <p className="text-slate-500 font-medium truncate">Created: {plan.createdAt}</p>
                  </div>

                  <div className="p-3.5 sm:p-4 sm:px-6 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Case Progress</span>
                      <span className="text-xs font-black text-cyan-700">{progress}%</span>
                    </div>
                    {/* Modern Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {(plan.phases || []).filter(p => p.status === 'Completed').length} of {plan.phases?.length || 0} stages executed
                    </p>
                  </div>
                </div>

                {/* 3. Phases / Clinical Milestones Pipeline */}
                <div className="p-3.5 sm:p-6 bg-slate-50/40 border-t border-slate-100 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                      Phased Treatment Protocol ({plan.phases?.length || 0} Stages)
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                      Click checkmark to toggle &bull; Bill stage to invoice
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(plan.phases || []).map((ph, idx) => {
                      const isPhaseCompleted = ph.status === 'Completed';

                      return (
                        <div
                          key={ph.id || idx}
                          className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 bg-white ${
                            isPhaseCompleted
                              ? 'border-emerald-200 ring-1 ring-emerald-100 shadow-2xs'
                              : 'border-slate-200 hover:border-cyan-300 hover:shadow-xs'
                          }`}
                        >
                          <div className="space-y-2">
                            {/* Phase Top Row */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleTogglePhaseStatus(plan.id, idx)}
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                    isPhaseCompleted
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'border-2 border-slate-300 hover:border-cyan-600 text-transparent'
                                  }`}
                                  title="Mark stage completed / pending"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-extrabold text-xs text-slate-900 line-clamp-1">
                                  {ph.title}
                                </span>
                              </div>

                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                                isPhaseCompleted
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {ph.status}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 leading-relaxed min-h-[34px]">
                              {ph.description || 'Clinical operative stage for patient rehabilitation.'}
                            </p>

                            {ph.teeth && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md w-fit border border-slate-100">
                                <span>Treatment area:</span>
                                <span className="text-cyan-700 font-mono font-black">{ph.teeth}</span>
                              </div>
                            )}
                          </div>

                          {/* Phase Bottom Row */}
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block uppercase">Phase Fee</span>
                              <span className="text-sm font-black text-slate-900 font-mono">
                                {fmt(ph.cost)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {ph.billed ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Billed
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleConvertToInvoice(plan, ph, idx)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-600 hover:text-white text-cyan-700 border border-cyan-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                  title="Push this specific stage to Billing Invoice"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>Bill Stage</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Footer Note Strip */}
                <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 text-[11px] font-medium">
                    Consent Status: <strong className="text-slate-800">Approved by Patient</strong> &bull; Total phases: <strong>{plan.phases?.length || 0}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrintQuotation(plan)}
                      className="text-cyan-700 hover:text-cyan-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Patient Estimate
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Create Treatment Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto border border-slate-100 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-slate-900 to-cyan-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-600/50 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black truncate">Create Multi-Stage Treatment Plan</h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 truncate">Design phased clinical roadmap with patient quotation</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePlan} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Row 1: Patient details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={newPlan.patientName}
                    onChange={e => setNewPlan({ ...newPlan, patientName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newPlan.patientPhone}
                    onChange={e => setNewPlan({ ...newPlan, patientPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 2: Title and Doctor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Treatment Plan Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acne care & skin barrier support"
                    value={newPlan.title}
                    onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Attending Clinician</label>
                  <input
                    type="text"
                    value={newPlan.doctorName}
                    onChange={e => setNewPlan({ ...newPlan, doctorName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 3: Skin assessment and treatment areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Skin assessment</label>
                  <input
                    type="text"
                    placeholder="e.g. Acne, dryness, or uneven skin tone"
                    value={newPlan.diagnosis}
                    onChange={e => setNewPlan({ ...newPlan, diagnosis: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Treatment areas
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Forehead, cheeks"
                    value={newPlan.teethInvolved}
                    onChange={e => setNewPlan({ ...newPlan, teethInvolved: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Quick treatment area selectors */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  Quick select treatment areas
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {SKIN_AREAS.map(area => {
                    const isSelected = newPlan.teethInvolved.toLowerCase().includes(area.toLowerCase());
                    return (
                      <button
                        type="button"
                        key={area}
                        onClick={() => {
                          const current = newPlan.teethInvolved ? newPlan.teethInvolved.split(',').map(s => s.trim()).filter(Boolean) : [];
                          const updated = isSelected
                            ? current.filter((item) => item.toLowerCase() !== area.toLowerCase()).join(', ')
                            : [...current, area].join(', ');
                          setNewPlan({ ...newPlan, teethInvolved: updated });
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-cyan-400'
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Phases Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-700" />
                    Clinical Stages / Phases ({newPlan.phases.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPhase}
                    className="text-xs font-black text-cyan-700 hover:text-cyan-900 flex items-center gap-1 px-3 py-1 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Next Phase
                  </button>
                </div>

                <div className="space-y-2.5">
                  {newPlan.phases.map((ph, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2 relative group hover:border-cyan-200 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                          Phase {idx + 1}
                        </span>
                        {newPlan.phases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhase(idx)}
                            className="text-slate-400 hover:text-red-600 transition-all cursor-pointer p-1"
                            title="Remove phase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px] gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Phase title (e.g. Skin assessment & routine)"
                          value={ph.title}
                          onChange={e => handlePhaseChange(idx, 'title', e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs focus:outline-none focus:border-cyan-600"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            required
                            placeholder="Cost"
                            value={ph.cost}
                            onChange={e => handlePhaseChange(idx, 'cost', e.target.value)}
                            className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-right focus:outline-none focus:border-cyan-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px] gap-2">
                        <input
                          type="text"
                          placeholder="Clinical procedure description, materials, or instructions..."
                          value={ph.description}
                          onChange={e => handlePhaseChange(idx, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-cyan-600"
                        />
                        <input
                          type="text"
                          placeholder="Treatment area (e.g. Cheeks)"
                          value={ph.teeth}
                          onChange={e => handlePhaseChange(idx, 'teeth', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-mono focus:outline-none focus:border-cyan-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary Row */}
              <div className="p-4 bg-cyan-50/70 rounded-2xl border border-cyan-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-cyan-900 block">Total Quotation Value</span>
                  <span className="text-xs text-cyan-700">Calculated sum of all {newPlan.phases.length} phases</span>
                </div>
                <span className="text-xl font-black text-cyan-900 font-mono">
                  {fmt(newPlan.phases.reduce((acc, p) => acc + Number(p.cost || 0), 0))}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl font-black shadow-md shadow-cyan-600/30 transition-all cursor-pointer text-xs"
                >
                  Save &amp; Generate Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Mobile Floating Action Button (FAB) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed right-4 bottom-20 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-full font-bold shadow-xl shadow-cyan-600/40 active:scale-95 transition-all cursor-pointer"
        aria-label="Create Treatment Plan"
      >
        <Plus className="w-5 h-5" />
        <span className="text-xs">New Plan</span>
      </button>
    </div>
  );
};
