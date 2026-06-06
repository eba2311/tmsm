import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { MapPin, Clock, CheckCircle, QrCode } from 'lucide-react';

const seatStatusColors = { BOARDING: 'badge-warning', SCHEDULED: 'badge-info', DEPARTED: 'badge-gray', ARRIVED: 'badge-success', DELAYED: 'badge-danger', IN_TRANSIT: 'badge-info', CANCELLED: 'badge-danger' };

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Addis_Ababa' });
}

export default function Booking() {
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [result, setResult] = useState(null);

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules-booking'],
    queryFn: async () => {
      const { data } = await api.get('/schedules', {
        params: { limit: 40, status: 'SCHEDULED,BOARDING,DELAYED' },
      });
      return data.data || [];
    },
  });

  const { data: occData } = useQuery({
    queryKey: ['schedule-occ', selected?.id],
    queryFn: async () => {
      const { data } = await api.get(`/schedules/${selected.id}/occupancy`);
      return new Set(data.data.occupied || []);
    },
    enabled: !!selected && step === 2,
  });

  const occupied = occData || new Set();
  const totalSeats = selected?.totalSeats || 0;

  const bookMut = useMutation({
    mutationFn: async () => {
      const passengers = selectedSeats.map((seatNumber) => ({
        name: passengerName,
        phone: passengerPhone,
        seatNumber,
      }));
      
      // Create booking first
      const { data: b } = await api.post('/bookings', {
        scheduleId: selected.id,
        passengers,
        paymentMethod,
        boardingPoint: selected.route?.origin?.name || 'Terminal',
        droppingPoint: selected.route?.destination?.name || '',
      });
      const booking = b.data;

      // Create payment
      const fd = new FormData();
      fd.append('bookingId', booking.id);
      fd.append('method', paymentMethod);
      fd.append('amount', booking.totalAmount);
      if (evidenceFile) fd.append('receipt', evidenceFile);

      const { data: p } = await api.post('/payments', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Fetch updated booking with payment status
      const { data: updatedBooking } = await api.get(`/bookings/${booking.id}`);
      
      return { booking: updatedBooking.data, payment: p.data };
    },
    onSuccess: (payload) => {
      setResult(payload);
      setStep(5);
      qc.invalidateQueries({ queryKey: ['schedules-booking'] });
      qc.invalidateQueries({ queryKey: ['schedule-occ', selected?.id] });
      toast.success('Booking confirmed');
    },
    onError: (e) => {
      console.error('Booking error:', e);
      toast.error(e.response?.data?.message || 'Booking failed');
    },
  });

  const list = useMemo(
    () => schedules.filter((s) => !['DEPARTED', 'ARRIVED', 'CANCELLED'].includes(s.status)),
    [schedules]
  );

  const toggleSeat = (num) => {
    if (occupied.has(num)) return;
    if (selectedSeats.includes(num)) setSelectedSeats(selectedSeats.filter((s) => s !== num));
    else if (selectedSeats.length < 6) setSelectedSeats([...selectedSeats, num].sort((a, b) => a - b));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Booking & Tickets</h1>
        <p className="page-subtitle">REST booking engine + payments + QR (PostgreSQL)</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['Route', 'Seats', 'Passenger', 'Payment', 'Confirm'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
              ${i + 1 <= step ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}
            >
              {i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${i + 1 <= step ? 'text-primary' : 'text-gray-400'}`}>{s}</span>
            {i < 4 && <div className={`w-8 h-0.5 ${i + 1 < step ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          {list.length === 0 && <p className="text-sm text-gray-500">No schedules — seed the database.</p>}
          {list.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelected(s);
                setSelectedSeats([]);
                setStep(2);
              }}
              className="card w-full text-left flex items-center gap-4 cursor-pointer hover:ring-2 ring-primary/30 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sidebar">{s.route?.name || 'Route'}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {fmtTime(s.departureTime)}
                  </span>
                  <span>
                    {s.vehicle?.plateNumber} ({s.vehicle?.type})
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-gold-dark">
                  {s.fare} <span className="text-xs">ETB</span>
                </p>
                <p className="text-xs text-gray-400">
                  {s.availableSeats}/{s.totalSeats} seats
                </p>
              </div>
              <span className={seatStatusColors[s.status] || 'badge-gray'}>{s.status}</span>
            </button>
          ))}
        </div>
      )}

      {step === 2 && selected && (
        <div className="card">
          <h3 className="font-semibold text-sidebar mb-3">Select seats — {selected.route?.name}</h3>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-4">
            {Array.from({ length: totalSeats }, (_, i) => i + 1).map((num) => {
              const taken = occupied.has(num);
              const isSelected = selectedSeats.includes(num);
              return (
                <button
                  key={num}
                  type="button"
                  disabled={taken}
                  onClick={() => toggleSeat(num)}
                  className={`w-full aspect-square rounded-lg text-xs font-bold transition-all
                    ${taken ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : isSelected ? 'bg-primary text-white ring-2 ring-primary/30 scale-105'
                      : 'bg-etgreen/10 text-etgreen hover:bg-etgreen/20'}`}
                >
                  {num}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-etgreen/10" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-primary" /> Selected
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-200" /> Booked
            </span>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button type="button" onClick={() => setStep(3)} disabled={selectedSeats.length === 0} className="btn-primary flex-1">
              Continue ({selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} • {selectedSeats.length * selected.fare} ETB)
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card max-w-lg">
          <h3 className="font-semibold text-sidebar mb-3">Passenger Information</h3>
          <div className="space-y-3">
            <input placeholder="Full Name" value={passengerName} onChange={(e) => setPassengerName(e.target.value)} className="input" />
            <input placeholder="Phone (+251…)" value={passengerPhone} onChange={(e) => setPassengerPhone(e.target.value)} className="input" />
          </div>
          <div className="flex gap-3 mt-5">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary">
              Back
            </button>
            <button type="button" onClick={() => setStep(4)} disabled={!passengerName || !passengerPhone} className="btn-primary flex-1">
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      {step === 4 && selected && (
        <div className="card max-w-lg">
          <h3 className="font-semibold text-sidebar mb-3">Payment — ክፍያ</h3>
          <div className="bg-surface rounded-xl p-4 mb-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Route</span>
              <span className="font-medium">{selected.route?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Seats</span>
              <span className="font-medium">{selectedSeats.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Passenger</span>
              <span className="font-medium">{passengerName}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
              <span className="font-bold text-sidebar">Total</span>
              <span className="font-bold text-gold-dark text-lg">{selectedSeats.length * selected.fare} ETB</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {['CASH', 'TELEBIRR', 'CBE_BIRR', 'CARD'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setPaymentMethod(m);
                  if (m === 'CASH') setEvidenceFile(null);
                }}
                className={`p-3 rounded-xl text-sm font-medium border-2 transition
                  ${paymentMethod === m ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
              >
                {m.replace('_', ' ')}
              </button>
            ))}
          </div>

          {paymentMethod !== 'CASH' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-sidebar mb-1 uppercase tracking-wider">
                Payment Evidence (Receipt/Screenshot)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setEvidenceFile(e.target.files[0])}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              <p className="text-[10px] text-gray-400 mt-1">Upload proof of transaction to avoid cancellation.</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(3)} className="btn-secondary">
              Back
            </button>
            <button 
              type="button" 
              className="btn-primary flex-1" 
              disabled={bookMut.isPending || (paymentMethod !== 'CASH' && !evidenceFile)} 
              onClick={() => bookMut.mutate()}
            >
              {bookMut.isPending ? 'Processing…' : 'Confirm & Pay'}
            </button>
          </div>
        </div>
      )}

      {step === 5 && result && (
        <div className="card max-w-lg text-center animate-slide-up">
          <div className="w-16 h-16 mx-auto rounded-full bg-etgreen/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-etgreen" />
          </div>
          <h3 className="text-lg font-bold text-sidebar mb-1">Booking Confirmed!</h3>
          <p className="text-sm text-gray-500 mb-4">ቦታዎ ተመዝግቧል — Ref {result.booking.bookingRef}</p>
          {result.booking.qrCode && (
            <img src={result.booking.qrCode} alt="Ticket QR" className="w-44 h-44 mx-auto rounded-xl border mb-4" />
          )}
          {!result.booking.qrCode && (
            <div className="w-32 h-32 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <QrCode className="w-16 h-16 text-gray-400" />
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setSelected(null);
              setSelectedSeats([]);
              setPassengerName('');
              setPassengerPhone('');
              setResult(null);
            }}
            className="btn-primary"
          >
            Book Another Ticket
          </button>
        </div>
      )}
    </div>
  );
}
