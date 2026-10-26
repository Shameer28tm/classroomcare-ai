import {
  Campus, Building, Room, Asset, MaintenanceRequest, KnowledgeDocument,
  DocumentChunk, RAGQueryResponse, AgentRun, Notification, AuditLog,
  AnalyticsOverview, UserRole, RequestStatus, RequestPriority, RequestCategory
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Role & Campus Session State (Stored in localStorage for interactive role testing)
export function getActiveRole(): UserRole {
  return (localStorage.getItem('classroomcare_role') as UserRole) || 'facilities_manager';
}

export function setActiveRole(role: UserRole) {
  localStorage.setItem('classroomcare_role', role);
  window.dispatchEvent(new Event('auth_role_changed'));
}

export function getActiveCampusId(): string {
  return localStorage.getItem('classroomcare_campus_id') || 'campus-main-01';
}

export function setActiveCampusId(campusId: string) {
  localStorage.setItem('classroomcare_campus_id', campusId);
  window.dispatchEvent(new Event('campus_changed'));
}

function getHeaders(): HeadersInit {
  const role = getActiveRole();
  return {
    'Content-Type': 'application/json',
    'X-User-Role': role,
    'X-Campus-Id': getActiveCampusId(),
    'X-User-Id': role === 'technician' ? 'tech-hvac-001' : 'usr-facmgr-001',
    'X-User-Email': role === 'facilities_manager' ? 'demo.facmgr@local.test' : `demo.${role}@local.test`,
  };
}

export const api = {
  // Facilities
  async getCampuses(): Promise<Campus[]> {
    const res = await fetch(`${API_BASE}/facilities/campuses`, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to load campuses from server (HTTP ${res.status}). Verify backend service and database connectivity.`);
    }
    return await res.json();
  },

  async getBuildings(campusId: string): Promise<Building[]> {
    const res = await fetch(`${API_BASE}/facilities/buildings?campus_id=${campusId}`, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to load buildings for campus ${campusId} (HTTP ${res.status}).`);
    }
    return await res.json();
  },

  async getRooms(buildingId: string): Promise<Room[]> {
    const res = await fetch(`${API_BASE}/facilities/rooms?building_id=${buildingId}`, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to load rooms for building ${buildingId} (HTTP ${res.status}).`);
    }
    return await res.json();
  },

  async getAssets(roomId?: string): Promise<Asset[]> {
    const url = roomId ? `${API_BASE}/facilities/assets?room_id=${roomId}` : `${API_BASE}/facilities/assets`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to load assets from server (HTTP ${res.status}).`);
    }
    return await res.json();
  },

  // Tickets
  async getTickets(params?: { category?: string; priority?: string; status?: string; building_id?: string; assigned_to?: string }): Promise<MaintenanceRequest[]> {
    const query = new URLSearchParams({ campus_id: getActiveCampusId() });
    if (params?.category) query.append('category', params.category);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.status) query.append('status', params.status);
    if (params?.building_id) query.append('building_id', params.building_id);
    if (params?.assigned_to) query.append('assigned_to', params.assigned_to);

    const res = await fetch(`${API_BASE}/tickets?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to retrieve maintenance requests (HTTP ${res.status}). Check server status.`);
    }
    return await res.json();
  },

  async getTicket(id: string): Promise<MaintenanceRequest | null> {
    const res = await fetch(`${API_BASE}/tickets/${id}`, { headers: getHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to fetch ticket ${id} (HTTP ${res.status}).`);
    }
    return await res.json();
  },

  async createTicket(payload: {
    campus_id: string;
    building_id: string;
    room_id: string;
    asset_id?: string;
    title: string;
    description: string;
    category?: RequestCategory;
    priority?: RequestPriority;
  }): Promise<MaintenanceRequest> {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create maintenance request' }));
      throw new Error(err.detail || 'Failed to create maintenance request');
    }
    return await res.json();
  },

  async assignTicket(ticketId: string, technicianId: string, technicianName: string): Promise<MaintenanceRequest> {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ technician_id: technicianId, technician_name: technicianName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to assign technician' }));
      throw new Error(err.detail || 'Failed to assign technician');
    }
    return await res.json();
  },

  async updateTicketStatus(ticketId: string, status: RequestStatus, notes?: string): Promise<MaintenanceRequest> {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update request status' }));
      throw new Error(err.detail || 'Failed to update request status');
    }
    return await res.json();
  },

  async recordEvidence(ticketId: string, payload: { notes: string; parts_used?: any[]; evidence_urls?: string[]; checklist_completed?: boolean }): Promise<MaintenanceRequest> {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/evidence`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to record maintenance evidence' }));
      throw new Error(err.detail || 'Failed to record maintenance evidence');
    }
    return await res.json();
  },

  async verifyResolution(ticketId: string, approved: boolean, feedback?: string): Promise<MaintenanceRequest> {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ approved, feedback }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to verify resolution' }));
      throw new Error(err.detail || 'Failed to verify resolution');
    }
    return await res.json();
  },

  // Knowledge & RAG
  async getDocuments(): Promise<KnowledgeDocument[]> {
    const res = await fetch(`${API_BASE}/knowledge/documents?campus_id=${getActiveCampusId()}`, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to load knowledge documents (HTTP ${res.status}).`);
    }
    return await res.json();
  },

  async getChunks(documentId?: string): Promise<DocumentChunk[]> {
    const url = documentId ? `${API_BASE}/knowledge/chunks?document_id=${documentId}` : `${API_BASE}/knowledge/chunks`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to load document chunks (HTTP ${res.status}).`);
    }
    return await res.json();
  },

  async queryRAGAssistant(query: string, categoryFilter?: string): Promise<RAGQueryResponse> {
    const res = await fetch(`${API_BASE}/knowledge/query`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        campus_id: getActiveCampusId(),
        query,
        category_filter: categoryFilter,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to query knowledge assistant' }));
      throw new Error(err.detail || 'Failed to query knowledge assistant');
    }
    return await res.json();
  },

  // Agent Runs
  async getAgentRuns(): Promise<AgentRun[]> {
    const res = await fetch(`${API_BASE}/agent/runs?campus_id=${getActiveCampusId()}`, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to retrieve autonomous agent activity (HTTP ${res.status}).`);
    }
    return await res.json();
  },

  async triggerAgentTriage(ticketId: string): Promise<AgentRun> {
    const res = await fetch(`${API_BASE}/agent/triage/${ticketId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to trigger agent triage' }));
      throw new Error(err.detail || 'Failed to trigger agent triage');
    }
    return await res.json();
  },

  // Analytics, Notifications, Audit
  async getAnalytics(): Promise<AnalyticsOverview> {
    const res = await fetch(`${API_BASE}/analytics/overview?campus_id=${getActiveCampusId()}`, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to load live analytics overview (HTTP ${res.status}).`);
    }
    return await res.json();
  },

  async getNotifications(): Promise<Notification[]> {
    const res = await fetch(`${API_BASE}/notifications?campus_id=${getActiveCampusId()}`, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to load notifications (HTTP ${res.status}).`);
    }
    return await res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to update notification state (HTTP ${res.status}).`);
    }
  },

  async getAuditLogs(entityType?: string): Promise<AuditLog[]> {
    const url = entityType
      ? `${API_BASE}/audit/logs?campus_id=${getActiveCampusId()}&entity_type=${entityType}`
      : `${API_BASE}/audit/logs?campus_id=${getActiveCampusId()}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to load audit logs (HTTP ${res.status}).`);
    }
    return await res.json();
  },
};
