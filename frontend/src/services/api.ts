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

const API_BASE = '/api/v1';

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
    const res = await fetch(`${API_BASE}/projects`);
    return handleResponse<ProjectListItem[]>(res);
  },

  async createProject(name: string): Promise<ProjectDetail> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return handleResponse<ProjectDetail>(res);
  },

  async getProject(projectId: string): Promise<ProjectDetail> {
    const res = await fetch(`${API_BASE}/projects/${projectId}`);
    return handleResponse<ProjectDetail>(res);
  },

  async updateProject(projectId: string, data: Partial<ProjectDetail>): Promise<ProjectDetail> {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<ProjectDetail>(res);
  },

  async deleteProject(projectId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  // Templates
  async uploadTemplate(projectId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/templates/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  async getSampleTemplates(): Promise<SampleTemplate[]> {
    const res = await fetch(`${API_BASE}/templates/samples`);
    return handleResponse<SampleTemplate[]>(res);
  },

  async useSampleTemplate(projectId: string, sampleFilename: string): Promise<any> {
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('sample_filename', sampleFilename);
    const res = await fetch(`${API_BASE}/templates/use-sample`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  getTemplatePreviewUrl(projectId: string, version?: string): string {
    return `${API_BASE}/templates/${projectId}/preview${version ? `?v=${encodeURIComponent(version)}` : ''}`;
  },

  getTemplateDirectUrl(projectId: string): string {
    return `${API_BASE}/templates/${projectId}/preview`;
  },

  // Field Mappings
  async getMappings(projectId: string): Promise<FieldMapping[]> {
    const res = await fetch(`${API_BASE}/mappings/${projectId}`);
    return handleResponse<FieldMapping[]>(res);
  },

  async saveMappings(projectId: string, mappings: FieldMapping[]): Promise<FieldMapping[]> {
    const res = await fetch(`${API_BASE}/mappings/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mappings }),
    });
    return handleResponse<FieldMapping[]>(res);
  },

  // Google Sheets
  async connectSheet(sheetUrl: string): Promise<SheetConnectResponse> {
    const res = await fetch(`${API_BASE}/sheets/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet_url: sheetUrl }),
    });
    return handleResponse<SheetConnectResponse>(res);
  },

  async getSheetData(sheetUrl: string, tabName: string): Promise<SheetDataResponse> {
    const res = await fetch(`${API_BASE}/sheets/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet_url: sheetUrl, tab_name: tabName, max_preview_rows: 500 }),
    });
    return handleResponse<SheetDataResponse>(res);
  },

  async getDemoParticipants(): Promise<SheetDataResponse> {
    const res = await fetch(`${API_BASE}/sheets/demo`);
    return handleResponse<SheetDataResponse>(res);
  },

  async validateSheet(projectId: string, rows: Record<string, any>[]): Promise<SheetValidationResult> {
    const res = await fetch(`${API_BASE}/sheets/validate`, {
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
    const res = await fetch(`${API_BASE}/generate/preview-single`, {
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
    const res = await fetch(`${API_BASE}/generate`, {
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
    const res = await fetch(`${API_BASE}/generate/jobs/${jobId}`);
    return handleResponse<JobStatus>(res);
  },

  // Certificates
  async getCertificates(projectId: string): Promise<{ total: number; certificates: CertificateItem[] }> {
    const res = await fetch(`${API_BASE}/certificates/${projectId}`);
    return handleResponse<{ total: number; certificates: CertificateItem[] }>(res);
  },

  getCertificateDownloadUrl(certificateId: string): string {
    return `${API_BASE}/certificates/${certificateId}/download`;
  },

  getCertificatePreviewUrl(certificateId: string): string {
    return `${API_BASE}/certificates/${certificateId}/preview`;
  },

  getAllCertificatesZipUrl(projectId: string): string {
    return `${API_BASE}/certificates/${projectId}/download-all`;
  },
};
