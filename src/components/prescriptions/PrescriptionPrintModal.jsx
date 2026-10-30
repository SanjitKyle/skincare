import React, { useRef, useContext } from 'react';
import { X, Printer, Pill } from 'lucide-react';
import { ContextProvider } from '../../context/store';

export const PrescriptionPrintModal = ({
  isOpen,
  onClose,
  prescription = null,
  clinicName = "Care Clinic",
  clinicAddress = "Kothrud, Pune - 411038",
  clinicPhone = "094233 80390",
  clinicTiming = "09:00 AM - 02:00 PM | Closed: Thursday"
}) => {
  const printRef = useRef(null);
  const { Patients, Doctors } = useContext(ContextProvider) || {};

  if (!isOpen || !prescription) return null;

  const safePatients = Array.isArray(Patients) ? Patients : (Array.isArray(Patients?.data) ? Patients.data : []);
  const safeDoctors = Array.isArray(Doctors) ? Doctors : (Array.isArray(Doctors?.data) ? Doctors.data : []);

  // Resolve Patient
  const pId = typeof prescription.patientId === 'object' ? (prescription.patientId?._id || prescription.patientId?.id) : prescription.patientId;
  const foundP = safePatients.find((p) => String(p._id || p.id) === String(pId));
  const patient = foundP || (typeof prescription.patientId === 'object' ? prescription.patientId : null);

  const patientName = patient?.full_name || patient?.name || prescription.patientName || 'DEMO PATIENT';
  const patientAge = patient?.age || prescription.patientAge || '—';
  const patientGender = (patient?.gender || prescription.patientGender || 'M').charAt(0).toUpperCase();
  const patientAddress = patient?.address || prescription.patientAddress || 'Pune';
  const patientWeight = prescription.vitalsSnapshot?.weight || patient?.weight || '—';
  const patientHeight = prescription.vitalsSnapshot?.height || patient?.height || '—';
  const patientBP = prescription.vitalsSnapshot?.bloodPressure || '120/80 mmHg';

  // Resolve Doctor
  const dId = typeof prescription.doctorId === 'object' ? (prescription.doctorId?._id || prescription.doctorId?.id) : prescription.doctorId;
  const foundD = safeDoctors.find((d) => String(d._id || d.id) === String(dId));
  const doctor = foundD || (typeof prescription.doctorId === 'object' ? prescription.doctorId : null);

  const doctorName = doctor?.full_name || doctor?.name || prescription.doctorName || 'Dr. Onkar Bhave';
  const doctorQual = doctor?.qualification || 'M.B.B.S., M.D., M.S.';
  const doctorReg = doctor?.reg_no || doctor?.registrationNumber || '270988';

  const rxNumber = prescription.prescriptionNumber || `RX-${(prescription._id || '').slice(-6).toUpperCase()}`;
  const rxDate = prescription.createdAt
    ? new Date(prescription.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

  const followUpDateStr = prescription.followUpDate
    ? new Date(prescription.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    : '';

  // Robust, fully-styled Isolated iframe print
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    // Create a temporary hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    document.body.appendChild(iframe);

    // Write content into the iframe and trigger print
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Prescription_${rxNumber}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #0f172a;
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          </style>
        </head>
        <body onload="window.print();">
            ${content.innerHTML}
        </body>
        </html>
    `);
    doc.close();

    // Clean up the iframe after the print dialog finishes
    iframe.contentWindow.onafterprint = function () {
      document.body.removeChild(iframe);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] my-auto">

        {/* Top Modal Controls */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">Prescription Letterhead</span>
              <span className="text-xs font-mono font-bold text-slate-400 ml-2">({rxNumber})</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Rx / Save PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE LETTERHEAD AREA */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-900">
          <div
            ref={printRef}
            style={{
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto',
              fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              color: '#0f172a'
            }}
          >

            {/* 1. Executive Clinic & Doctor Letterhead Header */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
              <tbody>
                <tr>
                  {/* Doctor Info Left */}
                  <td style={{ verticalAlign: 'top', width: '58%', paddingBottom: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '46px', verticalAlign: 'top' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontWeight: '900',
                              fontSize: '22px',
                              lineHeight: '40px',
                              textAlign: 'center',
                              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
                            }}>
                              ✚
                            </div>
                          </td>
                          <td style={{ verticalAlign: 'top', paddingLeft: '10px' }}>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f2942', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                              {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#0d9488', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                              {doctorQual}
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: '600', color: '#64748b', marginTop: '1px' }}>
                              Reg. No: <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#334155' }}>{doctorReg}</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>

                  {/* Clinic Info Right */}
                  <td style={{ verticalAlign: 'top', width: '42%', textAlign: 'right', paddingBottom: '10px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0284c7', letterSpacing: '-0.2px', lineHeight: '1.2' }}>
                      {clinicName}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginTop: '2px' }}>
                      {clinicAddress}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px', lineHeight: '1.4' }}>
                      📞 {clinicPhone} <br />
                      ⏰ {clinicTiming}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Gradient Accent Rule */}
            <div style={{
              height: '3px',
              background: 'linear-gradient(90deg, #0284c7 0%, #0d9488 50%, #3b82f6 100%)',
              borderRadius: '2px',
              marginBottom: '12px'
            }} />

            {/* Date & Rx Identifier Strip */}
            <table style={{ width: '100%', marginBottom: '12px', fontSize: '11px' }}>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: '700', color: '#64748b' }}>
                    Prescription ID: <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0f172a' }}>{rxNumber}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Date of Consultation:</span> {rxDate}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 2. Patient Demographics & Clinical Summary Card */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #0284c7',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '11px',
              lineHeight: '1.6'
            }}>
              {/* Row 1: Patient Name, ID, Age/Sex */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: 'top', width: '65%' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Patient Details:
                      </span>{' '}
                      <span style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>
                        {patientName.toUpperCase()}
                      </span>{' '}
                      <span style={{ fontWeight: '800', color: '#0284c7' }}>
                        ({patientGender}) / {patientAge} Yrs
                      </span>
                    </td>
                    <td style={{ verticalAlign: 'top', width: '35%', textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>UHID / ID: </span>
                      <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0f172a' }}>
                        {prescription.patientId?._id?.slice(-6) || '14'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Row 2: Vitals Badges */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '6px 0',
                borderTop: '1px dashed #e2e8f0',
                borderBottom: '1px dashed #e2e8f0',
                color: '#334155',
                fontWeight: '600',
                fontSize: '11px'
              }}>
                <span>⚖️ <strong>Weight:</strong> {patientWeight} kg</span>
                <span style={{ color: '#cbd5e1' }}>&bull;</span>
                <span>📏 <strong>Height:</strong> {patientHeight} cm</span>
                <span style={{ color: '#cbd5e1' }}>&bull;</span>
                <span>🩺 <strong>BP:</strong> {patientBP}</span>
                <span style={{ color: '#cbd5e1' }}>&bull;</span>
                <span>📍 <strong>Address:</strong> {patientAddress}</span>
              </div>

              {/* Row 3: Assessment and mapped treatment areas */}
              <div style={{ paddingTop: '6px' }}>
                <span style={{ fontWeight: '800', color: '#0f172a' }}>Clinical Diagnosis: </span>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  fontWeight: '800',
                  padding: '1px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  marginRight: '8px'
                }}>
                  * {Array.isArray(prescription.diagnosis) ? prescription.diagnosis.join(', ') : (prescription.diagnosis || 'Skin care consultation')}
                </span>

                {prescription.toothNumbers && prescription.toothNumbers.length > 0 && (
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontWeight: '800',
                    padding: '1px 8px',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}>
                    Treatment area IDs: {prescription.toothNumbers.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* 3. Classical Rx Symbol Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '10px',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '28px',
                fontWeight: '900',
                fontFamily: "'Times New Roman', Georgia, serif",
                color: '#0284c7',
                lineHeight: '1'
              }}>
                ℞
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Medication Order &bull; Take as directed
              </span>
            </div>

            {/* 4. Medications Table */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '16px',
              fontSize: '11px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#0f2942',
                  color: '#ffffff',
                  textAlign: 'left'
                }}>
                  <th style={{ padding: '8px 10px', fontWeight: '800', width: '38px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '8px 10px', fontWeight: '800', width: '45%' }}>Medicine Name &amp; Composition</th>
                  <th style={{ padding: '8px 10px', fontWeight: '800', width: '35%' }}>Dosage &amp; Timing</th>
                  <th style={{ padding: '8px 10px', fontWeight: '800', width: '15%', textAlign: 'right' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {(prescription.medications || []).map((m, idx) => {
                  const formPrefix = (m.dosageForm || 'Tab').toUpperCase();
                  const freq = m.frequency || 'TDS';
                  const timing = m.timing || 'After Food';
                  const durationVal = m.duration?.value || 5;
                  const durationUnit = m.duration?.unit || 'Days';
                  const qty = m.quantity ? `(Total: ${m.quantity} ${formPrefix === 'TAB' ? 'Tabs' : formPrefix === 'CAP' ? 'Caps' : 'Units'})` : '';

                  return (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    >
                      {/* Sr Number */}
                      <td style={{ padding: '10px 8px', verticalAlign: 'top', textAlign: 'center', fontWeight: '800', color: '#64748b' }}>
                        {idx + 1}
                      </td>

                      {/* Medicine & Generic Name */}
                      <td style={{ padding: '10px 10px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '13px', letterSpacing: '-0.2px' }}>
                          <span style={{ color: '#0284c7', marginRight: '4px' }}>{formPrefix}.</span>
                          {m.medicineName.toUpperCase()} {m.strength ? `(${m.strength})` : ''}
                        </div>
                        {m.genericName && (
                          <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '1px' }}>
                            Composition: {m.genericName}
                          </div>
                        )}
                        {m.instructions && (
                          <div style={{
                            display: 'inline-block',
                            fontSize: '10px',
                            color: '#1d4ed8',
                            fontWeight: '700',
                            backgroundColor: '#eff6ff',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginTop: '4px'
                          }}>
                            💡 {m.instructions}
                          </div>
                        )}
                      </td>

                      {/* Dosage Schedule */}
                      <td style={{ padding: '10px 10px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '12px' }}>
                          {m.dosage || '1 dose'} &bull; <span style={{ color: '#0d9488' }}>{freq}</span>
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#475569', marginTop: '2px' }}>
                          🍽️ {timing}
                        </div>
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '10px 10px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '12px' }}>
                          {durationVal} {durationUnit}
                        </div>
                        {qty && (
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                            {qty}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 5. Clinical Advice & Dietary Precautions */}
            <div style={{
              backgroundColor: '#fafaf9',
              border: '1px solid #e7e5e4',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '11px',
              lineHeight: '1.6'
            }}>
              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                📋 General Clinical Advice &amp; Instructions:
              </div>
              <div style={{ color: '#334155', paddingLeft: '4px' }}>
                &bull; {prescription.generalAdvice || "Follow the practitioner's skin-care and aftercare instructions."}
              </div>
              {prescription.diagnosticTestsAdvised && prescription.diagnosticTestsAdvised.length > 0 && (
                <div style={{ color: '#1d4ed8', fontWeight: '700', paddingLeft: '4px', marginTop: '3px' }}>
                  &bull; Diagnostic Radiographs / Investigations Advised: {prescription.diagnosticTestsAdvised.join(', ')}
                </div>
              )}
            </div>

            {/* 6. Next Follow-up & Review Box */}
            {followUpDateStr && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '8px 14px',
                marginBottom: '20px',
                fontSize: '11px'
              }}>
                <div>
                  <span style={{ fontWeight: '800', color: '#1e40af' }}>🗓️ Next Follow-Up Review: </span>
                  <span style={{ fontWeight: '900', color: '#0f172a', fontSize: '12px' }}>{followUpDateStr}</span>
                  {prescription.followUpInstructions && (
                    <span style={{ color: '#475569', marginLeft: '6px' }}>({prescription.followUpInstructions})</span>
                  )}
                </div>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#2563eb' }}>
                  Please bring this Rx sheet during follow-up
                </span>
              </div>
            )}

            {/* 7. Doctor's Signature Block with Realistic Digital Ink */}
            <table style={{ width: '100%', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <tbody>
                <tr>
                  {/* Left: Patient Instructions */}
                  <td style={{ verticalAlign: 'top', width: '55%', fontSize: '10px', color: '#64748b', lineHeight: '1.5' }}>
                    <p style={{ margin: 0, fontWeight: '700', color: '#475569' }}>Important Notice:</p>
                    <p style={{ margin: '2px 0 0' }}>
                      1. Please complete the full antibiotic course even if symptoms subside.<br />
                      2. In case of allergic reactions, rash, or breathing difficulty, stop medicine and contact clinic immediately.<br />
                      3. Substitution allowed with exact generic equivalent if prescribed brand is unavailable.
                    </p>
                  </td>

                  {/* Right: Signature & Stamp */}
                  <td style={{ verticalAlign: 'top', width: '45%', textAlign: 'center', paddingLeft: '20px' }}>
                    <div style={{
                      fontFamily: "'Caveat', cursive, 'Brush Script MT', 'Segoe Script'",
                      fontSize: '32px',
                      fontWeight: '700',
                      color: '#1d4ed8',
                      lineHeight: '1',
                      marginBottom: '4px',
                      letterSpacing: '1px',
                      transform: 'rotate(-2deg)'
                    }}>
                      {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
                    </div>
                    <div style={{ borderTop: '1.5px solid #0f172a', width: '180px', margin: '0 auto 4px auto' }} />
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>
                      {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#0d9488' }}>
                      {doctorQual}
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>
                      Reg. No: {doctorReg} &bull; Authorized Medical Signatory
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 8. Bottom Legal Footer */}
            <div style={{
              marginTop: '20px',
              paddingTop: '8px',
              borderTop: '1px dashed #cbd5e1',
              textAlign: 'center',
              fontSize: '9px',
              color: '#94a3b8',
              lineHeight: '1.4'
            }}>
              This is a digital medical prescription issued by a Registered Medical Practitioner under NMC guidelines. &bull; Helpline: {clinicPhone} &bull; Keep Smiling! 😊
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
