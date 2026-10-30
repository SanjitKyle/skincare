import React, { useState, useEffect, useContext } from 'react';
import {
  Package, Plus, Search, Filter, Calendar, Clock, CheckCircle2,
  AlertCircle, Truck, Building2, User, Sparkles, ChevronRight,
  MoreVertical, Edit2, Trash2, ArrowUpRight, X, Phone, Tag,
  Check, ArrowRight, ShieldCheck, MessageSquare, ExternalLink
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ContextProvider } from '../../context/store';

const PIPELINE_STAGES = [
  { key: 'Order Placed', label: '1. Order placed', short: 'Ordered', icon: '🧾' },
  { key: 'Dispatched', label: '2. Dispatched', short: 'Dispatched', icon: '📦' },
  { key: 'In Transit', label: '3. In transit', short: 'In transit', icon: '🚚' },
  { key: 'Received at Clinic', label: '4. Received', short: 'Received', icon: '🏥' },
  { key: 'Stocked', label: '5. Stocked', short: 'Stocked', icon: '✨' },
];

const STAGE_INDEX = {
  'Order Placed': 0,
  Dispatched: 1,
  'In Transit': 2,
  'Received at Clinic': 3,
  Stocked: 4
};

const LAB_STATUS_META = {
  'Order Placed': {
    badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dot: 'bg-purple-500',
    glow: 'shadow-purple-500/10'
  },
  Dispatched: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500',
    glow: 'shadow-blue-500/10'
  },
  'In Transit': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
    glow: 'shadow-amber-500/10'
  },
  'Received at Clinic': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    glow: 'shadow-emerald-500/10'
  },
  Stocked: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
    glow: 'shadow-slate-500/10'
  },
};

const PROSTHETIC_TYPES = [
  'Daily cleanser',
  'Broad-spectrum SPF',
  'Hydrating serum',
  'Barrier repair moisturizer',
  'Chemical peel solution',
  'Post-treatment aftercare kit',
  'Acne care topical',
  'Pigmentation care serum',
  'Clinic consumables',
  'Other skin-care product'
];

const SHADE_GUIDES = ['All skin types', 'Sensitive', 'Oily', 'Dry', 'Combination', 'Not applicable'];

const LAB_PARTNERS = [
  { name: 'DermaCare Supplies', contact: '+91 98450 11223', city: 'Mumbai Hub' },
  { name: 'SkinPro Clinical', contact: '+91 99887 44556', city: 'Pune Center' },
  { name: 'Aesthetic Essentials', contact: '+91 97654 33221', city: 'Bangalore' },
  { name: 'In-Clinic Inventory', contact: 'Internal Ext: 104', city: 'Clinic Floor 1' }
];

const INITIAL_MOCK_ORDERS = [
  {
    id: 'LAB-2026-081',
    patientName: 'Rahul Verma',
    patientPhone: '+91 98765 43210',
    doctorName: 'Dr. Testing3',
    labName: 'DermaCare Supplies',
    prostheticType: 'Barrier repair moisturizer',
    teethInvolved: 'Sensitive skin',
    shade: 'Sensitive',
    impressionDate: '2026-09-24',
    sentDate: '2026-09-25',
    expectedDelivery: '2026-09-30',
    fittingDate: '2026-10-02',
    labCost: 2800,
    patientPrice: 8500,
    status: 'In Transit',
    notes: 'Fragrance-free formula; confirm batch expiry before stocking.'
  },
  {
    id: 'LAB-2026-082',
    patientName: 'Priya Sharma',
    patientPhone: '+91 99887 66554',
    doctorName: 'Dr. Testing3',
    labName: 'SkinPro Clinical',
    prostheticType: 'Broad-spectrum SPF',
    teethInvolved: 'All skin types',
    shade: 'All skin types',
    impressionDate: '2026-09-22',
    sentDate: '2026-09-23',
    expectedDelivery: '2026-09-28',
    fittingDate: '2026-09-29',
    labCost: 6500,
    patientPrice: 18000,
    status: 'Received at Clinic',
    notes: 'Daily broad-spectrum sunscreen for post-treatment care.'
  },
  {
    id: 'LAB-2026-083',
    patientName: 'Amit Patel',
    patientPhone: '+91 91234 56789',
    doctorName: 'Dr. Testing3',
    labName: 'Aesthetic Essentials',
    prostheticType: 'Pigmentation care serum',
    teethInvolved: 'Face',
    shade: 'Combination',
    impressionDate: '2026-09-27',
    sentDate: '2026-09-28',
    expectedDelivery: '2026-10-04',
    fittingDate: '2026-10-06',
    labCost: 4500,
    patientPrice: 15000,
    status: 'Dispatched',
    notes: 'Store away from direct sunlight; track opened date.'
  }
];

export const LabTracker = () => {
  const { Patients } = useContext(ContextProvider) || {};
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('skin_clinic_supply_orders');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_ORDERS;
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    doctorName: 'Dr. Testing3',
    labName: 'DermaCare Supplies',
    prostheticType: 'Barrier repair moisturizer',
    teethInvolved: 'Sensitive skin',
    shade: 'Sensitive',
    impressionDate: new Date().toISOString().split('T')[0],
    expectedDelivery: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    fittingDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    labCost: 3000,
    patientPrice: 9000,
    status: 'Dispatched',
    notes: ''
  });

  useEffect(() => {
    localStorage.setItem('skin_clinic_supply_orders', JSON.stringify(orders));
  }, [orders]);

  const handleOpenAdd = () => {
    setFormData({
      patientName: '',
      patientPhone: '',
      doctorName: 'Dr. Testing3',
      labName: 'DermaCare Supplies',
      prostheticType: 'Barrier repair moisturizer',
      teethInvolved: 'Sensitive skin',
      shade: 'Sensitive',
      impressionDate: new Date().toISOString().split('T')[0],
      expectedDelivery: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      fittingDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      labCost: 3000,
      patientPrice: 9000,
      status: 'Dispatched',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSetStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    toast.success(`Case updated to: ${newStatus}`);
  };

  const handleAdvanceNextStage = (order) => {
    const currentIndex = STAGE_INDEX[order.status] ?? 0;
    if (currentIndex < PIPELINE_STAGES.length - 1) {
      const nextStage = PIPELINE_STAGES[currentIndex + 1].key;
      handleSetStatus(order.id, nextStage);
    }
  };

  const handleNotifyPatient = (order) => {
    toast.info(`WhatsApp alert sent to ${order.patientName}: Your skin-care products are ready for pickup!`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientName) {
      toast.error('Please enter patient name');
      return;
    }

    const newOrder = {
      ...formData,
      id: `LAB-2026-${String(Math.floor(100 + Math.random() * 900))}`
    };
    setOrders(prev => [newOrder, ...prev]);
    toast.success('New skin-care supply order recorded!');
    setIsModalOpen(false);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.patientName.toLowerCase().includes(search.toLowerCase()) ||
      o.prostheticType.toLowerCase().includes(search.toLowerCase()) ||
      o.teethInvolved.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.labName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const kpis = {
    total: orders.length,
    inLab: orders.filter(o => o.status === 'In Transit' || o.status === 'Dispatched').length,
    readyToFit: orders.filter(o => o.status === 'Received at Clinic').length,
    completed: orders.filter(o => o.status === 'Stocked').length,
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 pb-28 sm:pb-32 md:pb-8 animate-[fadeIn_0.2s_ease-out] overflow-hidden">
      
      {/* 1. Header with Modern SaaS Styling */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/25 shrink-0 mt-0.5 sm:mt-0">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                Skin Care Products &amp; Supplies
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Tracking
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
              Track skin-care products, treatment supplies, supplier orders, and clinic stock.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl sm:rounded-2xl text-xs font-black shadow-md shadow-cyan-600/25 transition-all cursor-pointer shrink-0 w-full sm:w-auto active:scale-95"
        >
          <Plus className="w-4 h-4 shrink-0" /> <span>Add Supply Order</span>
        </button>
      </div>

      {/* 2. KPI Cards (Glassmorphic Elevated Design) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Supply Orders</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-black text-slate-900 mt-1.5 sm:mt-2 font-mono truncate">{kpis.total}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium truncate">All clinic product orders</p>
        </div>

        {/* In Fabrication */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-blue-100 shadow-2xs hover:shadow-md transition-all relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-blue-700 truncate">In Transit</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-black text-blue-700 mt-1.5 sm:mt-2 font-mono truncate">{kpis.inLab}</p>
          <p className="text-[10px] sm:text-xs text-blue-600/80 mt-1 font-medium truncate">With suppliers</p>
        </div>

        {/* Ready at Clinic */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-emerald-100 shadow-2xs hover:shadow-md transition-all relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-700 truncate">Delivered &bull; Ready</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-black text-emerald-700 mt-1.5 sm:mt-2 font-mono truncate">{kpis.readyToFit}</p>
          <p className="text-[10px] sm:text-xs text-emerald-600/80 mt-1 font-medium truncate">Ready for clinic use</p>
        </div>

        {/* Fitted */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 truncate">Stocked</span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-black text-slate-800 mt-1.5 sm:mt-2 font-mono truncate">{kpis.completed}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium truncate">Orders added to inventory</p>
        </div>
      </div>

      {/* 3. Search and Segmented Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative w-full sm:w-80 md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search product, treatment area, supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-cyan-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100/80 rounded-xl sm:rounded-2xl no-scrollbar">
          {[
            { id: 'ALL', label: 'All Cases', count: orders.length },
            { id: 'Dispatched', label: 'Dispatched', count: orders.filter(o => o.status === 'Dispatched').length },
            { id: 'In Transit', label: 'In Transit', count: orders.filter(o => o.status === 'In Transit').length },
            { id: 'Received at Clinic', label: 'Ready at Clinic', count: orders.filter(o => o.status === 'Received at Clinic').length },
            { id: 'Stocked', label: 'Stocked', count: orders.filter(o => o.status === 'Stocked').length }
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

      {/* 4. Luxury Order Pipeline Cards */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 text-slate-400 space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No Supply Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no orders matching your current filter criteria. Add a supply order to start tracking clinic stock.
            </p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const currentIdx = STAGE_INDEX[order.status] ?? 0;
            const statusMeta = LAB_STATUS_META[order.status] || LAB_STATUS_META['In Transit'];

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200"
              >
                {/* 1. Card Top Banner: Clean Single-Line Header */}
                <div className="p-3.5 sm:p-5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-mono text-xs font-black text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200 shrink-0">
                      {order.id}
                    </span>
                    <h3 className="font-black text-slate-900 text-sm sm:text-lg break-words">
                      {order.prostheticType}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                      {order.teethInvolved}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Profile: {order.shade}
                    </span>
                  </div>

                  {/* Status Badge & Stepper Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black border ${statusMeta.badge}`}>
                      <span className={`w-2 h-2 rounded-full ${statusMeta.dot} ${order.status !== 'Stocked' ? 'animate-pulse' : ''}`} />
                      {order.status}
                    </span>

                    {currentIdx < PIPELINE_STAGES.length - 1 && (
                      <button
                        onClick={() => handleAdvanceNextStage(order)}
                        className="flex items-center gap-1.5 px-3 py-1 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                        title="Advance to next order stage"
                      >
                        <span>Next: {PIPELINE_STAGES[currentIdx + 1].short}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Seamless 5-Stage Stepper Pipeline */}
                <div className="px-3.5 sm:px-6 py-3.5 sm:py-5 bg-white border-b border-slate-100">
                  <div className="relative max-w-4xl mx-auto">
                    {/* Background Track */}
                    <div className="absolute top-4 left-8 right-8 h-1 bg-slate-100 rounded-full hidden sm:block -z-0" />
                    {/* Active Track */}
                    <div
                      className="absolute top-4 left-8 h-1 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-full transition-all duration-300 hidden sm:block -z-0"
                      style={{
                        width: `${(currentIdx / (PIPELINE_STAGES.length - 1)) * 92}%`
                      }}
                    />

                    {/* Stage Nodes */}
                    <div className="flex sm:grid sm:grid-cols-5 gap-2 sm:gap-3 overflow-x-auto no-scrollbar relative z-10 pb-1 sm:pb-0">
                      {PIPELINE_STAGES.map((st, sIdx) => {
                        const isPast = sIdx < currentIdx;
                        const isCurrent = sIdx === currentIdx;

                        return (
                          <div
                            key={st.key}
                            onClick={() => handleSetStatus(order.id, st.key)}
                            className="flex sm:flex-col items-center gap-2 sm:gap-1.5 transition-all cursor-pointer text-left sm:text-center group shrink-0 px-2.5 sm:px-0 py-1.5 sm:py-0 bg-slate-50/80 sm:bg-transparent rounded-xl border sm:border-0 border-slate-200/60"
                          >
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black transition-all shrink-0 ${
                              isPast
                                ? 'bg-cyan-600 text-white shadow-xs'
                                : isCurrent
                                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white ring-2 sm:ring-4 ring-cyan-100 shadow-md scale-105'
                                : 'bg-white text-slate-400 border-2 border-slate-200 group-hover:border-slate-300'
                            }`}>
                              {isPast ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : st.icon}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-[10px] sm:text-[11px] font-black tracking-tight whitespace-nowrap sm:whitespace-normal ${
                                isCurrent ? 'text-cyan-700' : isPast ? 'text-slate-900' : 'text-slate-400'
                              }`}>
                                {st.short}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                                {isPast ? 'Completed' : isCurrent ? 'Active Now' : 'Upcoming'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Unified Case Information Matrix (No Nested Box Fatigue) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white text-xs">
                  {/* Patient Info */}
                  <div className="p-3.5 sm:p-4 sm:px-6 space-y-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Patient</span>
                    <p className="font-extrabold text-slate-900 text-sm truncate">{order.patientName}</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-slate-500 font-medium truncate">📞 {order.patientPhone}</p>
                      {order.patientPhone && (
                        <a
                          href={`tel:${order.patientPhone}`}
                          className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shrink-0"
                          title="Call Patient"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="p-3.5 sm:p-4 sm:px-6 space-y-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Clinic Practitioner</span>
                    <p className="font-extrabold text-slate-900 text-sm truncate">{order.doctorName}</p>
                    <p className="text-cyan-700 font-bold truncate">Skin Care Practitioner</p>
                  </div>

                  {/* Lab Partner Info */}
                  <div className="p-3.5 sm:p-4 sm:px-6 space-y-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Supplier</span>
                    <p className="font-extrabold text-slate-900 text-sm truncate flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{order.labName}</span>
                    </p>
                    <p className="text-slate-500 font-medium truncate">Skin-care product supplier</p>
                  </div>

                  {/* Key Dates */}
                  <div className="p-3.5 sm:p-4 sm:px-6 space-y-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Timeline</span>
                    <p className="text-slate-600 font-medium truncate">
                      Delivery: <strong className="text-slate-900">{order.expectedDelivery}</strong>
                    </p>
                    <p className="text-cyan-800 font-bold truncate">
                      Stock review: {order.fittingDate}
                    </p>
                  </div>
                </div>

                {/* 4. Technician Memo & Aligned Action Footer */}
                <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded-md shrink-0">
                      Order Notes
                    </span>
                    <span className="text-xs text-slate-600 font-medium truncate">
                      {order.notes || 'Review product handling and expiry details when received.'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => handleNotifyPatient(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>WhatsApp</span>
                    </button>

                    <select
                      value={order.status}
                      onChange={e => handleSetStatus(order.id, e.target.value)}
                      className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5 text-slate-700 focus:outline-none cursor-pointer shadow-2xs hover:border-slate-300"
                    >
                      {PIPELINE_STAGES.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Lab Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-auto border border-slate-100 flex flex-col">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Truck className="w-5 h-5 text-cyan-400 shrink-0" />
                <h3 className="text-sm font-black truncate">Create Supply Order</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={formData.patientName}
                    onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.patientPhone}
                    onChange={e => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product type *</label>
                <select
                  value={formData.prostheticType}
                  onChange={e => setFormData({ ...formData, prostheticType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  {PROSTHETIC_TYPES.map(pt => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Skin profile / area</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Face, sensitive skin"
                    value={formData.teethInvolved}
                    onChange={e => setFormData({ ...formData, teethInvolved: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Skin profile</label>
                  <select
                    value={formData.shade}
                    onChange={e => setFormData({ ...formData, shade: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    {SHADE_GUIDES.map(sh => (
                      <option key={sh} value={sh}>{sh}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Supplier *</label>
                  <select
                    value={formData.labName}
                    onChange={e => setFormData({ ...formData, labName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    {LAB_PARTNERS.map(lp => (
                      <option key={lp.name} value={lp.name}>{lp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expected delivery date</label>
                  <input
                    type="date"
                    value={formData.expectedDelivery}
                    onChange={e => setFormData({ ...formData, expectedDelivery: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock review date</label>
                  <input
                    type="date"
                    value={formData.fittingDate}
                    onChange={e => setFormData({ ...formData, fittingDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Order notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Fragrance-free, suitable for sensitive skin, verify expiry date..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Place Supply Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={handleOpenAdd}
        className="md:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-3.5 rounded-full shadow-lg shadow-cyan-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
        aria-label="Add supply order"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};
