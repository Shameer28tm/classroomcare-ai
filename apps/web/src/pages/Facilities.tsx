import React, { useState, useEffect } from 'react';
import {
  Building2,
  DoorOpen,
  Cpu,
  Layers,
  AlertCircle,
  Plus,
  RefreshCw,
  X
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

  // Modals
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Building form fields
  const [bldCode, setBldCode] = useState('');
  const [bldName, setBldName] = useState('');
  const [bldFloors, setBldFloors] = useState(3);
  const [bldShutoff, setBldShutoff] = useState('');

  // Room form fields
  const [roomNum, setRoomNum] = useState('');
  const [roomFloor, setRoomFloor] = useState(1);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('Lecture Hall');
  const [roomCapacity, setRoomCapacity] = useState(40);

  const loadBuildings = () => {
    setLoading(true);
    setError(null);
    api.getBuildings(getActiveCampusId())
      .then((blds: Building[]) => {
        setBuildings(blds);
        if (blds.length > 0) {
          setSelectedBuilding((prev) => (prev && blds.some(b => b.id === prev.id) ? prev : blds[0]));
        } else {
          setSelectedBuilding(null);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to load campus facilities.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      api.getRooms(selectedBuilding.id)
        .then((rms: Room[]) => {
          setRooms(rms);
          if (rms.length > 0) {
            setSelectedRoom((prev) => (prev && rms.some(r => r.id === prev.id) ? prev : rms[0]));
          } else {
            setSelectedRoom(null);
          }
        })
        .catch(() => setRooms([]));
    } else {
      setRooms([]);
      setSelectedRoom(null);
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

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bldCode.trim() || !bldName.trim()) {
      setModalError('Building code and name are required.');
      return;
    }
    setSubmitting(true);
    setModalError('');
    try {
      const newBld: Building = {
        id: `bld-${bldCode.trim().toLowerCase()}-${Date.now().toString().slice(-4)}`,
        campus_id: getActiveCampusId(),
        code: bldCode.trim().toUpperCase(),
        name: bldName.trim(),
        floors: Number(bldFloors) || 1,
        emergency_shutoff_coords: bldShutoff.trim() || 'Utility Core Ground Floor (Main Panel)'
      };
      await api.createBuilding(newBld);
      setBuildings((prev) => [...prev, newBld]);
      setSelectedBuilding(newBld);
      setIsAddBuildingOpen(false);
      setBldCode('');
      setBldName('');
      setBldShutoff('');
    } catch (err: any) {
      setModalError(err?.message || 'Failed to create building record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding || !roomNum.trim() || !roomName.trim()) {
      setModalError('Room number and name are required.');
      return;
    }
    setSubmitting(true);
    setModalError('');
    try {
      const newRoom: Room = {
        id: `room-${selectedBuilding.code.toLowerCase()}-${roomNum.trim()}-${Date.now().toString().slice(-3)}`,
        campus_id: getActiveCampusId(),
        building_id: selectedBuilding.id,
        room_number: roomNum.trim(),
        floor: Number(roomFloor) || 1,
        name: roomName.trim(),
        capacity: Number(roomCapacity) || 30,
        room_type: roomType,
        status: 'Available'
      };
      await api.createRoom(newRoom);
      setRooms((prev) => [...prev, newRoom]);
      setSelectedRoom(newRoom);
      setIsAddRoomOpen(false);
      setRoomNum('');
      setRoomName('');
    } catch (err: any) {
      setModalError(err?.message || 'Failed to create room record.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Campus Buildings & Facilities Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {NIU_CONFIG.institutionName} · Campus infrastructure, verified academic blocks, classrooms, and assets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBuildings}
            className="p-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-xs transition-colors"
            title="Refresh facilities list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setModalError('');
              setIsAddBuildingOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Building
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Database Communication Notice: {error}</span>
          </div>
          <button
            onClick={loadBuildings}
            className="px-3 py-1 bg-white hover:bg-red-100 text-red-700 border border-red-300 rounded font-semibold text-xs shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Buildings Selection Pills or Empty State */}
      {buildings.length === 0 ? (
        <div className="p-8 bg-white border border-dashed border-slate-300 rounded-xl text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">No Campus Buildings Registered</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              There are currently no academic blocks or campus facilities recorded in the database.
              Authorized facilities managers can register new buildings or apply seed fixtures.
            </p>
          </div>
          <button
            onClick={() => {
              setModalError('');
              setIsAddBuildingOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            + Register Campus Building
          </button>
        </div>
      ) : (
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
      )}

      {/* Building Emergency Specs */}
      {selectedBuilding && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg text-blue-600 border border-slate-200 shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{selectedBuilding.name} ({selectedBuilding.code}) Specs</div>
              <div className="text-[11px] text-slate-600">
                Floors: {selectedBuilding.floors} · Emergency Utility Coordinates:{' '}
                <strong className="text-slate-900">{selectedBuilding.emergency_shutoff_coords || 'Standard Panel Utility Core'}</strong>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px] rounded font-semibold">
            Operational
          </span>
        </div>
      )}

      {/* Two Column Grid: Rooms & Assets */}
      {selectedBuilding && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rooms Column */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <DoorOpen className="w-4 h-4 text-blue-600" />
                Classrooms & Labs ({rooms.length})
              </h3>
              <button
                onClick={() => {
                  setModalError('');
                  setIsAddRoomOpen(true);
                }}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Room
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg space-y-2">
                <p>No classrooms or labs recorded for {selectedBuilding.name}.</p>
                <button
                  onClick={() => {
                    setModalError('');
                    setIsAddRoomOpen(true);
                  }}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-lg border border-blue-200 hover:bg-blue-100 text-xs"
                >
                  + Add Room / Lab
                </button>
              </div>
            ) : (
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
            )}
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
      )}

      {/* Add Building Modal */}
      {isAddBuildingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsAddBuildingOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-md"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Register Campus Building
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Adds an academic or administrative building to the institutional registry.
            </p>
            {modalError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {modalError}
              </div>
            )}
            <form onSubmit={handleCreateBuilding} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Building Code *</label>
                <input
                  type="text"
                  placeholder="e.g. AERO, CSE, LIB"
                  value={bldCode}
                  onChange={(e) => setBldCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 outline-none uppercase font-mono shadow-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Building Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Aerospace Engineering Block"
                  value={bldName}
                  onChange={(e) => setBldName(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 outline-none shadow-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Floors</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={bldFloors}
                  onChange={(e) => setBldFloors(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 outline-none shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Utility Location</label>
                <input
                  type="text"
                  placeholder="e.g. Ground Floor Utility Core A-1 (Main Breaker)"
                  value={bldShutoff}
                  onChange={(e) => setBldShutoff(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 outline-none shadow-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBuildingOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {isAddRoomOpen && selectedBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsAddRoomOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-md"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-blue-600" />
              Add Classroom in {selectedBuilding.name}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Registers a classroom, laboratory, or lecture hall to this building.
            </p>
            {modalError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {modalError}
              </div>
            )}
            <form onSubmit={handleCreateRoom} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 101, 204"
                    value={roomNum}
                    onChange={(e) => setRoomNum(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 outline-none shadow-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Level</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={roomFloor}
                    onChange={(e) => setRoomFloor(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 outline-none shadow-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Space Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Avionics & Flight Simulator Lab"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 outline-none shadow-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 outline-none shadow-xs"
                  >
                    <option value="Lecture Hall">Lecture Hall</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Classroom">Classroom</option>
                    <option value="Seminar Room">Seminar Room</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 focus:border-blue-600 outline-none shadow-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
