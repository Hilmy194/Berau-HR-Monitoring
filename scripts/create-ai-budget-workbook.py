from __future__ import annotations

import datetime as dt
import html
import os
import zipfile
from pathlib import Path


OUT = Path("AI_Features_Workflow_Mobility_CurrentGap_Budget_Calculation.xlsx")


def col_name(index: int) -> str:
    name = ""
    while index:
        index, rem = divmod(index - 1, 26)
        name = chr(65 + rem) + name
    return name


def cell_xml(row_idx: int, col_idx: int, value):
    ref = f"{col_name(col_idx)}{row_idx}"
    if value is None:
        return f'<c r="{ref}"/>'
    if isinstance(value, Formula):
        return f'<c r="{ref}"><f>{html.escape(value.text)}</f></c>'
    if isinstance(value, (int, float)):
        return f'<c r="{ref}"><v>{value}</v></c>'
    return f'<c r="{ref}" t="inlineStr"><is><t>{html.escape(str(value))}</t></is></c>'


class Formula:
    def __init__(self, text: str):
        self.text = text


def sheet_xml(rows, widths=None) -> str:
    col_widths = widths or [28] * 12
    cols = "".join(
        f'<col min="{i}" max="{i}" width="{width}" customWidth="1"/>'
        for i, width in enumerate(col_widths, start=1)
    )
    body = []
    for r, row in enumerate(rows, start=1):
        cells = "".join(cell_xml(r, c, value) for c, value in enumerate(row, start=1))
        body.append(f'<row r="{r}">{cells}</row>')
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f"<cols>{cols}</cols>"
        f"<sheetData>{''.join(body)}</sheetData>"
        "</worksheet>"
    )


def workbook_xml(sheet_names):
    sheets = "".join(
        f'<sheet name="{html.escape(name)}" sheetId="{idx}" r:id="rId{idx}"/>'
        for idx, name in enumerate(sheet_names, start=1)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f"<sheets>{sheets}</sheets>"
        "</workbook>"
    )


def workbook_rels(sheet_count):
    rels = [
        f'<Relationship Id="rId{idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{idx}.xml"/>'
        for idx in range(1, sheet_count + 1)
    ]
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f"{''.join(rels)}</Relationships>"
    )


def content_types(sheet_count):
    overrides = [
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    ]
    overrides += [
        f'<Override PartName="/xl/worksheets/sheet{idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        for idx in range(1, sheet_count + 1)
    ]
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        f"{''.join(overrides)}</Types>"
    )


def root_rels():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
        "</Relationships>"
    )


def doc_props():
    now = dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    core = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        "<dc:creator>Codex</dc:creator>"
        "<cp:lastModifiedBy>Codex</cp:lastModifiedBy>"
        f'<dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>'
        f'<dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>'
        "</cp:coreProperties>"
    )
    app = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        "<Application>Codex generated workbook</Application>"
        "</Properties>"
    )
    return core, app


def build_rows():
    context = [
        ["AI Mobility dan Current Gap / Skill Needs - Context untuk Senior", "", "", ""],
        ["Tanggal", "10 Agustus 2026", "", ""],
        ["Scope", "Estimasi penggunaan untuk +/- 700 data karyawan", "", ""],
        ["Prinsip penting", "OpenAI API usage-based, bukan biaya bulanan fixed. Budget bulanan dibuat sebagai allowance agar mudah diajukan.", "", ""],
        ["", "", "", ""],
        ["Fitur", "Starting Point", "Backend Role", "AI Role"],
        ["Current Gap / Skill Needs", "HR memilih 1 karyawan", "Hitung current vs required competency, mandatory coverage, readiness score, dan gap prioritas.", "Menjelaskan gap menjadi readiness category, summary, evidence, risk, missing info, dan IDP 70-20-10."],
        ["Mobility", "HR memilih 1 target posisi", "Ranking semua kandidat internal dulu, termasuk 700 karyawan, lalu shortlist top candidates.", "Menjelaskan kandidat shortlist: strengths, gaps, risks, development needs, common gaps, dan differentiated strengths."],
        ["", "", "", ""],
        ["Data tidak dikirim ke AI", "NIK asli, email, nomor telepon, alamat, tanggal lahir lengkap, gender, agama, payroll, rekening, data keluarga, MCU/diagnosis/detail medical restriction.", "", ""],
        ["Decision authority", "AI hanya decision support. HR/senior tetap validasi dan mengambil keputusan final.", "", ""],
    ]

    pricing = [
        ["Model Pricing - USD per 1M Tokens", "", "", "", "", ""],
        ["Source", "Official OpenAI API Pricing", "https://platform.openai.com/docs/pricing", "", "", ""],
        ["Pricing mode utama", "Standard, short context", "Angka dapat diganti jika memakai Batch/Flex/Fast mode.", "", "", ""],
        ["", "", "", "", "", ""],
        ["Model", "Input USD/1M", "Cached Input USD/1M", "Cache Write USD/1M", "Output USD/1M", "Catatan"],
        ["gpt-5.6-luna", 0.20, 0.02, 0.25, 1.20, "Recommended untuk insight HR rutin karena biaya rendah."],
        ["gpt-5.6-terra", 2.00, 0.20, 2.50, 12.00, "Lebih mahal; gunakan jika butuh kualitas lebih tinggi."],
        ["gpt-5.6-sol", 5.00, 0.50, 6.25, 30.00, "Paling mahal; kurang ideal untuk routine bulk analysis."],
        ["", "", "", "", "", ""],
        ["Formula dasar", "Cost USD = (Input Tokens / 1,000,000 x Input Price) + (Output Tokens / 1,000,000 x Output Price)", "", "", "", ""],
        ["Formula Rupiah", "Cost IDR = Cost USD x Kurs USD/IDR", "", "", "", ""],
    ]

    assumptions = [
        ["Token dan Frequency Assumptions", "", "", "", "", ""],
        ["Parameter", "Value", "Catatan", "", "", ""],
        ["Employee population", 700, "Jumlah data karyawan yang tersedia di backend.", "", "", ""],
        ["Kurs USD/IDR", 16000, "Bisa diganti sesuai kurs finance.", "", "", ""],
        ["Buffer multiplier", 2, "100% buffer untuk retry, prompt lebih panjang, output variasi, dan safety margin.", "", "", ""],
        ["PPN", 0.11, "PPN 11%. Sesuaikan jika tax treatment berbeda.", "", "", ""],
        ["Selected model", "gpt-5.6-luna", "Harga default mengambil Standard short context.", "", "", ""],
        ["", "", "", "", "", ""],
        ["Feature", "Input Tokens / Hit", "Output Tokens / Hit", "Normal Hits / Month", "Conservative Hits / Month", "Penjelasan"],
        ["Current Gap / Skill Needs", 3500, 1200, 200, 700, "Normal: 20% refresh dari 700 + ad-hoc. Conservative: semua 700 karyawan dianalisis 1x/bulan."],
        ["Mobility", 7500, 1800, 50, 200, "Backend ranking 700 karyawan; AI hanya menerima shortlist/top candidates, bukan seluruh raw profile."],
    ]

    calculation = [
        ["Cost Calculation", "", "", "", "", "", "", "", "", "", "", ""],
        ["Global Assumptions", "", "", "", "", "", "", "", "", "", "", ""],
        ["Kurs USD/IDR", 16000, "", "", "", "", "", "", "", "", "", ""],
        ["Buffer Multiplier", 2, "", "", "", "", "", "", "", "", "", ""],
        ["PPN", 0.11, "", "", "", "", "", "", "", "", "", ""],
        ["Input Price USD/1M", 0.20, "gpt-5.6-luna Standard short context", "", "", "", "", "", "", "", "", ""],
        ["Output Price USD/1M", 1.20, "gpt-5.6-luna Standard short context", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", ""],
        ["Scenario", "Feature", "Hits/Month", "Input Tokens/Hit", "Output Tokens/Hit", "Input Cost USD/Hit", "Output Cost USD/Hit", "Total USD/Hit", "Total IDR/Hit", "Monthly IDR Before Buffer", "Monthly IDR With Buffer", "Monthly IDR + PPN"],
    ]
    scenarios = [
        ("Normal", "Current Gap / Skill Needs", 200, 3500, 1200),
        ("Conservative", "Current Gap / Skill Needs", 700, 3500, 1200),
        ("Normal", "Mobility", 50, 7500, 1800),
        ("Conservative", "Mobility", 200, 7500, 1800),
        ("Stress Test", "Mobility", 700, 7500, 1800),
    ]
    start = len(calculation) + 1
    for idx, (scenario, feature, hits, input_tokens, output_tokens) in enumerate(scenarios, start=start):
        calculation.append([
            scenario,
            feature,
            hits,
            input_tokens,
            output_tokens,
            Formula(f"D{idx}/1000000*$B$6"),
            Formula(f"E{idx}/1000000*$B$7"),
            Formula(f"F{idx}+G{idx}"),
            Formula(f"H{idx}*$B$3"),
            Formula(f"C{idx}*I{idx}"),
            Formula(f"J{idx}*$B$4"),
            Formula(f"K{idx}*(1+$B$5)"),
        ])
    total_row = start + len(scenarios) + 1
    calculation += [
        ["", "", "", "", "", "", "", "", "", "", "", ""],
        ["Recommended Budget", "Normal combined monthly allowance", "", "", "", "", "", "", "", Formula(f"J{start}+J{start+2}"), Formula(f"K{start}+K{start+2}"), Formula(f"L{start}+L{start+2}")],
        ["Recommended Budget", "Conservative combined monthly allowance", "", "", "", "", "", "", "", Formula(f"J{start+1}+J{start+3}"), Formula(f"K{start+1}+K{start+3}"), Formula(f"L{start+1}+L{start+3}")],
        ["Proposal rounded allowance", "Rp 250.000 - Rp 400.000/month", "", "", "", "", "", "", "", "", "", ""],
        ["Annual estimate at Rp400.000/month", 400000 * 12, "Before PPN", "", "", "", "", "", "", "", "", ""],
        ["Annual estimate + PPN 11%", Formula(f"B{total_row+4}*(1+$B$5)"), "", "", "", "", "", "", "", "", "", ""],
    ]

    senior_questions = [
        ["Pertanyaan untuk Senior", "Kenapa ditanyakan", "Opsi keputusan"],
        ["Apakah model yang dipakai cukup gpt-5.6-luna untuk insight HR rutin?", "Biaya jauh lebih murah dan output cukup untuk summarization/recommendation.", "Luna untuk production normal; Terra/Sol hanya untuk case kompleks."],
        ["Apakah Current Gap perlu dihitung otomatis semua 700 karyawan tiap bulan?", "Ini menentukan volume hit terbesar.", "Normal 200 hit/bulan atau conservative 700 hit/bulan."],
        ["Untuk Mobility, apakah AI hanya membaca top 5/top 10/top 30 kandidat?", "Semakin banyak kandidat, semakin besar input token.", "Rekomendasi: backend ranking semua 700, AI baca top candidates saja."],
        ["Apakah hasil AI boleh disimpan/cache?", "Cache menghindari biaya ulang untuk konteks yang sama.", "Simpan hasil by input hash, refresh jika data employee/position berubah."],
        ["Apakah ada requirement data residency / regional processing?", "Official pricing menyebut regional processing dapat terkena uplift.", "Jika wajib data residency, tambahkan uplift di budget."],
        ["Apakah budget proposal perlu angka aman atau angka realistis?", "Realistis sangat rendah, proposal biasanya butuh buffer.", "Ajukan Rp250.000-Rp400.000/bulan sebagai allowance aman."],
    ]

    return {
        "Context": context,
        "Model Pricing": pricing,
        "Assumptions": assumptions,
        "Cost Calculation": calculation,
        "Senior Questions": senior_questions,
    }


def write_xlsx(path: Path, sheets):
    names = list(sheets.keys())
    core, app = doc_props()
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types(len(names)))
        z.writestr("_rels/.rels", root_rels())
        z.writestr("docProps/core.xml", core)
        z.writestr("docProps/app.xml", app)
        z.writestr("xl/workbook.xml", workbook_xml(names))
        z.writestr("xl/_rels/workbook.xml.rels", workbook_rels(len(names)))
        for idx, name in enumerate(names, start=1):
            widths = [30, 34, 22, 22, 22, 22, 22, 22, 22, 26, 26, 24]
            z.writestr(f"xl/worksheets/sheet{idx}.xml", sheet_xml(sheets[name], widths))


if __name__ == "__main__":
    if OUT.exists():
        OUT.unlink()
    write_xlsx(OUT, build_rows())
    print(os.path.abspath(OUT))
