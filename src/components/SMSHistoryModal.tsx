import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Search, 
  Phone, 
  ShieldCheck,
  ExternalLink,
  Clock
} from 'lucide-react';
import { SMSLogEntry } from '../types';
import { smsService, formatSriLankanPhone } from '../services/smsService';
import toast from 'react-hot-toast';

interface SMSHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SMSHistoryModal: React.FC<SMSHistoryModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<SMSLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Quick Test Form
  const [testPhone, setTestPhone] = useState('0771234567');
  const [testMessage, setTestMessage] = useState('Dear Customer, test notification from SMV Holdings microfinance system. Gateway Text.lk active.');
  const [sendingTest, setSendingTest] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const history = await smsService.getHistory();
      setLogs(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const handleSendTestSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;

    setSendingTest(true);
    const toastId = toast.loading(`Sending SMS to ${testPhone}...`);
    try {
      const res = await smsService.sendCustomSMS(testPhone, testMessage);
      if (res.success) {
        toast.success(`SMS dispatched successfully to ${res.recipient}!`, { id: toastId });
        fetchLogs();
      } else {
        toast.error(`SMS Failed: ${res.message || res.error}`, { id: toastId });
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(`SMS Transmission error: ${err.message}`, { id: toastId });
    } finally {
      setSendingTest(false);
    }
  };

  const handleResend = async (log: SMSLogEntry) => {
    const toastId = toast.loading(`Resending SMS to ${log.originalPhone || log.recipient}...`);
    try {
      const res = await smsService.sendCustomSMS(log.originalPhone || log.recipient, log.message);
      if (res.success) {
        toast.success(`SMS resent to ${res.recipient}!`, { id: toastId });
        fetchLogs();
      } else {
        toast.error(`Failed to resend: ${res.message}`, { id: toastId });
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(`Resend error: ${err.message}`, { id: toastId });
    }
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter(l => 
    (l.customerName && l.customerName.toLowerCase().includes(search.toLowerCase())) ||
    (l.recipient && l.recipient.includes(search)) ||
    (l.originalPhone && l.originalPhone.includes(search)) ||
    (l.loanId && l.loanId.toLowerCase().includes(search.toLowerCase())) ||
    (l.message && l.message.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Text.lk SMS Notification Gateway</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  API Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Automated SMS alerts for loan payments, balance updates & settlement confirmations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition flex items-center gap-1"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Quick Gateway Status & Test SMS Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 mb-3">
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Gateway Configuration</span>
                <span className="text-[11px] text-slate-500">
                  Endpoint: <code className="bg-slate-200/80 px-1 py-0.5 rounded text-[10px]">https://app.text.lk/api/v3/sms/send</code>
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Auto-dispatch enabled on all collections</span>
              </div>
            </div>

            <form onSubmit={handleSendTestSMS} className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-4">
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Test Recipient Mobile</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="077XXXXXXX"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Test Message</label>
                <input
                  type="text"
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingTest ? 'Sending...' : 'Test Send'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search SMS logs by borrower, loan ID, phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredLogs.length} transmissions
            </div>
          </div>

          {/* SMS Transmission Log List */}
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200/80 text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No SMS transmissions found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Record a payment or send a test message to see real-time SMS delivery records.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map(log => {
                const isSuccess = log.status === 'SENT' || log.status === 'DELIVERED';

                return (
                  <div
                    key={log.id}
                    className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:border-slate-300 transition text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isSuccess ? (
                          <span className="p-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-200/60">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1 bg-rose-50 text-rose-600 rounded-md border border-rose-200/60">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div>
                          <span className="font-bold text-slate-900">
                            {log.customerName || 'Direct Recipient'}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px] ml-2">
                            {log.recipient} {log.originalPhone && log.originalPhone !== log.recipient ? `(${log.originalPhone})` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {log.loanId && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] font-semibold rounded-md border border-blue-200/60">
                            {log.loanId}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}>
                          {log.status}
                        </span>
                        <span className="text-slate-400 text-[10px] flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {log.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/60 font-mono text-[11px] text-slate-700 leading-relaxed">
                      "{log.message}"
                    </div>

                    {/* Footer error or resend button */}
                    <div className="flex items-center justify-between text-[11px]">
                      {log.error ? (
                        <span className="text-rose-600 font-medium">Error: {log.error}</span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Delivered via Text.lk API</span>
                      )}

                      <button
                        onClick={() => handleResend(log)}
                        className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend SMS</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            SMV Holdings • Text.lk SMS Gateway Integration
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
