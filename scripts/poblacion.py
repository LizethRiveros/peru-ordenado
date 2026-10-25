"""Población proyectada por distrito (INEI) → data/raw/poblacion-2025.json {ubigeo: habitantes}.

Fuente: INEI, «Población total proyectada al 30 de junio de cada año, según departamento, provincia y
distrito, 2018-2026» (gob.pe/institucion/inei, información referencial). Uso:
    python scripts/poblacion.py ruta/al/archivo.xlsx
"""
import json
import sys

import openpyxl

AÑO = 2025
ws = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True).worksheets[0]
cols = None
out = {}
for row in ws.iter_rows(values_only=True):
    if row[0] is None and row[1] is None and any(isinstance(c, int) and 2000 < c < 2100 for c in row[2:]):
        cols = {c: i for i, c in enumerate(row) if isinstance(c, int)}
        continue
    ubigeo = str(row[0] or "")
    if cols and len(ubigeo) == 6 and ubigeo.isdigit() and ubigeo != "000000" and isinstance(row[cols[AÑO]], (int, float)):
        out[ubigeo] = int(row[cols[AÑO]])
json.dump({"año": AÑO, "pob": out}, open("data/raw/poblacion-2025.json", "w"), separators=(",", ":"))
print(len(out), "códigos", sum(v for k, v in out.items() if not k.endswith("00")), "habitantes en distritos")
