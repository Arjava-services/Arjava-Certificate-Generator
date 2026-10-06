import re
import os
import io
import base64
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from PIL import Image, ImageDraw, ImageFont
import pymupdf as fitz
from app.config.settings import settings
from app.models.entities import Project, ProjectFieldMapping

# Safe filename regex
FILENAME_SAFE_REGEX = re.compile(r'[^a-zA-Z0-9_\-\.]')

def hex_to_rgb(color_val: str) -> Tuple[int, int, int]:
    """Convert hex or rgb string like #1e293b, #fff, rgb(17, 45, 50) to (R, G, B) tuple."""
    if not color_val:
        return (17, 45, 50)
    s = str(color_val).strip()
    if s.lower().startswith("rgb"):
        m = re.search(r'rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)', s, re.IGNORECASE)
        if m:
            return (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    s = s.lstrip("#")
    if len(s) == 3:
        s = "".join([c * 2 for c in s])
    if len(s) >= 6:
        try:
            return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))
        except ValueError:
            pass
    return (17, 45, 50)

def hex_to_pdf_color(color_val: str) -> Tuple[float, float, float]:
    """Convert hex color string like #1e293b to (r, g, b) float tuple 0.0-1.0."""
    r, g, b = hex_to_rgb(color_val)
    return (r / 255.0, g / 255.0, b / 255.0)

BASE_FONTS_DIR = Path(__file__).resolve().parent.parent / "assets" / "fonts"
WIN_FONTS_DIR = Path("C:/Windows/Fonts")

def resolve_font_path(family: str, font_weight: str = "normal", is_italic: bool = False) -> str:
    fam = (family or "").lower().strip()
    is_bold = str(font_weight).lower() in ["bold", "700", "800", "900", "semibold"]
    is_italic = bool(is_italic)

    def check_asset(name: str) -> Optional[str]:
        p = BASE_FONTS_DIR / name
        return str(p) if p.exists() else None

    def check_win(name: str) -> Optional[str]:
        p = WIN_FONTS_DIR / name
        return str(p) if p.exists() else None

    # 1. Cinzel Decorative
    if "cinzel decorative" in fam or "cinzeldecorative" in fam:
        if is_bold:
            f = check_asset("CinzelDecorative-Bold.ttf")
            if f: return f
        f = check_asset("CinzelDecorative-Regular.ttf")
        if f: return f

    # 2. Cinzel
    if "cinzel" in fam:
        f = check_asset("Cinzel-Regular.ttf")
        if f: return f

    # 3. Playfair Display
    if "playfair" in fam:
        if is_italic:
            f = check_asset("PlayfairDisplay-Italic.ttf")
            if f: return f
        f = check_asset("PlayfairDisplay-Regular.ttf")
        if f: return f

    # 4. Oswald
    if "oswald" in fam:
        f = check_asset("Oswald-Regular.ttf")
        if f: return f

    # 5. EB Garamond
    if "eb garamond" in fam or "ebgaramond" in fam:
        if is_italic:
            f = check_asset("EBGaramond-Italic.ttf")
            if f: return f
        f = check_asset("EBGaramond-Regular.ttf")
        if f: return f

    # 6. Garamond / Cormorant Garamond
    if "garamond" in fam:
        if is_bold:
            f = check_win("GARABD.TTF")
            if f: return f
        if is_italic:
            f = check_win("GARAIT.TTF") or check_asset("EBGaramond-Italic.ttf")
            if f: return f
        f = check_win("GARA.TTF") or check_asset("EBGaramond-Regular.ttf")
        if f: return f

    # 7. Dancing Script
    if "dancing" in fam:
        f = check_asset("DancingScript-Regular.ttf")
        if f: return f

    # 8. Great Vibes
    if "vibes" in fam:
        f = check_asset("GreatVibes-Regular.ttf")
        if f: return f

    # 9. Alex Brush / Brush Script
    if "alex" in fam or "brush" in fam:
        f = check_asset("AlexBrush-Regular.ttf") or check_win("BRUSHSCI.TTF")
        if f: return f

    # 10. Allura
    if "allura" in fam:
        f = check_asset("Allura-Regular.ttf")
        if f: return f

    # 11. Parisienne
    if "parisienne" in fam:
        f = check_asset("Parisienne-Regular.ttf")
        if f: return f

    # 12. Italianno
    if "italianno" in fam:
        f = check_asset("Italianno-Regular.ttf")
        if f: return f

    # 13. Sacramento
    if "sacramento" in fam:
        f = check_asset("Sacramento-Regular.ttf")
        if f: return f

    # 14. Tangerine
    if "tangerine" in fam:
        if is_bold:
            f = check_asset("Tangerine-Bold.ttf")
            if f: return f
        f = check_asset("Tangerine-Regular.ttf")
        if f: return f

    # 15. Prata
    if "prata" in fam:
        f = check_asset("Prata-Regular.ttf")
        if f: return f

    # 16. Marcellus
    if "marcellus" in fam:
        f = check_asset("Marcellus-Regular.ttf")
        if f: return f

    # 17. Lora
    if "lora" in fam:
        f = check_asset("Lora-Regular.ttf")
        if f: return f

    # 18. Poppins
    if "poppins" in fam:
        if is_bold:
            f = check_asset("Poppins-Bold.ttf")
            if f: return f
        f = check_asset("Poppins-Regular.ttf")
        if f: return f

    # 19. Montserrat
    if "montserrat" in fam:
        f = check_asset("Montserrat-Regular.ttf")
        if f: return f

    # 20. Raleway
    if "raleway" in fam:
        f = check_asset("Raleway-Regular.ttf")
        if f: return f

    # 21. Abril Fatface
    if "abril" in fam:
        f = check_asset("AbrilFatface-Regular.ttf")
        if f: return f

    # 22. Bodoni
    if "bodoni" in fam:
        if is_bold:
            f = check_win("BOD_B.TTF")
            if f: return f
        f = check_win("BOD_R.TTF")
        if f: return f

    # 23. Georgia
    if "georgia" in fam:
        if is_bold and is_italic:
            f = check_win("georgiaz.ttf")
            if f: return f
        if is_bold:
            f = check_win("georgiab.ttf")
            if f: return f
        if is_italic:
            f = check_win("georgiai.ttf")
            if f: return f
        f = check_win("georgia.ttf")
        if f: return f

    # 24. Times New Roman
    if "times" in fam:
        if is_bold and is_italic:
            f = check_win("timesbi.ttf")
            if f: return f
        if is_bold:
            f = check_win("timesbd.ttf")
            if f: return f
        if is_italic:
            f = check_win("timesi.ttf")
            if f: return f
        f = check_win("times.ttf")
        if f: return f

    # 25. Courier New
    if "courier" in fam:
        if is_bold:
            f = check_win("courbd.ttf")
            if f: return f
        if is_italic:
            f = check_win("couri.ttf")
            if f: return f
        f = check_win("cour.ttf")
        if f: return f

    # 26. Monospace
    if "mono" in fam:
        if is_bold:
            f = check_win("consolab.ttf")
            if f: return f
        f = check_win("consola.ttf") or check_win("cour.ttf")
        if f: return f

    # 27. Any cursive / script
    if any(s in fam for s in ["script", "cursive", "signature", "callig", "edward"]):
        f = check_win("segoesc.ttf") or check_win("BRUSHSCI.TTF") or check_asset("GreatVibes-Regular.ttf")
        if f: return f

    # 28. Any generic serif
    if "serif" in fam:
        f = check_win("georgia.ttf") or check_win("times.ttf")
        if f: return f

    # 29. Modern Sans fallback (Arial / Calibri)
    if is_bold and is_italic:
        f = check_win("arialbi.ttf") or check_win("calibriz.ttf")
        if f: return f
    if is_bold:
        f = check_win("arialbd.ttf") or check_win("calibrib.ttf")
        if f: return f
    if is_italic:
        f = check_win("ariali.ttf") or check_win("calibrii.ttf")
        if f: return f
    f = check_win("arial.ttf") or check_win("calibri.ttf")
    if f: return f

    return "arial.ttf"

class CertificateGeneratorService:
    def sanitize_filename(self, name: str) -> str:
        """Replace spaces with underscores and remove unsafe filesystem characters."""
        # Replace spaces with underscores
        s = name.strip().replace(" ", "_")
        # Remove unsafe chars
        s = FILENAME_SAFE_REGEX.sub("", s)
        # Collapse multiple underscores
        s = re.sub(r'_+', '_', s)
        return s.strip("._") or "certificate"

    def build_filename(
        self,
        naming_pattern: str,
        row_data: Dict[str, Any],
        mappings: List[ProjectFieldMapping],
        output_format: str,
        row_index: int
    ) -> str:
        """
        Builds a safe, personalized filename based on the pattern, e.g. {{name}}_Certificate_{{year}}.pdf.
        """
        pattern = naming_pattern or "{{name}}_Certificate"
        
        # Build placeholder to value map
        value_map = {}
        for m in mappings:
            clean_ph = m.placeholder.strip("{}").strip().lower()
            val = ""
            if m.sheet_column and m.sheet_column in row_data:
                val = str(row_data[m.sheet_column]).strip()
            value_map[clean_ph] = val
            value_map[m.placeholder] = val

        # Also map common row columns directly if not in placeholders
        for k, v in row_data.items():
            if not k.startswith("_"):
                k_clean = k.lower().replace(" ", "_")
                if k_clean not in value_map:
                    value_map[k_clean] = str(v).strip()

        # Substitute placeholders in pattern
        def replacer(match):
            key = match.group(1).strip()
            key_clean = key.strip("{}").strip().lower()
            return value_map.get(key_clean, value_map.get(key, ""))

        result_name = re.sub(r'\{\{\s*([a-zA-Z0-9_\-\.]+)\s*\}\}', replacer, pattern)
        # If result is empty or just underscores, fallback to name or row
        sanitized = self.sanitize_filename(result_name)
        if not sanitized or sanitized == "certificate":
            participant = row_data.get("Name") or row_data.get("name") or f"Participant_{row_index}"
            sanitized = f"{self.sanitize_filename(str(participant))}_Certificate"

        ext = output_format.lower().lstrip(".")
        return f"{sanitized}.{ext}"

    def render_certificate(
        self,
        project: Project,
        mappings: List[ProjectFieldMapping],
        row_data: Dict[str, Any],
        output_format: str = "pdf"
    ) -> bytes:
        """
        Renders a single personalized certificate as bytes.
        Supports PDF, PNG, JPG.
        """
        template_path = settings.TEMPLATES_DIR / project.template_filename
        if not template_path.exists():
            raise FileNotFoundError(f"Template file '{project.template_filename}' not found.")

        # Determine if template is PDF or Image
        is_pdf_template = (project.template_file_type == "pdf")

        if is_pdf_template:
            return self._render_pdf_template(template_path, mappings, row_data, output_format, project)
        else:
            return self._render_image_template(template_path, mappings, row_data, output_format, project)

    def _render_pdf_template(
        self,
        template_path: Path,
        mappings: List[ProjectFieldMapping],
        row_data: Dict[str, Any],
        output_format: str,
        project: Project
    ) -> bytes:
        doc = fitz.open(template_path)
        page = doc[0]

        # First, search and remove literal {{placeholder}} text from the template page if present
        for m in mappings:
            ph = m.placeholder
            rects = page.search_for(ph)
            for r in rects:
                # Redact the placeholder with white/transparent fill so the text doesn't show
                page.add_redact_annot(r, fill=(1, 1, 1))
        page.apply_redactions()

        # Now, insert the personalized replacement text for each mapping
        for idx, m in enumerate(mappings):
            val = ""
            if m.sheet_column and m.sheet_column in row_data:
                val = str(row_data[m.sheet_column]).strip()
            elif not m.sheet_column:
                # Static custom text element added by user
                val = m.placeholder.replace("{{", "").replace("}}", "").strip()
            if not val:
                continue

            font_size = float(m.font_size or 24)
            color = hex_to_pdf_color(m.font_color or "#112D32")
            align_code = fitz.TEXT_ALIGN_CENTER
            if m.alignment == "left":
                align_code = fitz.TEXT_ALIGN_LEFT
            elif m.alignment == "right":
                align_code = fitz.TEXT_ALIGN_RIGHT

            # Coordinates
            x = float(m.x_pos)
            y = float(m.y_pos)
            box_w = float(m.width or 300)
            box_h = float(m.height or 40)

            # Define rect bounding box
            if m.alignment == "left":
                rect = fitz.Rect(x, y - box_h / 2.0, x + box_w, y + box_h / 2.0)
            elif m.alignment == "right":
                rect = fitz.Rect(x - box_w, y - box_h / 2.0, x, y + box_h / 2.0)
            else: # center
                rect = fitz.Rect(x - box_w / 2.0, y - box_h / 2.0, x + box_w / 2.0, y + box_h / 2.0)

            # Apply text transformation
            if getattr(m, 'text_case', None) == "uppercase":
                val = val.upper()
            elif getattr(m, 'text_case', None) == "lowercase":
                val = val.lower()
            elif getattr(m, 'text_case', None) == "capitalize":
                val = val.title()

            font_family = getattr(m, 'font_family', '') or 'helvetica'
            font_weight = str(getattr(m, 'font_weight', 'normal'))
            is_italic = bool(getattr(m, 'is_italic', False))

            font_file = resolve_font_path(font_family, font_weight, is_italic)
            fontname = None
            if font_file and os.path.exists(font_file):
                try:
                    fontname = f"cfont_{idx}"
                    page.insert_font(fontname=fontname, fontfile=font_file)
                except Exception:
                    fontname = None

            if not fontname:
                font_family_lower = font_family.lower()
                is_bold_flag = font_weight.lower() in ["bold", "700", "800", "900", "semibold"]
                if any(s in font_family_lower for s in ["times", "serif", "playfair", "cinzel", "georgia", "garamond", "lora", "merriweather", "script", "vibes", "brush", "parisienne", "italianno", "bodoni", "prata", "marcellus", "dancing", "allura", "tangerine", "sacramento", "abril"]):
                    if is_bold_flag and is_italic:
                        fontname = "tibi"
                    elif is_bold_flag:
                        fontname = "tibo"
                    elif is_italic:
                        fontname = "tiit"
                    else:
                        fontname = "times"
                elif any(s in font_family_lower for s in ["courier", "mono", "space"]):
                    if is_bold_flag and is_italic:
                        fontname = "cobi"
                    elif is_bold_flag:
                        fontname = "cobo"
                    elif is_italic:
                        fontname = "coit"
                    else:
                        fontname = "couri"
                else:
                    if is_bold_flag and is_italic:
                        fontname = "hebi"
                    elif is_bold_flag:
                        fontname = "hebo"
                    elif is_italic:
                        fontname = "heit"
                    else:
                        fontname = "helv"

            # Insert formatted text into box
            page.insert_textbox(
                rect,
                val,
                fontsize=font_size,
                fontname=fontname,
                color=color,
                align=align_code
            )

        output_fmt = output_format.lower()
        if output_fmt == "pdf":
            out_bytes = doc.tobytes()
            doc.close()
            return out_bytes
        else:
            # Convert to PNG or JPG
            zoom = 2.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=(output_fmt == "png"))
            img_bytes = pix.tobytes(output_fmt)
            doc.close()
            return img_bytes

    def _render_image_template(
        self,
        template_path: Path,
        mappings: List[ProjectFieldMapping],
        row_data: Dict[str, Any],
        output_format: str,
        project: Project
    ) -> bytes:
        with Image.open(template_path) as base_img:
            # Always work in RGBA for pristine font antialiasing and alpha blending
            img = base_img.convert("RGBA")
            draw = ImageDraw.Draw(img)

            img_w, img_h = img.size
            proj_w = float(getattr(project, 'template_width', 0) or img_w)
            proj_h = float(getattr(project, 'template_height', 0) or img_h)

            scale_x = img_w / proj_w if proj_w > 0 else 1.0
            scale_y = img_h / proj_h if proj_h > 0 else 1.0
            scale_font = (scale_x + scale_y) / 2.0

            for m in mappings:
                val = ""
                if m.sheet_column and m.sheet_column in row_data:
                    val = str(row_data[m.sheet_column]).strip()
                elif not m.sheet_column:
                    # Static custom text element added by user
                    val = m.placeholder.replace("{{", "").replace("}}", "").strip()
                if not val:
                    continue

                if getattr(m, 'text_case', None) == "uppercase":
                    val = val.upper()
                elif getattr(m, 'text_case', None) == "lowercase":
                    val = val.lower()
                elif getattr(m, 'text_case', None) == "capitalize":
                    val = val.title()

                font_size = max(8, int(float(m.font_size or 24) * scale_font))
                rgb = hex_to_rgb(getattr(m, 'font_color', None) or "#112D32")
                opacity = float(getattr(m, 'opacity', 1.0) if getattr(m, 'opacity', 1.0) is not None else 1.0)
                alpha = int(max(0.0, min(1.0, opacity)) * 255)
                fill_color = (rgb[0], rgb[1], rgb[2], alpha)

                # Resolve font accurately
                font_family = getattr(m, 'font_family', 'Helvetica')
                font_weight = str(getattr(m, 'font_weight', 'normal'))
                is_italic = bool(getattr(m, 'is_italic', False))

                font_path = resolve_font_path(font_family, font_weight, is_italic)
                font = None
                try:
                    font = ImageFont.truetype(font_path, font_size)
                except Exception:
                    try:
                        font = ImageFont.truetype("arial.ttf", font_size)
                    except Exception:
                        font = ImageFont.load_default()

                x = float(m.x_pos) * scale_x
                y = float(m.y_pos) * scale_y
                alignment = (getattr(m, 'alignment', 'center') or "center").lower()

                # Get text bbox for precise positioning
                bbox = draw.textbbox((0, 0), val, font=font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]

                if alignment == "center":
                    text_x = x - (text_w / 2.0)
                    text_y = y - (text_h / 2.0)
                elif alignment == "right":
                    text_x = x - text_w
                    text_y = y - (text_h / 2.0)
                else: # left
                    text_x = x
                    text_y = y - (text_h / 2.0)

                draw.text((text_x, text_y), val, fill=fill_color, font=font)

            buf = io.BytesIO()
            fmt = output_format.lower()
            if fmt == "pdf":
                img_rgb = Image.new("RGB", img.size, (255, 255, 255))
                img_rgb.paste(img, mask=img.split()[3])
                img_rgb.save(buf, format="PDF", resolution=150.0)
            elif fmt in ["jpg", "jpeg"]:
                img_rgb = Image.new("RGB", img.size, (255, 255, 255))
                img_rgb.paste(img, mask=img.split()[3])
                img_rgb.save(buf, format="JPEG", quality=95)
            else:
                img.save(buf, format="PNG")

            return buf.getvalue()

    def generate_preview_base64(
        self,
        project: Project,
        mappings: List[ProjectFieldMapping],
        row_data: Dict[str, Any]
    ) -> str:
        """Renders preview as base64 PNG data URI for instant responsive UI preview."""
        cert_bytes = self.render_certificate(
            project=project,
            mappings=mappings,
            row_data=row_data,
            output_format="png"
        )
        b64 = base64.b64encode(cert_bytes).decode("utf-8")
        return f"data:image/png;base64,{b64}"

certificate_generator_service = CertificateGeneratorService()
