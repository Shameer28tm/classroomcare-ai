import {
  Campus, Building, Room, Asset, MaintenanceRequest, KnowledgeDocument,
  DocumentChunk, RAGQueryResponse, AgentRun, Notification, AuditLog,
  AnalyticsOverview, UserRole, RequestStatus, RequestPriority, RequestCategory
} from '../types';
import { supabase } from './supabase';

/**
 * Normalizes and validates the API base URL.
 * Never silently falls back to localhost in production.
 */
export function getNormalizedApiBase(): { url: string; error?: string } {
  const raw = import.meta.env.VITE_API_URL;
  if (raw && typeof raw === 'string' && raw.trim().length > 0) {
    const trimmed = raw.trim().replace(/\/+$/, '');
    // Prevent duplicate /api/v1 segments
    const normalized = trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
    return { url: normalized };
  }

  // Development environment fallback
  if (import.meta.env.DEV) {
    return { url: 'http://localhost:8000/api/v1' };
  }

  // Production with no configured API URL
  return {
    url: '',
    error: 'Production backend API is not configured. Please set VITE_API_URL in your Vercel project environment variables (targeting your FastAPI service).'
  };
}

export function isDemoModeActive(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_FIXTURES === 'true';
}

export function getApiConfigurationStatus(): { isConfigured: boolean; url: string; error?: string } {
  const { url, error } = getNormalizedApiBase();
  return {
    isConfigured: !error && Boolean(url),
    url,
    error,
  };
}

// Role & Campus Session State (Used in local interactive demo mode)
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

/**
 * Resolves request headers, including Supabase Auth Bearer tokens when available.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 1. Check for real Supabase authentication session
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch {
      // Graceful fallback if session lookup fails
    }
  }

  // 2. Demo role context (strictly in non-production demo mode)
  if (isDemoModeActive()) {
    const role = getActiveRole();
    headers['X-User-Role'] = role;
    headers['X-Campus-Id'] = getActiveCampusId();
    headers['X-User-Id'] = role === 'technician' ? 'tech-hvac-001' : 'usr-facmgr-001';
    headers['X-User-Email'] = role === 'facilities_manager' ? 'demo.facmgr@local.test' : `demo.${role}@local.test`;
  }

  return headers;
}

/**
 * Executes a network fetch with timeout, normalized URL, and user-friendly error wrapping.
 */
async function safeFetch(endpoint: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const { url: baseUrl, error: configError } = getNormalizedApiBase();
  if (configError) {
    throw new Error(configError);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  const authHeaders = await getAuthHeaders();
  const mergedHeaders: Record<string, string> = {
    ...authHeaders,
    ...((options.headers as Record<string, string>) || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: mergedHeaders,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`API request timed out after ${timeoutMs / 1000}s. Check backend server connectivity.`);
    }
    if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
      throw new Error(`Unable to connect to ClassroomCare API at ${baseUrl}. Ensure the backend service is running and CORS allows ${window.location.origin}.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parses JSON response with detailed error message extraction.
 */
async function parseResponseOrThrow<T>(res: Response, defaultErrorMsg: string): Promise<T> {
  if (!res.ok) {
    let detail = defaultErrorMsg;
    try {
      const body = await res.json();
      detail = body.detail || body.message || `${defaultErrorMsg} (HTTP ${res.status})`;
    } catch {
      detail = `${defaultErrorMsg} (HTTP ${res.status}: ${res.statusText || 'Server Error'})`;
    }
    throw new Error(detail);
  }
  try {
    return await res.json() as T;
  } catch {
    throw new Error('Malformed JSON received from ClassroomCare API.');
  }
}

export const api = {
  // Facilities & Campus Infrastructure
  async getCampuses(): Promise<Campus[]> {
    const res = await safeFetch('/facilities/campuses');
    return await parseResponseOrThrow<Campus[]>(res, 'Failed to load campuses from server');
  },

  async getBuildings(campusId: string): Promise<Building[]> {
    const res = await safeFetch(`/facilities/buildings?campus_id=${encodeURIComponent(campusId)}`);
    return await parseResponseOrThrow<Building[]>(res, `Failed to load buildings for campus ${campusId}`);
  },

  async getRooms(buildingId: string): Promise<Room[]> {
    const res = await safeFetch(`/facilities/rooms?building_id=${encodeURIComponent(buildingId)}`);
    return await parseResponseOrThrow<Room[]>(res, `Failed to load rooms for building ${buildingId}`);
  },

  async getAssets(roomId?: string): Promise<Asset[]> {
    const endpoint = roomId ? `/facilities/assets?room_id=${encodeURIComponent(roomId)}` : '/facilities/assets';
    const res = await safeFetch(endpoint);
    return await parseResponseOrThrow<Asset[]>(res, 'Failed to load equipment assets');
  },

  // Maintenance Requests / Tickets
  async getTickets(params?: { category?: string; priority?: string; status?: string; building_id?: string; assigned_to?: string }): Promise<MaintenanceRequest[]> {
    const query = new URLSearchParams({ campus_id: getActiveCampusId() });
    if (params?.category) query.append('category', params.category);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.status) query.append('status', params.status);
    if (params?.building_id) query.append('building_id', params.building_id);
    if (params?.assigned_to) query.append('assigned_to', params.assigned_to);

    const res = await safeFetch(`/tickets?${query.toString()}`);
    return await parseResponseOrThrow<MaintenanceRequest[]>(res, 'Failed to retrieve maintenance requests');
  },

  async getTicket(id: string): Promise<MaintenanceRequest | null> {
    const res = await safeFetch(`/tickets/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    return await parseResponseOrThrow<MaintenanceRequest>(res, `Failed to fetch ticket ${id}`);
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
    const res = await safeFetch('/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await parseResponseOrThrow<MaintenanceRequest>(res, 'Failed to create maintenance request');
  },

  async assignTicket(ticketId: string, technicianId: string, technicianName: string): Promise<MaintenanceRequest> {
    const res = await safeFetch(`/tickets/${encodeURIComponent(ticketId)}/assign`, {
      method: 'POST',
      body: JSON.stringify({ technician_id: technicianId, technician_name: technicianName }),
    });
    return await parseResponseOrThrow<MaintenanceRequest>(res, 'Failed to assign technician');
  },

  async updateTicketStatus(ticketId: string, status: RequestStatus, notes?: string): Promise<MaintenanceRequest> {
    const res = await safeFetch(`/tickets/${encodeURIComponent(ticketId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
    return await parseResponseOrThrow<MaintenanceRequest>(res, 'Failed to update request status');
  },

  async recordEvidence(ticketId: string, payload: { notes: string; parts_used?: any[]; evidence_urls?: string[]; checklist_completed?: boolean }): Promise<MaintenanceRequest> {
    const res = await safeFetch(`/tickets/${encodeURIComponent(ticketId)}/evidence`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await parseResponseOrThrow<MaintenanceRequest>(res, 'Failed to record maintenance evidence');
  },

  async verifyResolution(ticketId: string, approved: boolean, feedback?: string): Promise<MaintenanceRequest> {
    const res = await safeFetch(`/tickets/${encodeURIComponent(ticketId)}/verify`, {
      method: 'POST',
      body: JSON.stringify({ approved, feedback }),
    });
    return await parseResponseOrThrow<MaintenanceRequest>(res, 'Failed to verify resolution');
  },

  // Knowledge & RAG Assistant
  async getDocuments(): Promise<KnowledgeDocument[]> {
    const res = await safeFetch(`/knowledge/documents?campus_id=${encodeURIComponent(getActiveCampusId())}`);
    return await parseResponseOrThrow<KnowledgeDocument[]>(res, 'Failed to load knowledge documents');
  },

  async getChunks(documentId?: string): Promise<DocumentChunk[]> {
    const endpoint = documentId
      ? `/knowledge/chunks?document_id=${encodeURIComponent(documentId)}`
      : '/knowledge/chunks';
    const res = await safeFetch(endpoint);
    return await parseResponseOrThrow<DocumentChunk[]>(res, 'Failed to load document chunks');
  },

  async queryRAGAssistant(query: string, categoryFilter?: string): Promise<RAGQueryResponse> {
    const res = await safeFetch('/knowledge/query', {
      method: 'POST',
      body: JSON.stringify({
        campus_id: getActiveCampusId(),
        query,
        category_filter: categoryFilter,
      }),
    });
    return await parseResponseOrThrow<RAGQueryResponse>(res, 'Failed to query technical knowledge assistant');
  },

  async uploadDocument(formData: FormData): Promise<KnowledgeDocument> {
    const { url: baseUrl, error: configError } = getNormalizedApiBase();
    if (configError) throw new Error(configError);

    const authHeaders = await getAuthHeaders();
    delete authHeaders['Content-Type'];

    const res = await fetch(`${baseUrl}/knowledge/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    return await parseResponseOrThrow<KnowledgeDocument>(res, 'Failed to upload knowledge document');
  },

  // Autonomous Agent
  async getAgentRuns(): Promise<AgentRun[]> {
    const res = await safeFetch(`/agent/runs?campus_id=${encodeURIComponent(getActiveCampusId())}`);
    return await parseResponseOrThrow<AgentRun[]>(res, 'Failed to retrieve autonomous agent activity');
  },

  async triggerAgentTriage(ticketId: string): Promise<AgentRun> {
    const res = await safeFetch(`/agent/triage/${encodeURIComponent(ticketId)}`, {
      method: 'POST',
    });
    return await parseResponseOrThrow<AgentRun>(res, 'Failed to trigger autonomous agent triage');
  },

  // Analytics, Notifications & Audit Logs
  async getAnalytics(): Promise<AnalyticsOverview> {
    const res = await safeFetch(`/analytics/overview?campus_id=${encodeURIComponent(getActiveCampusId())}`);
    return await parseResponseOrThrow<AnalyticsOverview>(res, 'Failed to load operations analytics overview');
  },

  async getNotifications(): Promise<Notification[]> {
    const res = await safeFetch(`/notifications?campus_id=${encodeURIComponent(getActiveCampusId())}`);
    return await parseResponseOrThrow<Notification[]>(res, 'Failed to load notification feed');
  },

  async markNotificationRead(id: string): Promise<void> {
    const res = await safeFetch(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'POST',
    });
    await parseResponseOrThrow<{ status: string }>(res, 'Failed to update notification state');
  },

  async getAuditLogs(entityType?: string): Promise<AuditLog[]> {
    const endpoint = entityType
      ? `/audit/logs?campus_id=${encodeURIComponent(getActiveCampusId())}&entity_type=${encodeURIComponent(entityType)}`
      : `/audit/logs?campus_id=${encodeURIComponent(getActiveCampusId())}`;
    const res = await safeFetch(endpoint);
    return await parseResponseOrThrow<AuditLog[]>(res, 'Failed to load compliance audit logs');
  },
};
