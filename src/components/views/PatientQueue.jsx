import React, { useState, useEffect, useMemo, useContext, useCallback, useRef } from 'react';
import { 
  Users, Plus, Search, Clock, CheckCircle2, AlertTriangle, 
  Stethoscope, Volume2, VolumeX, Printer, ArrowRight, Sparkles, Filter, 
  X, RefreshCw, ChevronRight, UserCheck, ShieldAlert, Play, Check, 
  RotateCcw, Trash2, LayoutGrid, List, Bell, Activity, Phone, User,
  Tv, Monitor, ArrowUpRight, CheckCircle, Calendar, Hash, Tag, Ticket
} from 'lucide-react';
import { ContextProvider } from '../../context/store';
import { 
  loadQueueFromStorage, 
  saveQueueToStorage, 
  sortQueueByPriority, 
  PRIORITY_LEVELS, 
  QUEUE_STATUS, 
  playClinicChime 
} from '../../services/queueStorage';
import { getQueueTokens, updateTokenStatus, getLiveQueue } from '../../services/queue';
import { IssueTokenModal } from '../queue/IssueTokenModal';
import { TokenSlipModal } from '../queue/TokenSlipModal';

const extractTokenList = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.tokens)) return res.tokens;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.tokens)) return res.data.tokens;
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.queue)) return res.queue;
  return [];
};

export const PatientQueue = () => {
  const { Doctors, token } = useContext(ContextProvider);

  const [queue, setQueue] = useState([]);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedTokenSlip, setSelectedTokenSlip] = useState(null);
  const [isTvDisplayOpen, setIsTvDisplayOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'cards'
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const isFetchingRef = useRef(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [doctorFilter, setDoctorFilter] = useState('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const safeDoctors = useMemo(() => {
    let list = [];
    if (Array.isArray(Doctors)) list = Doctors;
    else if (Array.isArray(Doctors?.data)) list = Doctors.data;
    else if (Array.isArray(Doctors?.doctors)) list = Doctors.doctors;
    else if (Array.isArray(Doctors?.data?.data)) list = Doctors.data.data;
    return list;
  }, [Doctors]);

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const updateQueue = (newQueue) => {
    const sorted = sortQueueByPriority(newQueue);
    setQueue(sorted);
    saveQueueToStorage(sorted);
  };

  // Live Queue Fetching from Backend (with fallback to storage)
  const fetchLiveQueue = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      setIsLoadingLive(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const params = {
        limit: 100
      };

      // Resolve doctor ID if doctorFilter is set
      let doctorIdParam = null;
      if (doctorFilter !== 'ALL') {
        const matched = safeDoctors.find(
          (d) => (d.full_name || d.name) === doctorFilter || (d._id || d.id) === doctorFilter
        );
        doctorIdParam = matched ? (matched._id || matched.id) : doctorFilter;
        if (doctorIdParam) params.doctorId = doctorIdParam;
      }
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      let serverTokens = [];

      // 1. If doctor selected, query live doctor queue board
      if (doctorIdParam) {
        try {
          const liveRes = await getLiveQueue(doctorIdParam, todayStr);
          serverTokens = extractTokenList(liveRes);
        } catch (e) {
          // continue with list tokens
        }
      }

      // 2. Query queue tokens with date & status
      if (serverTokens.length === 0) {
        try {
          const res = await getQueueTokens({ ...params, date: todayStr }, token);
          serverTokens = extractTokenList(res);
        } catch (e) {
          // ignore
        }
      }

      // 3. Optional fallback: query without date only if doctor filter is selected
      if (serverTokens.length === 0 && doctorIdParam) {
        try {
          const resNoDate = await getQueueTokens(params, token);
          serverTokens = extractTokenList(resNoDate);
        } catch (e) {
          // ignore
        }
      }

      if (serverTokens.length > 0) {
        const normalized = serverTokens.map((t) => {
          const patientName =
            t.patientSnapshot?.name ||
            t.patientName ||
            t.patient?.name ||
            t.patient?.full_name ||
            'Patient';
          const phone =
            t.patientSnapshot?.phone ||
            t.phone ||
            t.patient?.phone ||
            t.patient?.contact ||
            '';
          const gender =
            t.patientSnapshot?.gender ||
            t.gender ||
            t.patient?.gender ||
            'Other';
          const age =
            t.patientSnapshot?.age ||
            t.age ||
            t.patient?.age ||
            '';
          const doctorName =
            t.doctorName ||
            t.doctorSnapshot?.name ||
            t.doctor?.name ||
            'Doctor';
          const tokenCode =
            t.tokenCode ||
            `T-${String(t.tokenNumber || 1).padStart(2, '0')}`;

          let formattedIssued = t.issuedTime || t.createdAt;
          if (formattedIssued) {
            try {
              formattedIssued = new Date(formattedIssued).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
            } catch (e) {
              formattedIssued = String(formattedIssued);
            }
          } else {
            formattedIssued = new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
          }

          return {
            ...t,
            id: t._id || t.id,
            _id: t._id || t.id,
            tokenNumber: t.tokenNumber,
            tokenCode: tokenCode,
            patientName: patientName,
            phone: phone,
            gender: gender,
            age: age,
            doctorName: doctorName,
            service: t.service || 'General Consultation',
            roomNumber: t.roomNumber || 'Chair 1',
            priority: t.priority || 'NORMAL',
            priorityRank: t.priorityRank,
            status: t.status || 'WAITING',
            issuedTime: formattedIssued,
            notes: t.notes || '',
            consultationStartTime: t.consultationStartTime
              ? new Date(t.consultationStartTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : null,
            consultationEndTime: t.consultationEndTime
              ? new Date(t.consultationEndTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : null
          };
        });

        const sorted = sortQueueByPriority(normalized);
        setQueue(sorted);
        saveQueueToStorage(sorted);
        setIsLiveConnected(true);
      } else {
        // Zero tokens on server today: genuine empty queue
        setQueue((prev) => {
          if (prev && prev.length > 0) {
            saveQueueToStorage([]);
            return [];
          }
          return prev;
        });
        setIsLiveConnected(true);
      }
    } catch (err) {
      console.warn('Backend live queue fetch error, using local storage:', err);
      const loaded = loadQueueFromStorage();
      setQueue(sortQueueByPriority(loaded));
      setIsLiveConnected(false);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingLive(false);
    }
  }, [token, doctorFilter, statusFilter, safeDoctors]);

  // Initial load & Polling every 20 seconds for real-time live sync
  useEffect(() => {
    let isMounted = true;
    fetchLiveQueue();
    const interval = setInterval(() => {
      if (isMounted) fetchLiveQueue();
    }, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchLiveQueue]);

  // Derived metrics
  const activeServing = useMemo(() => {
    return queue.find((q) => q.status === QUEUE_STATUS.IN_CONSULTATION) || null;
  }, [queue]);

  const waitingList = useMemo(() => {
    return queue.filter((q) => q.status === QUEUE_STATUS.WAITING);
  }, [queue]);

  const nextPatient = waitingList[0] || null;

  const completedList = useMemo(() => {
    return queue.filter((q) => q.status === QUEUE_STATUS.COMPLETED);
  }, [queue]);

  const estimatedWaitMins = waitingList.length * 12;

  const syncStatusChange = async (targetTokenId, newStatus, extraNotes) => {
    if (!targetTokenId) return;
    try {
      await updateTokenStatus(targetTokenId, { status: newStatus, notes: extraNotes }, token);
    } catch (err) {
      console.warn('Live backend update status failed:', err);
    }
  };

  // Actions
  const handleTokenCreated = (newToken) => {
    const raw = newToken?.token || newToken?.data || newToken || {};
    const patientName =
      raw.patientSnapshot?.name ||
      raw.patientName ||
      raw.patient?.name ||
      raw.patient?.full_name ||
      'Patient';
    const phone =
      raw.patientSnapshot?.phone ||
      raw.phone ||
      raw.patient?.phone ||
      raw.patient?.contact ||
      '';
    const gender =
      raw.patientSnapshot?.gender ||
      raw.gender ||
      raw.patient?.gender ||
      'Other';
    const age =
      raw.patientSnapshot?.age ||
      raw.age ||
      raw.patient?.age ||
      '';
    const doctorName =
      raw.doctorName ||
      raw.doctorSnapshot?.name ||
      raw.doctor?.name ||
      'Doctor';

    const normalized = {
      ...raw,
      id: raw._id || raw.id || `TOK-${Date.now().toString().slice(-5)}`,
      _id: raw._id || raw.id,
      tokenNumber: raw.tokenNumber,
      tokenCode: raw.tokenCode || `T-${String(raw.tokenNumber || 1).padStart(2, '0')}`,
      patientName,
      phone,
      gender,
      age,
      doctorName,
      status: raw.status || 'WAITING'
    };
    const updated = [normalized, ...queue];
    updateQueue(updated);
    setSelectedTokenSlip(normalized);
    fetchLiveQueue();
  };

  const handleCallNext = () => {
    if (!nextPatient) return;
    const nextId = nextPatient._id || nextPatient.id;

    const updated = queue.map((item) => {
      const itemId = item._id || item.id;
      if (item.status === QUEUE_STATUS.IN_CONSULTATION) {
        syncStatusChange(itemId, QUEUE_STATUS.COMPLETED);
        return {
          ...item,
          status: QUEUE_STATUS.COMPLETED,
          consultationEndTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      if (itemId === nextId) {
        syncStatusChange(itemId, QUEUE_STATUS.IN_CONSULTATION);
        return {
          ...item,
          status: QUEUE_STATUS.IN_CONSULTATION,
          consultationStartTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return item;
    });

    updateQueue(updated);
    if (soundEnabled) playClinicChime();
  };

  const handleStartConsultation = (tokenId) => {
    const updated = queue.map((item) => {
      const itemId = item._id || item.id;
      if (itemId === tokenId) {
        syncStatusChange(itemId, QUEUE_STATUS.IN_CONSULTATION);
        return {
          ...item,
          status: QUEUE_STATUS.IN_CONSULTATION,
          consultationStartTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      if (item.status === QUEUE_STATUS.IN_CONSULTATION && itemId !== tokenId) {
        syncStatusChange(itemId, QUEUE_STATUS.COMPLETED);
        return {
          ...item,
          status: QUEUE_STATUS.COMPLETED,
          consultationEndTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return item;
    });

    updateQueue(updated);
    if (soundEnabled) playClinicChime();
  };

  const handleMarkComplete = (tokenId) => {
    syncStatusChange(tokenId, QUEUE_STATUS.COMPLETED);
    const updated = queue.map((item) => {
      if ((item._id || item.id) === tokenId) {
        return {
          ...item,
          status: QUEUE_STATUS.COMPLETED,
          consultationEndTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return item;
    });
    updateQueue(updated);
  };

  const handleSkipToken = (tokenId) => {
    syncStatusChange(tokenId, QUEUE_STATUS.SKIPPED);
    const updated = queue.map((item) => {
      if ((item._id || item.id) === tokenId) {
        return { ...item, status: QUEUE_STATUS.SKIPPED };
      }
      return item;
    });
    updateQueue(updated);
  };

  const handleRequeueToken = (tokenId) => {
    syncStatusChange(tokenId, QUEUE_STATUS.WAITING);
    const updated = queue.map((item) => {
      if ((item._id || item.id) === tokenId) {
        return { ...item, status: QUEUE_STATUS.WAITING };
      }
      return item;
    });
    updateQueue(updated);
  };

  const handleCancelToken = (tokenId) => {
    syncStatusChange(tokenId, QUEUE_STATUS.CANCELLED);
    const updated = queue.filter((item) => (item._id || item.id) !== tokenId);
    updateQueue(updated);
  };

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const patientName = String(item.patientName || item.patientSnapshot?.name || '').toLowerCase();
      const tokenCode = String(item.tokenCode || '').toLowerCase();
      const phone = String(item.phone || item.patientSnapshot?.phone || '').toLowerCase();
      const service = String(item.service || '').toLowerCase();

      const matchesSearch = !q ||
        patientName.includes(q) ||
        tokenCode.includes(q) ||
        phone.includes(q) ||
        service.includes(q);

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesDoctor = doctorFilter === 'ALL' || 
        item.doctorName === doctorFilter || 
        item.doctorId === doctorFilter;

      return matchesSearch && matchesStatus && matchesDoctor;
    });
  }, [queue, searchQuery, statusFilter, doctorFilter]);

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-[1600px] mx-auto space-y-4 md:space-y-6 pb-32 md:pb-8">
      {/* ── Modals ── */}
      <IssueTokenModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onTokenCreated={handleTokenCreated}
        currentQueue={queue}
      />

      {selectedTokenSlip && (
        <TokenSlipModal
          tokenData={selectedTokenSlip}
          onClose={() => setSelectedTokenSlip(null)}
        />
      )}

      {/* ── Public Waiting Room / TV Display Modal ── */}
      {isTvDisplayOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col p-6 sm:p-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-cyan-600/30">
                🦷
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Skin Care Clinic</h1>
                <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Outpatient Token Display</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-2xl sm:text-3xl font-mono font-black text-cyan-300">{currentTime}</span>
              <button 
                onClick={() => setIsTvDisplayOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
              >
                Close Display
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 my-auto py-8">
            {/* Left Big Spotlight: NOW CALLING */}
            <div className="bg-gradient-to-br from-cyan-950/80 to-slate-900 rounded-3xl p-8 border-2 border-cyan-500/50 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
              <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-widest animate-pulse">
                🔔 Now Calling • Cabin 1
              </span>

              {activeServing ? (
                <div className="mt-6 space-y-4">
                  <div className="text-8xl sm:text-9xl font-black font-mono text-white tracking-tight drop-shadow-md">
                    {activeServing.tokenCode}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-cyan-200">
                    {activeServing.patientName}
                  </h2>
                  <p className="text-base text-slate-300 font-semibold">
                    Consultation with <span className="text-white font-bold">{activeServing.doctorName}</span>
                  </p>
                </div>
              ) : (
                <div className="mt-8 text-center text-slate-400 space-y-2">
                  <p className="text-5xl font-mono">--</p>
                  <p className="text-lg">Please wait for the next token call</p>
                </div>
              )}
            </div>

            {/* Right: Upcoming Tokens Queue */}
            <div className="bg-slate-900/70 rounded-3xl p-6 border border-slate-800 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Next In Line</span>
                <span className="text-xs font-bold text-amber-400">{waitingList.length} Waiting</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {waitingList.slice(0, 5).map((item, i) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-mono font-black text-xl flex items-center justify-center">
                        {item.tokenCode}
                      </div>
                      <div>
                        <p className="text-base font-bold text-white">{item.patientName}</p>
                        <p className="text-xs text-slate-400">{item.doctorName} • {item.service}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">#{i + 1} in queue</span>
                  </div>
                ))}
                {waitingList.length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    No other patients waiting currently
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE APPLICATION VIEW (Phone View: md:hidden)                         */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-3">
        {/* 1. Mobile Header & Quick Controls */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-sm shadow-cyan-600/20 shrink-0">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-slate-900 tracking-tight whitespace-nowrap">OPD Queue</h1>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase whitespace-nowrap shrink-0 ${
                    isLiveConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {isLiveConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} • {currentTime}
                </p>
              </div>
            </div>

            {/* Quick Action Icons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={fetchLiveQueue}
                disabled={isLoadingLive}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
                title="Refresh Live Queue"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-700 ${isLoadingLive ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) playClinicChime();
                }}
                className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                  soundEnabled 
                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100' 
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
                title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Dual Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              onClick={handleCallNext}
              disabled={!nextPatient}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-sm shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Call Next {nextPatient ? `(${nextPatient.tokenCode})` : ''}</span>
            </button>

            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-sm shadow-cyan-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Issue Token</span>
            </button>
          </div>
        </div>

        {/* 2. Doctor Cabin #1 Live Spotlight Card */}
        {activeServing ? (
          <div className="bg-white rounded-2xl p-4 border border-cyan-200/90 shadow-2xs ring-1 ring-cyan-500/10 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-900">Cabin #1 Consultation</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                In Session
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-600 text-white flex flex-col items-center justify-center font-mono font-black text-base shadow-sm shadow-cyan-600/20 shrink-0">
                <span>{activeServing.tokenCode}</span>
                <span className="text-[8px] font-sans font-bold uppercase opacity-85">Active</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold text-slate-900 truncate">{activeServing.patientName}</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-50 text-cyan-700 border border-cyan-200/80">
                    {activeServing.isNewPatient ? 'Walk-in' : 'Registered'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-semibold truncate mt-0.5">
                  👨‍⚕️ {activeServing.doctorName}
                </p>
                <p className="text-[11px] text-cyan-700 font-bold truncate">
                  {activeServing.service}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Started at {activeServing.consultationStartTime}
                </p>
              </div>
            </div>

            {/* Mobile Touch Actions for Cabin */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => handleMarkComplete(activeServing.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" /> Finish Consultation
              </button>
              <button
                onClick={() => setSelectedTokenSlip(activeServing)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer"
                title="Print Token Slip"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800 truncate">Doctor Cabin #1 is Free</p>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  {nextPatient ? `Ready for ${nextPatient.tokenCode} (${nextPatient.patientName})` : 'Waiting lounge is clear'}
                </p>
              </div>
            </div>

            {nextPatient && (
              <button
                onClick={handleCallNext}
                className="px-3 py-1.5 bg-cyan-600 text-white rounded-xl text-[11px] font-black shrink-0 hover:bg-cyan-700 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                Call Next &rarr;
              </button>
            )}
          </div>
        )}

        {/* 3. Mobile Segmented Tab Controls */}
        <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80">
          {[
            { id: QUEUE_STATUS.WAITING, label: 'Waiting', count: waitingList.length },
            { id: QUEUE_STATUS.IN_CONSULTATION, label: 'In Cabin', count: activeServing ? 1 : 0 },
            { id: QUEUE_STATUS.COMPLETED, label: 'Done', count: completedList.length },
            { id: 'ALL', label: 'All', count: queue.length },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  isActive 
                    ? 'bg-white text-cyan-950 shadow-xs ring-1 ring-slate-200/60 font-black' 
                    : 'text-slate-500 hover:text-slate-800 font-bold'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4. Mobile Quick Search & Doctor Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search token, patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 max-w-[130px] truncate shadow-2xs"
          >
            <option value="ALL">All Docs</option>
            {safeDoctors.map((doc) => {
              const name = doc.full_name || doc.name;
              return <option key={name} value={name}>{name}</option>;
            })}
          </select>
        </div>

        {/* 5. Mobile Token Cards List */}
        <div className="space-y-3">
          {filteredQueue.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mx-auto">
                <Ticket className="w-6 h-6 text-cyan-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">No tokens found</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                No patients match the selected filter. Tap below to issue a new token.
              </p>
              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-cyan-700 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Issue Token
              </button>
            </div>
          ) : (
            filteredQueue.map((item, idx) => {
              const priorityMeta = PRIORITY_LEVELS[item.priority] || PRIORITY_LEVELS.NORMAL;
              const isServing = item.status === QUEUE_STATUS.IN_CONSULTATION;
              const isWaiting = item.status === QUEUE_STATUS.WAITING;
              const isCompleted = item.status === QUEUE_STATUS.COMPLETED;
              const isSkipped = item.status === QUEUE_STATUS.SKIPPED;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all p-3.5 space-y-3 shadow-2xs ${
                    isServing
                      ? 'border-cyan-400 bg-gradient-to-r from-cyan-50/40 via-white to-white ring-2 ring-cyan-500/20'
                      : isCompleted
                      ? 'border-slate-200/70 opacity-75'
                      : 'border-slate-200/90'
                  }`}
                >
                  {/* Top Bar: Token Badge + Priority + Arrived Time */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono font-black text-sm shadow-xs shrink-0 ${
                        isServing
                          ? 'bg-gradient-to-tr from-cyan-600 to-teal-600 text-white ring-2 ring-cyan-100'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        <span className="leading-none">{item.tokenCode}</span>
                        <span className="text-[8px] font-sans font-bold uppercase mt-0.5 opacity-70">
                          #{idx + 1}
                        </span>
                      </div>

                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${priorityMeta.badgeClass}`}>
                          <span>{priorityMeta.iconText}</span>
                          <span>{priorityMeta.label}</span>
                        </span>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          Arrived {item.issuedTime}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {isServing && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-50 text-cyan-800 border border-cyan-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-ping" />
                          In Cabin
                        </span>
                      )}
                      {isWaiting && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Waiting
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" />
                          Done
                        </span>
                      )}
                      {isSkipped && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                          On Hold
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Content: Patient Info */}
                  <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 truncate">{item.patientName}</h4>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                        item.isNewPatient ? 'bg-amber-100 text-amber-800' : 'bg-cyan-50 text-cyan-700 border border-cyan-200/80'
                      }`}>
                        {item.isNewPatient ? 'Walk-in' : 'Registered'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>🩺 {item.doctorName}</span>
                      {item.phone && (
                        <a href={`tel:${item.phone}`} className="text-cyan-700 font-bold hover:underline">
                          📞 {item.phone}
                        </a>
                      )}
                    </div>

                    <p className="text-[11px] text-cyan-700 font-bold truncate">
                      {item.service}
                    </p>

                    {item.notes && (
                      <p className="text-[10px] text-slate-400 italic truncate">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Bottom Touch Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {isWaiting && (
                      <button
                        onClick={() => handleStartConsultation(item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black shadow-sm shadow-cyan-600/20 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Call In Cabin
                      </button>
                    )}

                    {isServing && (
                      <button
                        onClick={() => handleMarkComplete(item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Finish Consultation
                      </button>
                    )}

                    {isSkipped && (
                      <button
                        onClick={() => handleRequeueToken(item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Recall Token
                      </button>
                    )}

                    {isCompleted && (
                      <span className="flex-1 text-[11px] font-bold text-slate-400 text-center py-2">
                        Consultation completed
                      </span>
                    )}

                    {/* Secondary Icon Actions */}
                    <button
                      onClick={() => setSelectedTokenSlip(item)}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all cursor-pointer"
                      title="Print Token Slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {isWaiting && (
                      <button
                        onClick={() => handleSkipToken(item.id)}
                        className="p-2.5 bg-slate-100 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-xl border border-slate-200 transition-all cursor-pointer"
                        title="Put on hold"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleCancelToken(item.id)}
                      className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      title="Cancel Token"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 6. Mobile Floating Action Button (FAB) */}
        <button
          onClick={() => setIsIssueModalOpen(true)}
          className="fixed bottom-20 right-4 z-40 md:hidden bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-600/30 px-4 py-3 rounded-2xl font-black text-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Issue Token</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP APPLICATION VIEW (Desktop & Tablet: hidden md:block)              */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-6">
        {/* ── Top Header Master Control Banner ── */}
        <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-cyan-600 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center text-xl shadow-md shadow-cyan-600/20 shrink-0 ring-4 ring-cyan-50">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Patient Queue &amp; OPD Tokens
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${
                isLiveConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isLiveConnected ? 'Live Server Connected' : 'Offline Mode'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Priority triage order for walk-ins &amp; scheduled visits •{' '}
              <span className="font-bold text-slate-700">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap sm:flex-nowrap">
          {/* Refresh Queue Button */}
          <button
            onClick={fetchLiveQueue}
            disabled={isLoadingLive}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
            title="Refresh Live Queue from Server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-700 ${isLoadingLive ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoadingLive ? 'Syncing...' : 'Refresh'}</span>
          </button>


          {/* Sound chime button */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playClinicChime();
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
            }`}
            title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Call Next Button */}
          <button
            onClick={handleCallNext}
            disabled={!nextPatient}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-sm shadow-emerald-600/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Call Next {nextPatient ? `(${nextPatient.tokenCode})` : ''}</span>
          </button>

          {/* Issue Token Button (Clean single plus) */}
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-600/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Token</span>
          </button>
        </div>
      </div>

      {/* ── Spotlight Stage: Cabin #1 vs Next Patient in Line ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Doctor Cabin #1 Card */}
        <div className={`p-5 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
          activeServing 
            ? 'bg-white border-cyan-200 shadow-md shadow-cyan-500/5 ring-1 ring-cyan-500/10' 
            : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold text-sm border border-cyan-100">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Doctor Cabin #1</span>
                <h3 className="text-sm font-black text-slate-800">Currently in Consultation</h3>
              </div>
            </div>

            {activeServing ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Session
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                Cabin Ready
              </span>
            )}
          </div>

          {activeServing ? (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-600 text-white flex items-center justify-center font-mono font-black text-xl shadow-md shadow-cyan-600/20 shrink-0 ring-4 ring-cyan-50">
                  {activeServing.tokenCode}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-slate-900">{activeServing.patientName}</h4>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-50 text-cyan-700 border border-cyan-200">
                      {activeServing.isNewPatient ? 'New Walk-in' : 'Registered'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    👨‍⚕️ {activeServing.doctorName} • {activeServing.service}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Consultation started at {activeServing.consultationStartTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTokenSlip(activeServing)}
                  className="p-2.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-xl transition-all cursor-pointer border border-slate-200"
                  title="Print Token Slip"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMarkComplete(activeServing.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Check className="w-4 h-4" /> Finish Consultation
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center py-4 bg-slate-50/60 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 font-semibold">
                Doctor cabin is free and ready for the next patient.
              </p>
              {nextPatient && (
                <button
                  onClick={handleCallNext}
                  className="mt-2 text-xs font-black text-cyan-600 hover:text-cyan-700 hover:underline cursor-pointer"
                >
                  Call next patient ({nextPatient.patientName}) &rarr;
                </button>
              )}
            </div>
          )}
        </div>

        {/* Next Up Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm border border-amber-200/70">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Queue Priority #1</span>
                <h3 className="text-sm font-black text-slate-800">Next Patient in Line</h3>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
              {waitingList.length} Waiting in Lounge
            </span>
          </div>

          {nextPatient ? (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-mono font-black text-xl border border-slate-300 shrink-0">
                  {nextPatient.tokenCode}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-slate-900">{nextPatient.patientName}</h4>
                    {PRIORITY_LEVELS[nextPatient.priority] && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${PRIORITY_LEVELS[nextPatient.priority].badgeClass}`}>
                        {PRIORITY_LEVELS[nextPatient.priority].iconText} {PRIORITY_LEVELS[nextPatient.priority].label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Assigned: {nextPatient.doctorName} • {nextPatient.service}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Waiting since {nextPatient.issuedTime}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleStartConsultation(nextPatient.id)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-600/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Call In Cabin
              </button>
            </div>
          ) : (
            <div className="mt-6 text-center py-4 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-xs text-slate-600 font-bold">
                Waiting lounge is clear!
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Issue a token when a walk-in arrives to add them to the queue.
              </p>
            </div>
          )}
        </div>
      </div>


      {/* ── KPI Counter Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tokens Today</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{queue.length}</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">All issued tokens</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Currently Waiting</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{waitingList.length}</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Est. ~{estimatedWaitMins} mins wait</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Consultations Done</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{completedList.length}</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Checked by doctor</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">High Priority Cases</p>
            <h3 className="text-2xl font-black text-red-600 mt-1">
              {queue.filter(q => q.priority === 'EMERGENCY' || q.priority === 'URGENT').length}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Emergency &amp; Urgent</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Search, Filters & View Toggle ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by token #, patient name, mobile or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Doctor Filter */}
        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-xs"
        >
          <option value="ALL">All Doctors</option>
          {safeDoctors.map((doc) => {
            const name = doc.full_name || doc.name;
            return <option key={name} value={name}>{name}</option>;
          })}
        </select>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All Tokens' },
            { id: QUEUE_STATUS.WAITING, label: `Waiting (${waitingList.length})` },
            { id: QUEUE_STATUS.IN_CONSULTATION, label: 'In Cabin' },
            { id: QUEUE_STATUS.COMPLETED, label: 'Completed' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === pill.id
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="List Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'cards' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Grid Cards View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Priority Legend Info Pill ── */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50/80 px-4 py-2 rounded-xl border border-slate-200/60 overflow-x-auto gap-4">
        <span className="font-extrabold text-slate-700 shrink-0">Priority Order:</span>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.values(PRIORITY_LEVELS).map((lvl) => (
            <span key={lvl.key} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${lvl.badgeClass}`}>
              <span>{lvl.iconText}</span>
              <span>{lvl.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── QUEUE LIST VIEW ── */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredQueue.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-2xl mx-auto shadow-2xs">
                <Ticket className="w-7 h-7 text-cyan-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No patients in this queue view</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No tokens match your search or filter. Click &ldquo;Issue Token&rdquo; to add a new walk-in patient.
              </p>
              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-cyan-700 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Issue Walk-in Token
              </button>
            </div>
          ) : (
            filteredQueue.map((item, idx) => {
              const priorityMeta = PRIORITY_LEVELS[item.priority] || PRIORITY_LEVELS.NORMAL;
              const isServing = item.status === QUEUE_STATUS.IN_CONSULTATION;
              const isWaiting = item.status === QUEUE_STATUS.WAITING;
              const isCompleted = item.status === QUEUE_STATUS.COMPLETED;
              const isSkipped = item.status === QUEUE_STATUS.SKIPPED;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs hover:shadow-md hover:border-cyan-200 group ${
                    isServing
                      ? 'border-cyan-500 bg-gradient-to-r from-cyan-50/50 via-white to-white ring-2 ring-cyan-500/20 shadow-cyan-500/5'
                      : isCompleted
                      ? 'border-slate-200/70 opacity-80'
                      : 'border-slate-200/90'
                  }`}
                >
                  {/* Left Block: Token & Priority Badge */}
                  <div className="flex items-center gap-3.5 shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-lg shadow-sm shrink-0 transition-all ${
                      isServing
                        ? 'bg-gradient-to-tr from-cyan-600 to-teal-600 text-white ring-4 ring-cyan-100 shadow-cyan-600/20'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-800 border border-slate-200 group-hover:border-cyan-200 group-hover:bg-cyan-50/40 group-hover:text-cyan-700'
                    }`}>
                      <span className="leading-none">{item.tokenCode}</span>
                      <span className="text-[9px] font-sans font-bold uppercase mt-1 opacity-70">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${priorityMeta.badgeClass}`}>
                        <span>{priorityMeta.iconText}</span>
                        <span>{priorityMeta.label}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Arrived {item.issuedTime}
                      </span>
                    </div>
                  </div>

                  {/* Middle Block: Patient, Doctor & Service Info */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                    {/* Patient */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-950 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {(item.patientName || 'P')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-extrabold text-slate-900 truncate">
                            {item.patientName}
                          </p>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                            item.isNewPatient ? 'bg-amber-100 text-amber-800' : 'bg-cyan-50 text-cyan-700 border border-cyan-200/80'
                          }`}>
                            {item.isNewPatient ? 'New' : 'Registered'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          📞 {item.phone || 'No Phone'} {item.age ? `• ${item.age}y` : ''} {item.gender ? `• ${item.gender}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Doctor */}
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Doctor</span>
                      <div className="flex items-center gap-1.5 mt-0.5 truncate">
                        <Stethoscope className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {item.doctorName}
                        </span>
                      </div>
                    </div>

                    {/* Service */}
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service / Reason</span>
                      <p className="text-xs font-bold text-cyan-700 truncate mt-0.5">
                        {item.service}
                      </p>
                      {item.notes && (
                        <p className="text-[10px] text-slate-400 truncate italic">
                          &ldquo;{item.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className="shrink-0 flex items-center">
                    {isServing && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-cyan-50 text-cyan-800 border border-cyan-200">
                        <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping" />
                        In Cabin #1
                      </span>
                    )}
                    {isWaiting && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Waiting Turn
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3.5 h-3.5" />
                        Finished
                      </span>
                    )}
                    {isSkipped && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">
                        On Hold
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                    {isWaiting && (
                      <button
                        onClick={() => handleStartConsultation(item.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm shadow-cyan-600/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Call In
                      </button>
                    )}

                    {isServing && (
                      <button
                        onClick={() => handleMarkComplete(item.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm shadow-emerald-600/25"
                      >
                        <Check className="w-3.5 h-3.5" /> Finish
                      </button>
                    )}

                    {/* Print Slip */}
                    <button
                      onClick={() => setSelectedTokenSlip(item)}
                      className="p-2 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-xl transition-all cursor-pointer border border-slate-200/90"
                      title="Print Token Ticket Slip"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Hold / Skip */}
                    {isWaiting && (
                      <button
                        onClick={() => handleSkipToken(item.id)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all cursor-pointer border border-slate-200/80"
                        title="Put On Hold"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}

                    {isSkipped && (
                      <button
                        onClick={() => handleRequeueToken(item.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer border border-slate-200"
                        title="Recall back to active queue"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Recall
                      </button>
                    )}

                    {/* Cancel */}
                    <button
                      onClick={() => handleCancelToken(item.id)}
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      title="Cancel Token"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── QUEUE CARDS / GRID VIEW ── */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQueue.map((item, idx) => {
            const priorityMeta = PRIORITY_LEVELS[item.priority] || PRIORITY_LEVELS.NORMAL;
            const isServing = item.status === QUEUE_STATUS.IN_CONSULTATION;
            const isWaiting = item.status === QUEUE_STATUS.WAITING;
            const isCompleted = item.status === QUEUE_STATUS.COMPLETED;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-5 border flex flex-col justify-between transition-all hover:shadow-lg shadow-xs ${
                  isServing 
                    ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-gradient-to-b from-cyan-50/40 to-white' 
                    : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-base shadow-xs ${
                        isServing ? 'bg-gradient-to-tr from-cyan-600 to-teal-600 text-white shadow-cyan-600/20' : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {item.tokenCode}
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${priorityMeta.badgeClass}`}>
                          <span>{priorityMeta.iconText}</span>
                          <span>{priorityMeta.label}</span>
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          Queue position #{idx + 1}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedTokenSlip(item)}
                      className="p-1.5 text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Patient Info */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900 truncate">{item.patientName}</h4>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                        item.isNewPatient ? 'bg-amber-100 text-amber-800' : 'bg-cyan-50 text-cyan-700 border border-cyan-200/80'
                      }`}>
                        {item.isNewPatient ? 'New' : 'Reg'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      📞 {item.phone || 'No Phone'} {item.age ? `• ${item.age} yrs` : ''}
                    </p>
                  </div>

                  {/* Service & Doctor */}
                  <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold truncate">
                      <Stethoscope className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span className="truncate">{item.doctorName}</span>
                    </div>
                    <p className="text-[11px] text-cyan-700 font-semibold truncate">
                      {item.service}
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {isServing && (
                      <span className="text-[11px] font-black text-cyan-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse" /> In Cabin
                      </span>
                    )}
                    {isWaiting && (
                      <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Waiting
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Finished
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isWaiting && (
                      <button
                        onClick={() => handleStartConsultation(item.id)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
                      >
                        Call In
                      </button>
                    )}
                    {isServing && (
                      <button
                        onClick={() => handleMarkComplete(item.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};
