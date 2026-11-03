const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errDetail = 'Request failed';
    try {
      const errJson = await res.json();
      errDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errDetail = res.statusText;
    }
    throw new Error(errDetail);
  }

  return res.json();
}

export const api = {
  // Health & System
  getHealth: () => request<any>('/health'),
  getSystemStatus: () => request<any>('/settings/system/status'),

  // Documents
  getDocuments: (params?: { search?: string; status?: string; document_type?: string; limit?: number; skip?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.document_type) q.append('document_type', params.document_type);
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.skip) q.append('skip', String(params.skip));
    return request<{ total: number; items: any[] }>(`/documents?${q.toString()}`);
  },
  getDocumentDetail: (id: string) => request<any>(`/documents/${id}`),
  uploadDocument: async (file: File, autoProcess = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('auto_process', String(autoProcess));
    formData.append('workspace_slug', 'default');
    return request<any>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },
  triggerProcess: (id: string, method = 'hybrid') =>
    request<any>(`/documents/${id}/process?method=${method}`, { method: 'POST' }),
  deleteDocument: (id: string) => request<any>(`/documents/${id}`, { method: 'DELETE' }),

  // Queue & Jobs
  getJobs: (status?: string) => {
    const q = status ? `?status=${status}` : '';
    return request<{ jobs: any[] }>(`/jobs${q}`);
  },
  cancelJob: (id: string) => request<any>(`/jobs/${id}/cancel`, { method: 'POST' }),

  // Human Review
  getReviewQueue: (status = 'pending') => request<{ tasks: any[]; total: number }>(`/review/queue?status=${status}`),
  acceptReview: (taskId: string) =>
    request<any>(`/review/${taskId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer: 'claims_operator', time_spent_seconds: 15.0 }),
    }),
  correctReview: (taskId: string, correctedValue: string, notes?: string) =>
    request<any>(`/review/${taskId}/correct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        corrected_value: correctedValue,
        reviewer: 'claims_operator',
        time_spent_seconds: 25.0,
        notes,
      }),
    }),

  // Extraction Lab
  getExtractionMethods: () => request<{ methods: any[] }>('/extraction/methods'),
  runExtraction: (documentId: string, methodId: string) =>
    request<any>('/extraction/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId, method_id: methodId }),
    }),

  // Datasets
  getDatasets: () => request<{ datasets: any[] }>('/datasets'),
  generateSyntheticDataset: (count = 6) =>
    request<any>('/datasets/generate-synthetic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_name: `Benchmark Test Set (${new Date().toLocaleTimeString()})`, count }),
    }),

  // Experiments
  getExperiments: () => request<{ experiments: any[] }>('/experiments'),
  createExperiment: (name: string, methods: string[]) =>
    request<any>('/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, configuration: { methods } }),
    }),
  runExperiment: (experimentId: string, datasetId?: string) =>
    request<any>(`/experiments/${experimentId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId }),
    }),

  // Evaluation
  getEvaluationRuns: () => request<{ runs: any[] }>('/evaluation/runs'),
  getEvaluationSummary: () => request<{ summary: any[] }>('/evaluation/summary'),

  // Cost & Economics
  getCostSummary: () => request<any>('/cost/summary'),
  getUnitEconomics: (volume = 10000, reviewRate = 0.12) =>
    request<any>(`/cost/unit-economics?monthly_volume=${volume}&review_rate=${reviewRate}`),

  // Security
  runSecurityAudit: () => request<any>('/security/run-audit', { method: 'POST' }),
  getSecurityResults: () => request<{ results: any[] }>('/security/results'),

  // Settings
  getSettings: () => request<{ settings: any }>('/settings'),
  updateSetting: (key: string, value: any) =>
    request<any>('/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    }),
};
