import React, { useState, useEffect } from 'react';
import {
  Building2,
  DoorOpen,
  Cpu,
  Layers,
  AlertCircle
} from 'lucide-react';
import { api, getActiveCampusId } from '../lib/api';
import { Building, Room, Asset } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { NIU_CONFIG } from '../config/institution';

export const Facilities: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getBuildings(getActiveCampusId())
      .then((blds: Building[]) => {
        setBuildings(blds);
        if (blds.length > 0) {
          setSelectedBuilding(blds[0]);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to load campus facilities.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      api.getRooms(selectedBuilding.id)
        .then((rms: Room[]) => {
          setRooms(rms);
          if (rms.length > 0) {
            setSelectedRoom(rms[0]);
          } else {
            setSelectedRoom(null);
          }
        })
        .catch(() => setRooms([]));
    }
  }, [selectedBuilding]);

  useEffect(() => {
    if (selectedRoom) {
      api.getAssets(selectedRoom.id)
        .then((asts: Asset[]) => {
          setAssets(asts);
        })
        .catch(() => setAssets([]));
    } else {
      setAssets([]);
    }
  }, [selectedRoom]);

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Campus Facilities & Equipment Registry</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {NIU_CONFIG.institutionName} · Campus infrastructure, verified academic blocks, and equipment tracking
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Database Communication Error: {error}</span>
          </div>
        </div>
      )}

      {/* Buildings Selection Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {buildings.map((b) => {
          const isSelected = selectedBuilding?.id === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setSelectedBuilding(b)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all shrink-0 shadow-xs ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{b.name}</span>
              <span className="font-mono text-[10px] opacity-80">({b.code})</span>
            </button>
          );
        })}
      </div>

      {/* Building Emergency Specs */}
      {selectedBuilding && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg text-blue-600 border border-slate-200 shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{selectedBuilding.name} Specs</div>
              <div className="text-[11px] text-slate-600">
                Floors: {selectedBuilding.floors} · Emergency Utility Coordinates:{' '}
                <strong className="text-slate-900">{selectedBuilding.emergency_shutoff_coords}</strong>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px] rounded font-semibold">
            Operational
          </span>
        </div>
      )}

      {/* Two Column Grid: Rooms & Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rooms Column */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
            <DoorOpen className="w-4 h-4 text-blue-600" />
            Classrooms & Labs ({rooms.length})
          </h3>
          <div className="space-y-2">
            {rooms.map((r) => {
              const isSelected = selectedRoom?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoom(r)}
                  className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                    <span>Room {r.room_number}</span>
                    <span className="text-[10px] text-emerald-800 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 font-semibold">
                      {r.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">{r.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Floor {r.floor} · Capacity: {r.capacity} Seats · {r.room_type}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assets Column */}
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              Equipment Assets in {selectedRoom ? `Room ${selectedRoom.room_number}` : 'Selected Space'} ({assets.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Registry Verified</span>
          </div>

          {assets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
              No registered equipment assets recorded in this classroom space.
            </div>
          ) : (
            <div className="space-y-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{asset.name}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
                        Model: <strong className="text-slate-800">{asset.model_number}</strong> · S/N: {asset.serial_number}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono rounded font-semibold">
                      {asset.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-500 block font-medium">Warranty Expiry</span>
                      <span className="font-mono text-slate-800">{asset.warranty_expiry}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Last Inspection</span>
                      <span className="font-mono text-slate-800">{asset.last_inspected_at || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Next PM Due</span>
                      <span className="font-mono text-emerald-700 font-semibold">{asset.next_pm_due || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
