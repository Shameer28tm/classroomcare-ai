import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { api, getActiveCampusId } from '../../lib/api';
import { Building, Room, Asset, RequestCategory, RequestPriority } from '../../types';

interface SubmitTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitTicketModal: React.FC<SubmitTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [category, setCategory] = useState<RequestCategory>('Other');
  const [priority, setPriority] = useState<RequestPriority>('MEDIUM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hazardAcknowledge, setHazardAcknowledge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getBuildings(getActiveCampusId())
        .then((blds) => {
          setBuildings(blds);
          if (blds.length > 0) {
            setSelectedBuilding(blds[0].id);
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch verified buildings list');
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedBuilding) {
      api.getRooms(selectedBuilding)
        .then((rms) => {
          setRooms(rms);
          if (rms.length > 0) setSelectedRoom(rms[0].id);
        })
        .catch(() => setRooms([]));
    }
  }, [selectedBuilding]);

  useEffect(() => {
    if (selectedRoom) {
      api.getAssets(selectedRoom)
        .then((asts) => setAssets(asts))
        .catch(() => setAssets([]));
    }
  }, [selectedRoom]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !selectedBuilding || !selectedRoom) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createTicket({
        campus_id: getActiveCampusId(),
        building_id: selectedBuilding,
        room_id: selectedRoom,
        asset_id: selectedAsset || undefined,
        title,
        description,
        category,
        priority: hazardAcknowledge ? 'EMERGENCY' : priority,
      });
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Error submitting maintenance request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-md"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-slate-900 mb-1">Submit Maintenance Request</h2>
        <p className="text-xs text-slate-500 mb-5">
          Reports undergo deterministic physical safety evaluation followed by LangGraph agent triage.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Building *</label>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none shadow-xs"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Lab *</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none shadow-xs"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number} ({r.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Asset (Optional)</label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none shadow-xs"
            >
              <option value="">General Facility / None</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.model_number})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RequestCategory)}
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none shadow-xs"
              >
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="HVAC">HVAC</option>
                <option value="Networking">Networking / AV</option>
                <option value="Structural">Structural</option>
                <option value="Laboratory Equipment">Lab Equipment</option>
                <option value="Furniture">Furniture</option>
                <option value="Fire Safety">Fire Safety</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Urgency</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RequestPriority)}
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none shadow-xs"
              >
                <option value="LOW">Low (7 Days)</option>
                <option value="MEDIUM">Medium (72 Hours)</option>
                <option value="HIGH">High (24 Hours)</option>
                <option value="CRITICAL">Critical (6 Hours)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Title *</label>
            <input
              type="text"
              placeholder="e.g., Fume hood warning buzzer sounding or Projector HDMI port dead"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              rows={3}
              placeholder="Provide exact symptoms, room location, or hazard indicators..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none shadow-xs"
            ></textarea>
          </div>

          {/* Life-Safety Self-Check Box */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hazardAcknowledge}
                onChange={(e) => setHazardAcknowledge(e.target.checked)}
                className="mt-0.5 rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <div className="text-[11px] text-red-900">
                <span className="font-semibold flex items-center gap-1 text-red-700">
                  <AlertTriangle className="w-3.5 h-3.5" /> Immediate Life-Safety Hazard?
                </span>
                Check if this involves active sparking, gas odor, burning smell, or water gushing near power panels.
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Analyzing & Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
