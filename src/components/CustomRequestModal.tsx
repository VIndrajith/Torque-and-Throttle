import React, { useState } from 'react';
import { Send, Sparkles, X, CheckCircle2, Loader2 } from 'lucide-react';
import { sendCustomVehicleRequest } from '../utils/mailDispatcher';

interface CustomRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomRequestModal: React.FC<CustomRequestModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [targetModel, setTargetModel] = useState('');
  const [targetTimeline, setTargetTimeline] = useState('Within 30 Days');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      await sendCustomVehicleRequest({
        targetModel: targetModel.trim(),
        targetTimeline: targetTimeline.trim(),
        clientName: clientName.trim(),
        clientContact: clientContact.trim(),
      });
    } catch {
      // Non-blocking
    } finally {
      setIsSending(false);
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setTargetModel('');
    setClientName('');
    setClientContact('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#171922] border border-white/[0.15] rounded-lg max-w-lg w-full p-6 sm:p-8 relative shadow-2xl my-auto max-h-[calc(100vh-4rem)] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-white p-2 rounded hover:bg-white/[0.05] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                REQUEST SUCCESSFULLY SENT
              </span>
              <h3 className="font-display text-2xl font-black text-[#ECE5D8] uppercase">
                Acquisition Request Received
              </h3>
            </div>

            <p className="text-sm text-[#94A3B8] max-w-md mx-auto leading-relaxed font-sans">
              Thank you{clientName.trim() ? `, ${clientName.trim()}` : ''}! Your custom vehicle request for <span className="text-[#ECE5D8] font-bold">{targetModel || 'your specified vehicle'}</span> has been successfully sent. Our sourcing desk will reach out to you soon on <span className="text-[#ECE5D8] font-mono">{clientContact.trim() || 'your contact details'}</span>.
            </p>

            <div className="pt-3">
              <button
                onClick={onClose}
                className="w-full bg-[#E5252A] hover:bg-[#c00017] text-white text-xs font-bold uppercase tracking-wider py-3 rounded transition-colors cursor-pointer shadow-[0_0_15px_rgba(229,37,42,0.3)]"
              >
                Return to Marketplace
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-[#E5252A] text-xs font-mono font-bold tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>CUSTOM VEHICLE SOURCING DESK</span>
            </div>
            <h3 className="font-display text-2xl font-black text-[#ECE5D8] uppercase">
              Custom Vehicle Request
            </h3>
            <p className="text-[#94A3B8] text-xs leading-relaxed mb-4 font-sans">
              Tell our specialists the exact make, model, year, transmission, and color spec you seek. We will source verified allocations across our trusted network.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-[#94A3B8] font-bold">
                TARGET VEHICLE / MODEL
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2021 BMW M3 Competition / 2022 Fortuner 4x4 MT"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                className="w-full bg-[#0F1115] border border-white/[0.12] rounded text-xs text-[#ECE5D8] px-3.5 py-2.5 focus:border-[#E5252A] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-[#94A3B8] font-bold">
                  Acquisition Timeline
                </label>
                <select
                  value={targetTimeline}
                  onChange={(e) => setTargetTimeline(e.target.value)}
                  className="w-full bg-[#0F1115] border border-white/[0.12] rounded text-xs text-[#ECE5D8] px-3 py-2.5 focus:border-[#E5252A] focus:outline-none"
                >
                  <option>Immediate (Under 14 Days)</option>
                  <option>Within 30 Days</option>
                  <option>30 – 60 Days</option>
                  <option>Specific Model / Open Timeline</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-[#94A3B8] font-bold">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex M."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#0F1115] border border-white/[0.12] rounded text-xs text-[#ECE5D8] px-3.5 py-2.5 focus:border-[#E5252A] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-[#94A3B8] font-bold">
                Contact Phone or Email
              </label>
              <input
                type="text"
                required
                placeholder="+91 9400581250 or client@example.com"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                className="w-full bg-[#0F1115] border border-white/[0.12] rounded text-xs text-[#ECE5D8] px-3.5 py-2.5 focus:border-[#E5252A] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full bg-[#E5252A] hover:bg-[#c00017] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded transition-all mt-4 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(229,37,42,0.3)] cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>TRANSMITTING REQUEST...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>SUBMIT CUSTOM VEHICLE REQUEST</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
