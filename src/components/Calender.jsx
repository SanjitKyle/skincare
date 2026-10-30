import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Appointments View
export const Appointments = () => {
  const today = new Date();
  
  const events = [
    {
      title: 'Root Canal - Michael Chen',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30),
    },
    {
      title: 'Checkup - Sarah Jenkins',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 45),
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Appointments Calendar</h2>
          <p className="text-sm text-slate-500 mt-1">Schedule and manage upcoming visits.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
          New Appointment
        </button>
      </div>

      <div className="saas-card flex-1 p-6 bg-white min-h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView="week"
          views={['month', 'week', 'day']}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
};
