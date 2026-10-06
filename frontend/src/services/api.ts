import type {
  ProjectListItem,
  ProjectDetail,
  FieldMapping,
  SheetConnectResponse,
  SheetDataResponse,
  SheetValidationResult,
  JobStatus,
  CertificateItem,
  SampleTemplate,
} from '../types';

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('CUSTOM_API_URL');
    const staleDomains = ['patients-apply-hand-ntsc', 'gap-vintage-gets-tabs'];
    const isStale = custom && staleDomains.some(d => custom.includes(d));
    if (custom && custom.trim() && !isStale) {
      return `${custom.trim().replace(/\/$/, '')}/api/v1`;
    }
  }
  const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
  return rawBase ? `${rawBase.replace(/\/$/, '')}/api/v1` : '/api/v1';
}

export function getRawApiHost(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('CUSTOM_API_URL');
    const staleDomains = ['patients-apply-hand-ntsc', 'gap-vintage-gets-tabs'];
    const isStale = custom && staleDomains.some(d => custom.includes(d));
    if (custom && custom.trim() && !isStale) {
      return custom.trim().replace(/\/$/, '');
    }
  }
  const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
  return rawBase ? rawBase.replace(/\/$/, '') : (typeof window !== 'undefined' ? window.location.origin : '');
}

export async function checkApiHealth(customUrl?: string): Promise<{ ok: boolean; message: string }> {
  try {
    const base = customUrl ? customUrl.trim().replace(/\/$/, '') : getRawApiHost();
    if (!base) return { ok: false, message: 'No API server configured' };
    const res = await fetch(`${base}/api/health`, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' }
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, message: `Connected (${data.app || 'API'} v${data.version || '1.0'})` };
    }
    return { ok: false, message: `Server returned HTTP ${res.status}` };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Connection failed' };
  }
}

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  headers.set('Bypass-Tunnel-Reminder', 'true');
  return fetch(input, { ...init, headers });
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export const api = {
  // Projects
  async getProjects(): Promise<ProjectListItem[]> {
    const res = await apiFetch(`${getApiBase()}/projects`);
    return handleResponse<ProjectListItem[]>(res);
  },

  async createProject(name: string): Promise<ProjectDetail> {
    const res = await apiFetch(`${getApiBase()}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return handleResponse<ProjectDetail>(res);
  },

  async getProject(projectId: string): Promise<ProjectDetail> {
    const res = await apiFetch(`${getApiBase()}/projects/${projectId}`);
    return handleResponse<ProjectDetail>(res);
  },

  async updateProject(projectId: string, data: Partial<ProjectDetail>): Promise<ProjectDetail> {
    const res = await apiFetch(`${getApiBase()}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<ProjectDetail>(res);
  },

  async deleteProject(projectId: string): Promise<void> {
    const res = await apiFetch(`${getApiBase()}/projects/${projectId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  // Templates
  async uploadTemplate(projectId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('file', file);
    const res = await apiFetch(`${getApiBase()}/templates/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  async getSampleTemplates(): Promise<SampleTemplate[]> {
    const res = await apiFetch(`${getApiBase()}/templates/samples`);
    return handleResponse<SampleTemplate[]>(res);
  },

  async useSampleTemplate(projectId: string, sampleFilename: string): Promise<any> {
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('sample_filename', sampleFilename);
    const res = await apiFetch(`${getApiBase()}/templates/use-sample`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  getTemplatePreviewUrl(projectId: string, version?: string): string {
    return `${getApiBase()}/templates/${projectId}/preview${version ? `?v=${encodeURIComponent(version)}` : ''}`;
  },

  getTemplateDirectUrl(projectId: string): string {
    return `${getApiBase()}/templates/${projectId}/preview`;
  },

  // Field Mappings
  async getMappings(projectId: string): Promise<FieldMapping[]> {
    const res = await apiFetch(`${getApiBase()}/mappings/${projectId}`);
    return handleResponse<FieldMapping[]>(res);
  },

  async saveMappings(projectId: string, mappings: FieldMapping[]): Promise<FieldMapping[]> {
    const res = await apiFetch(`${getApiBase()}/mappings/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mappings }),
    });
    return handleResponse<FieldMapping[]>(res);
  },

  // Google Sheets
  async connectSheet(sheetUrl: string): Promise<SheetConnectResponse> {
    const res = await apiFetch(`${getApiBase()}/sheets/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet_url: sheetUrl }),
    });
    return handleResponse<SheetConnectResponse>(res);
  },

  async getSheetData(sheetUrl: string, tabName: string): Promise<SheetDataResponse> {
    const res = await apiFetch(`${getApiBase()}/sheets/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet_url: sheetUrl, tab_name: tabName, max_preview_rows: 500 }),
    });
    return handleResponse<SheetDataResponse>(res);
  },

  async getDemoParticipants(): Promise<SheetDataResponse> {
    const res = await apiFetch(`${getApiBase()}/sheets/demo`);
    return handleResponse<SheetDataResponse>(res);
  },

  async validateSheet(projectId: string, rows: Record<string, any>[]): Promise<SheetValidationResult> {
    const res = await apiFetch(`${getApiBase()}/sheets/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, rows }),
    });
    return handleResponse<SheetValidationResult>(res);
  },

  async validateProjectData(projectId: string, rows: Record<string, any>[]): Promise<SheetValidationResult> {
    return this.validateSheet(projectId, rows);
  },

  // Generation & Preview
  async previewSingle(projectId: string, rowData: Record<string, any>, outputFormat = 'png', mappings?: FieldMapping[]): Promise<{ preview_url: string; participant_name: string; filename: string }> {
    const res = await apiFetch(`${getApiBase()}/generate/preview-single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, row_data: rowData, output_format: outputFormat, mappings }),
    });
    return handleResponse(res);
  },

  async previewSingleCertificate(projectId: string, rowData: Record<string, any>, outputFormat = 'png', mappings?: FieldMapping[]): Promise<{ preview_url: string; participant_name: string; filename: string }> {
    return this.previewSingle(projectId, rowData, outputFormat, mappings);
  },

  async startGeneration(projectId: string, rows: Record<string, any>[], outputFormat: string, namingPattern: string): Promise<JobStatus> {
    const res = await apiFetch(`${getApiBase()}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        rows,
        output_format: outputFormat,
        naming_pattern: namingPattern,
      }),
    });
    return handleResponse<JobStatus>(res);
  },

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const res = await apiFetch(`${getApiBase()}/generate/jobs/${jobId}`);
    return handleResponse<JobStatus>(res);
  },

  // Certificates
  async getCertificates(projectId: string): Promise<{ total: number; certificates: CertificateItem[] }> {
    const res = await apiFetch(`${getApiBase()}/certificates/${projectId}`);
    return handleResponse<{ total: number; certificates: CertificateItem[] }>(res);
  },

  getCertificateDownloadUrl(certificateId: string): string {
    return `${getApiBase()}/certificates/${certificateId}/download`;
  },

  getCertificatePreviewUrl(certificateId: string): string {
    return `${getApiBase()}/certificates/${certificateId}/preview`;
  },

  getAllCertificatesZipUrl(projectId: string): string {
    return `${getApiBase()}/certificates/${projectId}/download-all`;
  },
};
