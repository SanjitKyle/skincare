/**
 * Queue & Token Storage Manager
 * Handles local persistence, priority scoring, audio chimes, and ticket numbering.
 */

const STORAGE_KEY = 'dental_clinic_daily_queue_v2';
const LAST_DATE_KEY = 'dental_clinic_queue_date';

export const PRIORITY_LEVELS = {
  EMERGENCY: {
    key: 'EMERGENCY',
    label: 'Emergency',
    rank: 1,
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
    iconText: '🚨',
    description: 'Severe trauma, acute bleeding, acute distress (Jumps to front)'
  },
  URGENT: {
    key: 'URGENT',
    label: 'Urgent',
    rank: 2,
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
    iconText: '⚡',
    description: 'Severe toothache, swelling, urgent relief'
  },
  SENIOR: {
    key: 'SENIOR',
    label: 'Senior / Special',
    rank: 3,
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
    iconText: '🧓',
    description: 'Elderly patients, pediatric or mobility assistance'
  },
  APPOINTMENT: {
    key: 'APPOINTMENT',
    label: 'Booked Visit',
    rank: 4,
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200',
    dotClass: 'bg-teal-500',
    iconText: '📅',
    description: 'Scheduled appointment arriving on time'
  },
  NORMAL: {
    key: 'NORMAL',
    label: 'Regular Walk-in',
    rank: 5,
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
    iconText: '🚶',
    description: 'Standard walk-in consultation'
  }
};

export const QUEUE_STATUS = {
  WAITING: 'WAITING',
  IN_CONSULTATION: 'IN_CONSULTATION',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  CANCELLED: 'CANCELLED'
};

// Clean empty queue initialization (No dummy data)
const getInitialSampleQueue = () => [];

/**
 * Loads today's queue from localStorage. Resets token sequence daily.
 */
export const loadQueueFromStorage = () => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem(LAST_DATE_KEY);
    const rawData = localStorage.getItem(STORAGE_KEY);

    if (savedDate !== todayStr || !rawData) {
      localStorage.setItem(LAST_DATE_KEY, todayStr);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }

    const parsed = JSON.parse(rawData);
    // If parsed still contains old dummy seed data (TOK-101 to TOK-105), purge them
    if (Array.isArray(parsed) && parsed.some(p => p.id === 'TOK-101' || p.patientName === 'Rohan Deshmukh')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }

    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load queue from storage:', err);
    return [];
  }
};

/**
 * Saves queue to localStorage and dispatches storage event for cross-component sync
 */
export const saveQueueToStorage = (queueList) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queueList));
    // Trigger custom window event so Header and other components update reactively
    window.dispatchEvent(new Event('clinicQueueUpdated'));
  } catch (err) {
    console.error('Failed to save queue:', err);
  }
};

/**
 * Sorts queue according to clinical priority:
 * 1. IN_CONSULTATION first
 * 2. WAITING ordered by Priority Rank (1 to 5), then by Token Number (FIFO)
 * 3. SKIPPED ordered by Token Number
 * 4. COMPLETED / CANCELLED ordered by recency
 */
export const sortQueueByPriority = (items = []) => {
  return [...items].sort((a, b) => {
    // 1. In consultation is always pinned top
    if (a.status === QUEUE_STATUS.IN_CONSULTATION && b.status !== QUEUE_STATUS.IN_CONSULTATION) return -1;
    if (b.status === QUEUE_STATUS.IN_CONSULTATION && a.status !== QUEUE_STATUS.IN_CONSULTATION) return 1;

    // 2. Both waiting: order by priority rank first, then by token number
    if (a.status === QUEUE_STATUS.WAITING && b.status === QUEUE_STATUS.WAITING) {
      const rankA = PRIORITY_LEVELS[a.priority]?.rank || 5;
      const rankB = PRIORITY_LEVELS[b.priority]?.rank || 5;
      if (rankA !== rankB) {
        return rankA - rankB; // Lower rank number = higher priority
      }
      return a.tokenNumber - b.tokenNumber;
    }

    // 3. Waiting comes before Skipped/Completed
    if (a.status === QUEUE_STATUS.WAITING) return -1;
    if (b.status === QUEUE_STATUS.WAITING) return 1;

    // 4. Skipped comes before Completed
    if (a.status === QUEUE_STATUS.SKIPPED && b.status !== QUEUE_STATUS.SKIPPED) return -1;
    if (b.status === QUEUE_STATUS.SKIPPED && a.status !== QUEUE_STATUS.SKIPPED) return 1;

    // 5. Completed / Cancelled: sorted by latest token
    return b.tokenNumber - a.tokenNumber;
  });
};

/**
 * Generates the next sequential token number for today
 */
export const getNextTokenNumber = (currentQueue = []) => {
  const maxToken = currentQueue.reduce((max, item) => Math.max(max, Number(item.tokenNumber) || 0), 0);
  const nextNum = maxToken + 1;
  return {
    tokenNumber: nextNum,
    tokenCode: `T-${String(nextNum).padStart(2, '0')}`
  };
};

/**
 * Play a pleasant medical clinic chime using Web Audio API (no external file needed!)
 */
export const playClinicChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Two-tone airport/hospital chime: 587Hz (D5) -> 880Hz (A5)
    playTone(587.33, 0, 0.4);
    playTone(880.00, 0.25, 0.6);
  } catch (e) {
    console.log('Audio chime not supported or allowed by browser policy', e);
  }
};
