export interface ProjectListItem {
  id: str;
  name: string;
  template_original_name?: string;
  template_file_type?: string;
  template_preview_image?: string;
  sheet_tab_name?: string;
  certificates_count: number;
  last_generated_at?: string;
  created_at: string;
  updated_at: string;
}

type str = string;

export interface ProjectDetail {
  id: string;
  name: string;
  template_filename?: string;
  template_original_name?: string;
  template_file_type?: string;
  template_preview_image?: string;
  template_width: number;
  template_height: number;
  sheet_url?: string;
  sheet_id?: string;
  sheet_tab_name?: string;
  naming_pattern: string;
  output_format: 'pdf' | 'png' | 'jpg';
  certificates_count: number;
  created_at: string;
  updated_at: string;
}

export interface FieldMapping {
  id?: string;
  placeholder: string;
  sheet_column?: string | null;
  font_family: string;
  font_size: number;
  font_color: string;
  font_weight: string;
  is_italic?: boolean;
  opacity?: number;
  text_case?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letter_spacing?: number;
  x_pos: number;
  y_pos: number;
  width: number;
  height: number;
  alignment: 'center' | 'left' | 'right';
  is_auto_detected: boolean;
  is_required: boolean;
}

export interface SheetTabInfo {
  title: string;
  sheet_id?: number;
  row_count?: number;
}

export interface SheetConnectResponse {
  spreadsheet_id: string;
  spreadsheet_title: string;
  tabs: SheetTabInfo[];
}

export interface SheetDataResponse {
  spreadsheet_id: string;
  tab_name: string;
  headers: string[];
  total_rows: number;
  preview_rows: Record<string, any>[];
  all_rows: Record<string, any>[];
}

export interface ValidationErrorItem {
  row_number: number;
  column_name?: string;
  issue_type: string;
  message: string;
  severity: 'error' | 'warning';
  row_data?: Record<string, any>;
}

export interface SheetValidationResult {
  is_valid: boolean;
  total_rows: number;
  valid_rows_count: number;
  error_count: number;
  warning_count: number;
  issues: ValidationErrorItem[];
}

export interface JobStatus {
  id: string;
  project_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  total_rows: number;
  processed_rows: number;
  progress_percentage: number;
  successful_count: number;
  failed_count: number;
  current_participant?: string;
  error_log: Array<{ row?: number; participant?: string; error: string }>;
  zip_ready: boolean;
  created_at: string;
  completed_at?: string;
}

export interface CertificateItem {
  id: string;
  project_id: string;
  participant_name: string;
  row_index: number;
  filename: string;
  output_format: string;
  file_size: number;
  status: 'generated' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface SampleTemplate {
  filename: string;
  title: string;
  file_type: string;
  size: number;
}
