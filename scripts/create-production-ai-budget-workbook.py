from __future__ import annotations

import datetime as dt
import html
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


OUT = Path("requirements/HR_AI_Production_Budget_Proposal_Mobility_CurrentGap.xlsx")


class Formula:
    def __init__(self, text: str):
        self.text = text


def col_name(index: int) -> str:
    name = ""
    while index:
        index, rem = divmod(index - 1, 26)
        name = chr(65 + rem) + name
    return name


def escape(value: object) -> str:
    return html.escape(str(value), quote=True)


def cell_xml(row_idx: int, col_idx: int, value: object, style: int | None = None) -> str:
    ref = f"{col_name(col_idx)}{row_idx}"
    style_attr = f' s="{style}"' if style is not None else ""
    if value is None:
        return f'<c r="{ref}"{style_attr}/>'
    if isinstance(value, Formula):
        return f'<c r="{ref}"{style_attr}><f>{escape(value.text)}</f></c>'
    if isinstance(value, (int, float)):
        return f'<c r="{ref}"{style_attr}><v>{value}</v></c>'
    return f'<c r="{ref}" t="inlineStr"{style_attr}><is><t>{escape(value)}</t></is></c>'


def is_section(row: list[object]) -> bool:
    return bool(row and isinstance(row[0], str) and row[0] and all(x in ("", None) for x in row[1:]))


def sheet_xml(rows: list[list[object]], widths: list[int]) -> str:
    max_cols = max(max((len(row) for row in rows), default=1), len(widths))
    cols = "".join(
        f'<col min="{idx}" max="{idx}" width="{widths[idx - 1] if idx <= len(widths) else 18}" customWidth="1"/>'
        for idx in range(1, max_cols + 1)
    )
    row_xml = []
    for r_idx, row in enumerate(rows, start=1):
        cells = []
        for c_idx in range(1, max_cols + 1):
            value = row[c_idx - 1] if c_idx <= len(row) else None
            style = 1 if r_idx == 1 or is_section(row) else None
            if r_idx > 1 and not is_section(row) and all(isinstance(item, str) for item in row[: min(4, len(row))]):
                style = 2 if row[0] in ("Feature", "Scenario", "Parameter", "Data Group", "Logic") else style
            cells.append(cell_xml(r_idx, c_idx, value, style))
        row_xml.append(f'<row r="{r_idx}">{"".join(cells)}</row>')
    dimension = f"A1:{col_name(max_cols)}{len(rows)}"
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f'<dimension ref="{dimension}"/>'
        '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
        f"<cols>{cols}</cols>"
        f'<sheetData>{"".join(row_xml)}</sheetData>'
        f'<autoFilter ref="{dimension}"/>'
        "</worksheet>"
    )


def workbook_xml(sheet_names: list[str]) -> str:
    sheets = "".join(
        f'<sheet name="{escape(name)}" sheetId="{idx}" r:id="rId{idx}"/>'
        for idx, name in enumerate(sheet_names, start=1)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f"<sheets>{sheets}</sheets>"
        '<calcPr calcMode="auto"/>'
        "</workbook>"
    )


def workbook_rels(sheet_count: int) -> str:
    rels = [
        f'<Relationship Id="rId{idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{idx}.xml"/>'
        for idx in range(1, sheet_count + 1)
    ]
    rels.append(
        f'<Relationship Id="rId{sheet_count + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f'{"".join(rels)}'
        "</Relationships>"
    )


def root_rels() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
        "</Relationships>"
    )


def content_types(sheet_count: int) -> str:
    overrides = [
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    ]
    overrides.extend(
        f'<Override PartName="/xl/worksheets/sheet{idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        for idx in range(1, sheet_count + 1)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        f'{"".join(overrides)}'
        "</Types>"
    )


def styles_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<fonts count="3">'
        '<font><sz val="11"/><name val="Calibri"/></font>'
        '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
        '<font><b/><sz val="11"/><color rgb="FF111827"/><name val="Calibri"/></font>'
        '</fonts>'
        '<fills count="4">'
        '<fill><patternFill patternType="none"/></fill>'
        '<fill><patternFill patternType="gray125"/></fill>'
        '<fill><patternFill patternType="solid"><fgColor rgb="FF14532D"/><bgColor indexed="64"/></patternFill></fill>'
        '<fill><patternFill patternType="solid"><fgColor rgb="FFE5E7EB"/><bgColor indexed="64"/></patternFill></fill>'
        '</fills>'
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        '<cellXfs count="3">'
        '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
        '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'
        '<xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'
        '</cellXfs>'
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        "</styleSheet>"
    )


def core_xml() -> str:
    now = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        '<dc:title>HR AI Production Budget</dc:title>'
        '<dc:creator>Codex</dc:creator>'
        f'<dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>'
        f'<dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>'
        "</cp:coreProperties>"
    )


def app_xml(sheet_names: list[str]) -> str:
    titles = "".join(f"<vt:lpstr>{escape(name)}</vt:lpstr>" for name in sheet_names)
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        '<Application>Codex generated workbook</Application>'
        '<HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>'
        f"{len(sheet_names)}"
        '</vt:i4></vt:variant></vt:vector></HeadingPairs>'
        f'<TitlesOfParts><vt:vector size="{len(sheet_names)}" baseType="lpstr">{titles}</vt:vector></TitlesOfParts>'
        "</Properties>"
    )


def build_sheets() -> dict[str, tuple[list[list[object]], list[int]]]:
    assumptions = [
        ["HR AI Production Budget - Mobility & Current Gap"],
        ["Purpose", "Annual production budget proposal for AI analysis around leader mobility and current gap analysis."],
        ["Budget posture", "Budget is an annual production allowance based on expected HR planning usage, not only raw API token math."],
        ["Currency", "IDR"],
        ["Exchange rate USD/IDR", 17800],
        ["VAT/PPN", 0.11],
        ["Recommended annual budget IDR", 4500000],
        ["Contingency explanation", "Single fixed proposal number; includes expected usage, UAT, retry, ad-hoc senior requests, and price/model movement."],
        ["Heavy season months per year", 3],
        [""],
        ["Model Assumption"],
        ["Model", "GPT-5.6 Terra or equivalent higher quality reasoning model"],
        ["Input price USD per 1M tokens", 2.50],
        ["Output price USD per 1M tokens", 15.00],
        ["Why this model", "Better for HR evidence synthesis, person-position matching, leadership role reasoning, risk and development recommendation quality."],
        [""],
        ["Population and Scope"],
        ["Employee population", 700],
        ["Analyzed person scope", "Around 100 leader/pipeline employees"],
        ["Analyzed position scope", "Leader roles, manager level and above"],
        ["Organization structure", "5 directorates; each has divisions and departments"],
        ["Leader positions analyzed per year", "Manager+ roles across directorates/divisions/departments during planning cycle"],
        ["Mobility candidates sent to AI per hit", "5-10 shortlisted candidates after grouping"],
        ["Current Gap persons analyzed per leader position", "Only key people/pipeline, not every employee."],
        ["Cache policy", "Same person-position context uses stored result; no repeated AI hit unless data changes."],
    ]

    usage = [
        ["Feature", "Heavy Months", "Hits / Heavy Month", "Light/Ad-hoc Hits / Year", "Annual Hits", "Input Tokens / Hit", "Output Tokens / Hit", "Description"],
        ["Mobility", Formula("Assumptions!B9"), 25, 15, Formula("B2*C2+D2"), 7500, 1800, "Manager+ target positions across 5 directorates; backend grouping first; AI ranks shortlisted candidates."],
        ["Current Gap / Skill Needs", Formula("Assumptions!B9"), 100, 40, Formula("B3*C3+D3"), 3500, 1200, "Around 100 leader/pipeline employees analyzed during planning cycle, with ad-hoc refresh when data changes."],
        ["Total", "", "", "", Formula("SUM(E2:E3)"), Formula("SUMPRODUCT(E2:E3,F2:F3)/SUM(E2:E3)"), Formula("SUMPRODUCT(E2:E3,G2:G3)/SUM(E2:E3)"), "Weighted average token/hit shown in token columns."],
        [""],
        ["Grouping Logic"],
        ["Logic", "Mobility", "Current Gap", "", "", "", "", ""],
        ["Job level", "Candidate must be equal to target role or one level below", "Person is compared against their current position", "", "", "", "", ""],
        ["Organization", "Same/adjacent department, division, directorate prioritized", "Current org context only", "", "", "", "", ""],
        ["Competency", "Person competency overlap with target position requirements", "Person competency compared with current position requirements", "", "", "", "", ""],
        ["Performance/readiness", "Used for shortlist priority and AI evidence", "Used for readiness summary and risk", "", "", "", "", ""],
        ["Cache", "Same target + same shortlist + same data = use stored result", "Same employee + same current position data = use stored result", "", "", "", "", ""],
    ]

    token_budget = [
        ["Feature", "Annual Hits", "Input Tokens / Hit", "Output Tokens / Hit", "Annual Input Tokens", "Annual Output Tokens", "Annual Total Tokens"],
        ["Mobility", Formula("Usage!E2"), Formula("Usage!F2"), Formula("Usage!G2"), Formula("B2*C2"), Formula("B2*D2"), Formula("E2+F2")],
        ["Current Gap / Skill Needs", Formula("Usage!E3"), Formula("Usage!F3"), Formula("Usage!G3"), Formula("B3*C3"), Formula("B3*D3"), Formula("E3+F3")],
        ["Total", Formula("SUM(B2:B3)"), "", "", Formula("SUM(E2:E3)"), Formula("SUM(F2:F3)"), Formula("SUM(G2:G3)")],
    ]

    cost = [
        ["Scenario", "Purpose", "Annual Input Tokens", "Annual Output Tokens", "Input USD/1M", "Output USD/1M", "Raw Token USD", "Raw Token IDR", "Allowance Factor", "Annual Budget IDR"],
        ["Token Math Only", "Pure API usage estimate; too small for proposal", Formula("Token_Budget!E4"), Formula("Token_Budget!F4"), Formula("Assumptions!B13"), Formula("Assumptions!B14"), Formula("(C2/1000000*E2)+(D2/1000000*F2)"), Formula("G2*Assumptions!B5"), 1, Formula("H2*I2")],
        ["Recommended Annual Budget", "Fixed production budget proposal for expected annual usage, retries, UAT, governance, and ad-hoc HR analysis", Formula("Token_Budget!E4"), Formula("Token_Budget!F4"), Formula("Assumptions!B13"), Formula("Assumptions!B14"), Formula("(C3/1000000*E3)+(D3/1000000*F3)"), Formula("G3*Assumptions!B5"), Formula("Assumptions!B7/H3"), Formula("H3*I3")],
        ["Recommended + PPN", "Fixed annual budget including 11% VAT/PPN", "", "", "", "", "", "", "", Formula("J3*(1+Assumptions!B6)")],
    ]

    mapping = [
        ["Feature", "Data Group", "Person Columns", "Position Columns", "How AI Uses It"],
        ["Mobility", "Identity & org", "candidateRef, current position, current level, directorate, division, department", "target position, target level, directorate, division, department", "Checks role proximity and organization relevance."],
        ["Mobility", "Competency", "technical competency, behavioral competency, person qualification/current level", "required competency, required level, mandatory, weight", "Scores match, critical gaps, and development effort."],
        ["Mobility", "Evidence", "career history, projects, certification, training, performance, potential, readiness, supervisor notes", "job description, responsibility, experience requirement, evidence notes", "Explains why a person is or is not fit for the target position."],
        ["Current Gap", "Identity & org", "employeeRef, current position, current level, directorate, division, department", "current position, level, directorate, division, department", "Confirms the comparison is against the current role."],
        ["Current Gap", "Competency", "current skill, behavioral skill, person qualification/current level, strengths, weaknesses", "required competency, required level, mandatory, weight", "Identifies priority competency gaps."],
        ["Current Gap", "Development", "training, certification, development program, assessment, supervisor notes", "job description, role responsibility, expected evidence", "Builds IDP 70-20-10 and risk/missing-info summary."],
    ]

    notes = [
        ["Notes"],
        ["1. This workbook is for budgeting proposal. The final recommendation uses annual allowance because raw token math is too small for production planning."],
        ["2. Raw token cost remains visible for transparency, but procurement should use the fixed Recommended Annual Budget."],
        ["3. Usage assumption: heavy activity happens in 3 months per year, with light/ad-hoc usage outside that window."],
        ["4. Mobility should analyze candidates equal to the target level or one level below. Higher-level candidates are excluded from normal mobility ranking."],
        ["5. All AI results remain decision support. HR/senior owns final decisions."],
        ["6. Pricing assumptions should be refreshed before procurement because API model prices can change."],
        ["7. Pricing basis used here: GPT-5.6 Terra Standard API pricing, input USD 2.50/1M tokens and output USD 15.00/1M tokens."],
        ["8. Recommended fixed proposal: Rp4.500.000 per year, or Rp4.995.000 including 11% PPN."],
    ]

    return {
        "Assumptions": (assumptions, [30, 95]),
        "Usage": (usage, [28, 18, 20, 20, 90]),
        "Token_Budget": (token_budget, [30, 16, 20, 20, 22, 22, 22]),
        "Cost_Calculation": (cost, [24, 55, 22, 22, 18, 18, 18, 18, 20, 22]),
        "Data_Mapping": (mapping, [20, 22, 60, 55, 70]),
        "Notes": (notes, [120]),
    }


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def create_workbook() -> None:
    global OUT
    sheets = build_sheets()
    sheet_names = list(sheets.keys())
    parts: dict[str, str] = {
        "[Content_Types].xml": content_types(len(sheet_names)),
        "_rels/.rels": root_rels(),
        "xl/workbook.xml": workbook_xml(sheet_names),
        "xl/_rels/workbook.xml.rels": workbook_rels(len(sheet_names)),
        "xl/styles.xml": styles_xml(),
        "docProps/core.xml": core_xml(),
        "docProps/app.xml": app_xml(sheet_names),
    }
    for idx, name in enumerate(sheet_names, start=1):
        rows, widths = sheets[name]
        parts[f"xl/worksheets/sheet{idx}.xml"] = sheet_xml(rows, widths)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists():
        try:
            OUT.unlink()
        except PermissionError:
            OUT = OUT.with_name(f"{OUT.stem}_updated.xlsx")
            if OUT.exists():
                OUT.unlink()
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, content in parts.items():
            zf.writestr(name, content.encode("utf-8"))


def verify_workbook() -> None:
    required = {
        "[Content_Types].xml",
        "_rels/.rels",
        "xl/workbook.xml",
        "xl/_rels/workbook.xml.rels",
        "xl/styles.xml",
    }
    with zipfile.ZipFile(OUT, "r") as zf:
        names = set(zf.namelist())
        missing = required - names
        if missing:
            raise RuntimeError(f"Workbook missing required parts: {sorted(missing)}")
        ET.fromstring(zf.read("xl/workbook.xml"))
        for name in names:
            if name.endswith(".xml"):
                ET.fromstring(zf.read(name))
    with zipfile.ZipFile(OUT, "r") as src, zipfile.ZipFile(OUT.with_suffix(".verify.zip"), "w", zipfile.ZIP_DEFLATED) as dst:
        for name in src.namelist():
            dst.writestr(name, src.read(name))
    OUT.with_suffix(".verify.zip").unlink()


if __name__ == "__main__":
    create_workbook()
    verify_workbook()
    print(f"Created and verified: {OUT} ({OUT.stat().st_size} bytes)")
