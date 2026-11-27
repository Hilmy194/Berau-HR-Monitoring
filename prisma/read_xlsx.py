#!/usr/bin/env python3
"""Cross-platform OOXML (.xlsx) reader returning JSON matching read-xlsx.ps1."""

from __future__ import annotations

import json
import posixpath
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"

NS = {
    "main": MAIN_NS,
    "r": REL_NS,
    "pkg": PKG_REL_NS,
}


def col_ref_to_index(cell_ref: str) -> int:
    letters = re.sub(r"[0-9]", "", cell_ref or "").upper()
    index = 0
    for ch in letters:
        index = (index * 26) + (ord(ch) - ord("A") + 1)
    return index


def extract_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return "".join(element.itertext())


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    return [extract_text(si) for si in root.findall("main:si", NS)]


def read_workbook(file_path: Path) -> dict:
    with zipfile.ZipFile(file_path, "r") as zf:
        shared_strings = read_shared_strings(zf)
        wb_root = ET.fromstring(zf.read("xl/workbook.xml"))
        rels_root = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))

        rel_map: dict[str, str] = {}
        for rel in rels_root.findall("pkg:Relationship", NS):
            rel_id = rel.attrib.get("Id")
            target = rel.attrib.get("Target")
            if rel_id and target:
                rel_map[rel_id] = target

        sheets = []
        for sheet_el in wb_root.findall(".//main:sheet", NS):
            name = sheet_el.attrib.get("name", "")
            rel_id = sheet_el.attrib.get(f"{{{REL_NS}}}id", "")
            target = rel_map.get(rel_id, "")
            if not target:
                continue
            sheet_path = target.lstrip("/") if target.startswith("/") else posixpath.normpath(posixpath.join("xl", target))
            sheet_root = ET.fromstring(zf.read(sheet_path))

            rows: list[list[str]] = []
            for row_el in sheet_root.findall(".//main:sheetData/main:row", NS):
                values: dict[int, str] = {}
                max_col = 0
                sequential_col = 1
                for cell_el in row_el.findall("main:c", NS):
                    ref = cell_el.attrib.get("r", "")
                    col_idx = col_ref_to_index(ref) if ref else sequential_col
                    sequential_col = col_idx + 1
                    cell_type = cell_el.attrib.get("t", "")

                    v_el = cell_el.find("main:v", NS)
                    is_el = cell_el.find("main:is", NS)

                    if cell_type == "inlineStr":
                        val = extract_text(is_el)
                    elif cell_type == "s" and v_el is not None and (v_el.text or "").isdigit():
                        str_idx = int(v_el.text or "0")
                        val = shared_strings[str_idx] if 0 <= str_idx < len(shared_strings) else ""
                    elif cell_type == "b" and v_el is not None:
                        val = "TRUE" if (v_el.text or "") == "1" else "FALSE"
                    elif v_el is not None and v_el.text is not None:
                        val = v_el.text
                    elif is_el is not None:
                        val = extract_text(is_el)
                    else:
                        val = ""

                    values[col_idx] = val
                    if col_idx > max_col:
                        max_col = col_idx

                if max_col > 0:
                    rows.append([values.get(i, "") for i in range(1, max_col + 1)])

            sheets.append({"name": name, "rows": rows})

        return {"file": file_path.name, "sheets": sheets}


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: read_xlsx.py <path-to-xlsx>", file=sys.stderr)
        sys.exit(2)
    target = Path(sys.argv[1]).resolve()
    if not target.exists():
        print(f"File not found: {target}", file=sys.stderr)
        sys.exit(1)
    print(json.dumps(read_workbook(target), ensure_ascii=False))


if __name__ == "__main__":
    main()
