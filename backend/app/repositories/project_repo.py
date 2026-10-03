from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.entities import Project, ProjectFieldMapping, Certificate, GenerationJob

class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_projects(self) -> List[Dict[str, Any]]:
        # Query projects with certificate counts and last generated job/certificate
        projects = self.db.query(Project).order_by(Project.updated_at.desc()).all()
        results = []
        for p in projects:
            cert_count = self.db.query(func.count(Certificate.id)).filter(
                Certificate.project_id == p.id,
                Certificate.status == "generated"
            ).scalar() or 0
            
            latest_cert = self.db.query(Certificate.created_at).filter(
                Certificate.project_id == p.id
            ).order_by(Certificate.created_at.desc()).first()

            results.append({
                "id": p.id,
                "name": p.name,
                "template_original_name": p.template_original_name,
                "template_file_type": p.template_file_type,
                "template_preview_image": p.template_preview_image,
                "sheet_tab_name": p.sheet_tab_name,
                "certificates_count": cert_count,
                "last_generated_at": latest_cert[0] if latest_cert else None,
                "created_at": p.created_at,
                "updated_at": p.updated_at
            })
        return results

    def get_project(self, project_id: str) -> Optional[Project]:
        return self.db.query(Project).filter(Project.id == project_id).first()

    def create_project(self, name: str) -> Project:
        project = Project(name=name)
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update_project(self, project_id: str, **kwargs) -> Optional[Project]:
        project = self.get_project(project_id)
        if not project:
            return None
        for key, value in kwargs.items():
            if hasattr(project, key) and value is not None:
                setattr(project, key, value)
        project.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete_project(self, project_id: str) -> bool:
        project = self.get_project(project_id)
        if not project:
            return False
        self.db.delete(project)
        self.db.commit()
        return True

    def get_mappings(self, project_id: str) -> List[ProjectFieldMapping]:
        return self.db.query(ProjectFieldMapping).filter(
            ProjectFieldMapping.project_id == project_id
        ).order_by(ProjectFieldMapping.created_at.asc()).all()

    def set_mappings(self, project_id: str, mappings_data: List[Dict[str, Any]]) -> List[ProjectFieldMapping]:
        # Delete existing mappings and insert new ones
        self.db.query(ProjectFieldMapping).filter(ProjectFieldMapping.project_id == project_id).delete()
        
        new_mappings = []
        for m in mappings_data:
            mapping = ProjectFieldMapping(
                project_id=project_id,
                placeholder=m.get("placeholder", "").strip(),
                sheet_column=m.get("sheet_column"),
                font_family=m.get("font_family", "Helvetica"),
                font_size=m.get("font_size", 24),
                font_color=m.get("font_color", "#1e293b"),
                font_weight=m.get("font_weight", "normal"),
                is_italic=bool(m.get("is_italic", False)),
                opacity=float(m.get("opacity", 1.0) if m.get("opacity") is not None else 1.0),
                text_case=str(m.get("text_case", "none")),
                letter_spacing=int(m.get("letter_spacing", 0) if m.get("letter_spacing") is not None else 0),
                x_pos=float(m.get("x_pos", 421.0)),
                y_pos=float(m.get("y_pos", 297.0)),
                width=float(m.get("width", 300.0)),
                height=float(m.get("height", 40.0)),
                alignment=m.get("alignment", "center"),
                is_auto_detected=bool(m.get("is_auto_detected", False)),
                is_required=bool(m.get("is_required", True))
            )
            self.db.add(mapping)
            new_mappings.append(mapping)
            
        self.db.commit()
        return new_mappings

    def get_certificates(self, project_id: str) -> List[Certificate]:
        return self.db.query(Certificate).filter(
            Certificate.project_id == project_id
        ).order_by(Certificate.row_index.asc()).all()

    def get_certificate(self, certificate_id: str) -> Optional[Certificate]:
        return self.db.query(Certificate).filter(Certificate.id == certificate_id).first()

    def clear_certificates(self, project_id: str) -> None:
        self.db.query(Certificate).filter(Certificate.project_id == project_id).delete()
        self.db.commit()

    def add_certificate(self, certificate: Certificate) -> Certificate:
        self.db.add(certificate)
        self.db.commit()
        self.db.refresh(certificate)
        return certificate

    def create_job(self, project_id: str, total_rows: int) -> GenerationJob:
        job = GenerationJob(
            project_id=project_id,
            status="processing",
            total_rows=total_rows,
            processed_rows=0,
            successful_count=0,
            failed_count=0
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def get_job(self, job_id: str) -> Optional[GenerationJob]:
        return self.db.query(GenerationJob).filter(GenerationJob.id == job_id).first()

    def update_job(self, job_id: str, **kwargs) -> Optional[GenerationJob]:
        job = self.get_job(job_id)
        if not job:
            return None
        for key, value in kwargs.items():
            if hasattr(job, key):
                setattr(job, key, value)
        self.db.commit()
        self.db.refresh(job)
        return job
