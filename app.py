"""
AcidoScope — 急診高陰離子隙代謝性酸中毒 決策輔助
精簡版 v2：並列評分（非互斥）、缺值透明化、移除行銷語與偽信心度。
※ 臨床決策輔助，不取代醫師判斷。所有劑量以院內藥典/毒物中心為準。
"""

import re
import streamlit as st

st.set_page_config(page_title="AcidoScope", page_icon="🧪", layout="wide")

# ------------------------------------------------------------------
# 0. 文獻依據（建議文字以 [代號] 對應此表）
#    最後查證日期請在每次核對指引後更新。
# ------------------------------------------------------------------
EVIDENCE_REVIEWED = "2026-09-20"

REFS = {
    'SSC2026': {
        'title': "Surviving Sepsis Campaign: International Guidelines for Management of "
                 "Sepsis and Septic Shock 2026",
        'source': "Crit Care Med / Intensive Care Med", 'year': 2026,
        'note': "取代 2021 版，共 129 條、其中 46 條為全新。與本程式相關的變動："
                "≥65 歲初始 MAP 目標可設 60–65 mmHg（條件式建議）；"
                "維持敗血性休克 3 小時內至少 30 mL/kg 晶體液但強調個別化與頻繁再評估；"
                "肥胖者以理想／校正體重計算；抗生素理想上 1 小時內。",
        'url': "https://doi.org/10.1007/s00134-026-08361-1",
    },
    'ADA2024': {
        'title': "Hyperglycemic Crises in Adults With Diabetes: A Consensus Report "
                 "(ADA / EASD / AACE / DTS / JBDS)",
        'source': "Diabetes Care / Diabetologia", 'year': 2024,
        'note': "重要變動：定量 BHB 納入診斷（≥3.0 mmol/L）與緩解判定（<3.0 mmol/L）；"
                "**陰離子隙不再是第一線診斷標準**；"
                "起始胰島素的鉀門檻由 3.3 上修為 3.5 mmol/L；"
                "血糖 <250 mg/dL 即加 dextrose。SGLT2i 相關 eDKA 由「已知糖尿病」"
                "這一條納入，不受血糖正常影響。",
        'url': "https://pubmed.ncbi.nlm.nih.gov/38907161/",
    },
    'E-MET': {
        'title': "Extracorporeal treatment for metformin poisoning: "
                 "recommendations from the EXTRIP workgroup",
        'source': "Critical Care Medicine", 'year': 2015,
        'note': "建議體外清除：lactate >20 mmol/L 或 pH ≤7.0（1D）。"
                "建議考慮：lactate >15 或 pH ≤7.1（2D）。"
                "下修門檻之共病：休克、腎功能受損（1D）、肝衰竭、意識下降（2D）。"
                "首選含碳酸氫鹽透析液之間歇性 HD（1D）；"
                "停止門檻 lactate <3 mmol/L 且 pH >7.35（1D）。",
        'url': "https://www.extrip-workgroup.org/metformin",
    },
    'E-MeOH': {
        'title': "Extracorporeal treatment for methanol poisoning: "
                 "recommendations from the EXTRIP workgroup",
        'source': "Critical Care Medicine", 'year': 2015,
        'note': "濃度門檻：併用 fomepizole >700 mg/L、併用 ethanol >600 mg/L、"
                "無 ADH 阻斷劑 >500 mg/L。臨床門檻：昏迷、癲癇、新發視覺缺損、"
                "pH ≤7.15、AG >24 mmol/L、解毒與支持治療下酸中毒仍持續。"
                "停止門檻 <200 mg/L 且臨床改善；透析期間續用 ADH 阻斷劑與 folate。",
        'url': "https://www.extrip-workgroup.org/methanol",
    },
    'E-EG': {
        'title': "Extracorporeal treatment for ethylene glycol poisoning: systematic "
                 "review and recommendations from the EXTRIP workgroup",
        'source': "Critical Care", 'year': 2023,
        'note': "2023 改版，是 EXTRIP 系列中最新的一份。不以攝入劑量單獨決定；"
                "併用 fomepizole 時濃度 >50 mmol/L 或 osm gap >50；"
                "glycolate >12 mmol/L 或 AG >27 mmol/L；或昏迷、癲癇、AKI。",
        'url': "https://pubmed.ncbi.nlm.nih.gov/36765419/",
    },
    'E-SAL': {
        'title': "Extracorporeal Treatment for Salicylate Poisoning: Systematic Review "
                 "and Recommendations From the EXTRIP Workgroup",
        'source': "Annals of Emergency Medicine", 'year': 2015,
        'note': "建議體外清除（1D）：>100 mg/dL；腎功能受損時 >90 mg/dL；"
                "意識改變；新發需氧氣之低血氧；標準治療失敗。"
                "建議考慮（2D）：>90 mg/dL；腎功能受損時 >80 mg/dL；pH ≤7.20。"
                "首選間歇性 HD（1D）；停止門檻 <19 mg/dL 且臨床改善。",
        'url': "https://pubmed.ncbi.nlm.nih.gov/25986310/",
    },
    'ACMT-SAL': {
        'title': "Guidance Document: Management Priorities in Salicylate Toxicity",
        'source': "American College of Medical Toxicology", 'year': 2013,
        'note': "插管相關警告的原始出處：插管與機械通氣可使水楊酸毒性急遽惡化並增加死亡率，"
                "除非以過度換氣與碳酸氫鈉維持正常或略偏鹼的 pH。"
                "若以水楊酸毒性為插管適應症，透析應優先於或至少與插管同時進行。",
        'url': "https://www.acmt.net/wp-content/uploads/2022/06/"
               "PRS_130313_Management-Priorities-in-Salicylate-Toxicity.pdf",
    },
    'KDIGO': {
        'title': "KDIGO Clinical Practice Guideline for Acute Kidney Injury；"
                 "併 STARRT-AKI 與 AKIKI 之 RRT 啟動時機證據",
        'source': "Kidney Int Suppl；NEJM", 'year': 2012,
        'note': "2012 版仍為現行正式版本。KDIGO 2026 AKI/AKD 指引草案已於 2026 年 3 月"
                "公開徵詢、5 月 11 日截止，截至本次查證日尚未正式發表，"
                "屆時定義將擴及 AKD 並納入結構性生物標記，需重新核對。",
        'url': "https://kdigo.org/guidelines/acute-kidney-injury/",
    },
}

# ------------------------------------------------------------------
# 1. 去識別化（先遮後解析）
# ------------------------------------------------------------------
def deidentify(text: str) -> str:
    text = re.sub(r'\b[A-Z][12]\d{8}\b', '[ID]', text, flags=re.IGNORECASE)
    text = re.sub(r'(?<![:=\d.])\b\d{8,10}\b(?![.\d])', '[MRN]', text)
    text = re.sub(r'\d{4}[-/]\d{1,2}[-/]\d{1,2}', '[DATE]', text)
    return text


# ------------------------------------------------------------------
# 2. 檢驗值解析
# ------------------------------------------------------------------
LAB_RULES = {
    'pH':       r'\bpH\s*[:=]?\s*([67]\.\d{1,3})',
    'HCO3':     r'\bHCO3\s*[:=]?\s*(\d{1,2}(?:\.\d)?)',
    'Lactate':  r'\b(?:Lactate|Lac)\s*[:=]?\s*(\d{1,2}(?:\.\d)?)',
    'Na':       r'\bNa\s*[:=]?\s*(\d{2,3})',
    'Cl':       r'\bCl\s*[:=]?\s*(\d{2,3})',
    'Cr':       r'\b(?:Cr|Creatinine)\s*[:=]?\s*(\d{1,2}(?:\.\d{1,2})?)',
    'BUN':      r'\bBUN\s*[:=]?\s*(\d{1,3})',
    'Glucose':  r'\b(?:Glu|Glucose)\s*[:=]?\s*(\d{2,4})',
    'Albumin':  r'\b(?:Alb|Albumin)\s*[:=]?\s*(\d(?:\.\d)?)',
    'Ketone':   r'\b(?:BHB|Ketone|beta-?hydroxybutyrate)\s*[:=]?\s*(\d{1,2}(?:\.\d)?)',
    'Ethanol':  r'\b(?:EtOH|Ethanol)\s*[:=]?\s*(\d{1,3})',
    'Osm':      r'\b(?:Osm|Osmolality)\s*[:=]?\s*(\d{3})',
    'Salicylate': r'\b(?:Salicylate|ASA|水楊酸)\s*(?:level|conc\w*)?\s*[:=]?\s*(\d{1,3}(?:\.\d)?)',
    'K':        r'\bK\s*[:=]?\s*([1-9](?:\.\d)?)',
}


def parse_labs(text: str) -> dict:
    labs = {}
    for key, pat in LAB_RULES.items():
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            labs[key] = float(m.group(1))
    return labs


DRUG_PATTERNS = [
    (r'metformin|glucophage', 'Metformin', 'MALA'),
    (r'gliflozin|jardiance|forxiga|invokana', 'SGLT2i', 'eDKA'),
    (r'ibuprofen|diclofenac|ketorolac|naproxen|sartan|pril\b', 'NSAID/RASi', 'AKI 加劇'),
    (r'aspirin|salicyl', 'Salicylate', '水楊酸中毒'),
    (r'linezolid|propofol|stavudine|tenofovir', '粒線體毒性藥物', 'Type B lactate'),
]


def parse_meds(text: str):
    t = text.lower()
    return [(n, r) for p, n, r in DRUG_PATTERNS if re.search(p, t)]


# ------------------------------------------------------------------
# 3. 生化計算（缺值一律回傳 None，不假設正常）
# ------------------------------------------------------------------
def compute(labs: dict) -> dict:
    na, cl, hco3 = labs.get('Na'), labs.get('Cl'), labs.get('HCO3')
    out = {'ag': None, 'ag_corr': None, 'osm_gap': None, 'delta_ratio': None}

    if None not in (na, cl, hco3):
        ag = na - (cl + hco3)
        out['ag'] = ag
        alb = labs.get('Albumin')
        if alb is not None:
            out['ag_corr'] = ag + 2.5 * (4.0 - alb)
        eff_ag = out['ag_corr'] if out['ag_corr'] is not None else ag
        if hco3 < 24:
            out['delta_ratio'] = (eff_ag - 12) / (24 - hco3) if hco3 != 24 else None

    # 滲透壓間隙：Na、Glucose、BUN、實測 Osm 四項缺一不可。
    # 舊版曾以 Glucose=90 / BUN=14 代入缺值，會在高血糖或尿毒病人身上
    # 高估 osm gap 數十 mOsm，把 HHS／腎衰竭誤導向毒性酒精，方向最危險。
    glu, bun, osm = labs.get('Glucose'), labs.get('BUN'), labs.get('Osm')
    if None not in (na, glu, bun, osm):
        calc = 2 * na + glu / 18.0 + bun / 2.8
        if labs.get('Ethanol') is not None:
            calc += labs['Ethanol'] / 3.7          # 未加此項會把酒精誤判為毒醇
        out['osm_gap'] = osm - calc
    return out


# ------------------------------------------------------------------
# 4. 病因並列評分（可同時成立，不互斥）
# ------------------------------------------------------------------
def score_etiologies(labs, meds, calc, alcohol_hx, sepsis_suspect):
    ag = calc['ag_corr'] if calc['ag_corr'] is not None else calc['ag']
    high_ag = ag is not None and ag >= 16
    lac, cr, ph = labs.get('Lactate'), labs.get('Cr'), labs.get('pH')
    glu, bhb, og = labs.get('Glucose'), labs.get('Ketone'), calc['osm_gap']
    drugs = [m[0] for m in meds]
    res = []

    def add(name, hits, total, note):
        if hits:
            res.append({'name': name, 'hits': hits, 'total': total, 'note': note})

    # 毒性酒精
    h = []
    if og is not None and og > 20: h.append(f"Osm gap {og:.0f} > 20（已扣除已測 ethanol）")
    if high_ag: h.append(f"AG {ag:.0f} 升高")
    if lac is not None and lac < 5 and high_ag: h.append("高 AG 但乳酸不高 → 未解釋之陰離子")
    add("毒性酒精（甲醇 / 乙二醇）", h, 3,
        "Osm gap 正常不能排除（晚期母體已代謝完）。需要視覺症狀、尿液草酸鈣結晶、毒物濃度佐證。")

    # MALA
    h = []
    if 'Metformin' in drugs: h.append("藥歷含 Metformin")
    if lac is not None and lac >= 5: h.append(f"Lactate {lac}")
    if cr is not None and cr >= 1.5: h.append(f"Cr {cr}（腎排除下降）")
    if ph is not None and ph <= 7.20: h.append(f"pH {ph}")
    add("MALA（metformin 相關乳酸酸中毒）", h, 4,
        "台灣多數院所無法急測 metformin 濃度，屬臨床診斷。與敗血症可並存，不應互斥判讀。")

    # 敗血 / 組織缺氧
    h = []
    if sepsis_suspect: h.append("臨床疑感染")
    if lac is not None and lac >= 4: h.append(f"Lactate {lac} ≥ 4")
    add("Type A 乳酸酸中毒（灌流不足 / 敗血）", h, 2,
        "最常見且最不可漏。即使符合 MALA 也應同時覆蓋感染源。")

    # 酮酸（DKA / eDKA / AKA）
    h = []
    if bhb is not None and bhb >= 3: h.append(f"BHB {bhb}")
    if 'SGLT2i' in drugs: h.append("藥歷含 SGLT2i")
    if alcohol_hx: h.append("酗酒 / 禁食嘔吐病史")
    if glu is not None and glu < 250 and high_ag: h.append("血糖 <250 但高 AG（eDKA/AKA 型態）")
    add("酮酸中毒（DKA / eDKA / AKA）", h, 4,
        "關鍵是血清 BHB，不是血糖。SGLT2i 停藥後酮體仍可持續數日。")

    # 水楊酸
    h = []
    if 'Salicylate' in drugs: h.append("藥歷含 salicylate")
    if high_ag and ph is not None and ph > 7.40: h.append("高 AG 併鹼血症 → 混合型，典型水楊酸")
    add("水楊酸中毒", h, 2, "呼吸性鹼中毒＋代謝性酸中毒併存時務必驗濃度。")

    # 尿毒
    h = []
    if cr is not None and cr >= 4: h.append(f"Cr {cr}")
    if high_ag: h.append("高 AG")
    add("尿毒性酸中毒", h, 2, "須為慢性或明確重度 AKI，且已排除其他來源。")

    res.sort(key=lambda x: (len(x['hits']) / x['total'], len(x['hits'])), reverse=True)
    return res


# ------------------------------------------------------------------
# 5. 缺漏檢驗
# ------------------------------------------------------------------
def missing_tests(labs):
    miss = []
    if labs.get('Ketone') is None:
        miss.append("血清 β-hydroxybutyrate — 未驗則無法排除 eDKA / AKA；"
                    "ADA/EASD 2024 已將 BHB ≥3.0 mmol/L 納入 DKA 診斷標準")
    if labs.get('Osm') is None:
        miss.append("血清滲透壓（需與血液同時抽）— 未驗則無法評估毒醇")
    if labs.get('Ethanol') is None and labs.get('Osm') is not None:
        miss.append("血中 ethanol — 未扣除會把酒精誤判成甲醇/乙二醇")
    # osm gap 需要 Na、Glucose、BUN、Osm 四項齊備，缺任一項就不計算
    if labs.get('Osm') is not None:
        lack = [n for n, k in (('血糖', 'Glucose'), ('BUN', 'BUN'), ('Na', 'Na'))
                if labs.get(k) is None]
        if lack:
            miss.append(f"{'、'.join(lack)} — 缺這幾項就無法計算滲透壓間隙"
                        "（本程式不以假設正常值代入）")
    if labs.get('Albumin') is None:
        miss.append("Albumin — 低白蛋白會低估 AG")
    if labs.get('Lactate') is None:
        miss.append("Lactate")
    return miss


# ------------------------------------------------------------------
# 6. 透析指徵
# ------------------------------------------------------------------
def dialysis_assessment(labs, calc, top_names):
    ph, lac, cr = labs.get('pH'), labs.get('Lactate'), labs.get('Cr')
    ag = calc['ag_corr'] if calc['ag_corr'] is not None else calc['ag']
    og, sal = calc['osm_gap'], labs.get('Salicylate')
    urgent, consider = [], []

    if any('毒性酒精' in n for n in top_names):
        if ph is not None and ph <= 7.15:
            urgent.append("pH ≤7.15：EXTRIP 甲醇建議體外清除（1D）。"
                          "**解毒劑不可等透析**，fomepizole 先給 [E-MeOH]")
        if ag is not None and ag > 24:
            urgent.append(f"AG {ag:.0f} >24：EXTRIP 甲醇建議體外清除（1D）[E-MeOH]")
        consider.append("EXTRIP 甲醇濃度門檻：有 fomepizole >700 mg/L、有 ethanol >600 mg/L、"
                        "無 ADH 阻斷劑 >500 mg/L；另昏迷、癲癇、新發視覺缺損亦為指徵 [E-MeOH]")
        consider.append("EXTRIP 乙二醇（2023 改版）：用 fomepizole 時濃度 >50 mmol/L 或 osm gap >50；"
                        "glycolate >12 mmol/L 或 AG >27 mmol/L；或昏迷、癲癇、AKI [E-EG]")
        consider.append("停止時機：甲醇 <200 mg/L 且臨床改善；透析期間 ADH 阻斷劑與 folate 需續用 [E-MeOH]")

    if any('MALA' in n for n in top_names):
        if (lac is not None and lac > 20) or (ph is not None and ph <= 7.00):
            urgent.append("lactate >20 mmol/L 或 pH ≤7.00：EXTRIP 建議體外清除（1D）[E-MET]")
        elif (lac is not None and lac > 15) or (ph is not None and ph <= 7.10):
            consider.append("lactate >15 mmol/L 或 pH ≤7.10：EXTRIP 建議考慮體外清除（2D）[E-MET]")
        if cr is not None and cr >= 2.0:
            consider.append("腎功能受損為 EXTRIP 列出的共病之一（1D），會下修上述門檻；"
                            "其餘為休克（1D）、肝衰竭（2D）、意識下降（2D）[E-MET]")
        consider.append("首選間歇性血液透析（含碳酸氫鹽透析液，1D）；"
                        "停止時機為 lactate <3 mmol/L 且 pH >7.35（1D）[E-MET]")

    if any('水楊酸' in n for n in top_names):
        if sal is not None and sal > 100:
            urgent.append(f"水楊酸 {sal:.0f} mg/dL >100：EXTRIP 建議體外清除（1D）[E-SAL]")
        elif sal is not None and sal > 90:
            urgent.append(f"水楊酸 {sal:.0f} mg/dL >90：腎功能受損時建議（1D）、"
                          "腎功能正常時為建議考慮（2D）[E-SAL]")
        if ph is not None and ph <= 7.20:
            consider.append("pH ≤7.20：EXTRIP 建議考慮體外清除（2D）[E-SAL]")
        consider.append("意識改變、新發需氧氣之低血氧、標準治療失敗 → EXTRIP 建議體外清除（1D）；"
                        "首選間歇性 HD，停止時機為濃度 <19 mg/dL 且臨床改善 [E-SAL]")
        consider.append("**插管是水楊酸最典型的醫源性致命錯誤**：鎮靜癱瘓後代償性過度換氣中斷，"
                        "pH 驟降使水楊酸大量進入中樞。若無法避免，插管前先給碳酸氫鈉、"
                        "插管後比照插管前的分鐘換氣量，並同步啟動透析 [ACMT-SAL]")

    consider.append("一般 AKI：無危及生命指徵時，延後 RRT 不劣於早期啟動（STARRT-AKI / AKIKI）— "
                    "依高鉀、容積過載、難治性酸血症、尿毒症狀決定，不以單一 pH 數值啟動 [KDIGO]")
    return urgent, consider


# ------------------------------------------------------------------
# 7. 處置建議
# ------------------------------------------------------------------
def orders_for(name, labs, weight, age=None):
    cr = labs.get('Cr')
    aki = cr is not None and cr >= 1.5
    give, avoid = [], []

    if '毒性酒精' in name:
        give += [
            "Fomepizole 15 mg/kg IV loading → 10 mg/kg q12h ×4 劑 → 之後 15 mg/kg q12h；"
            "透析進行中改為 q4h 或連續輸注（劑量依院內藥典/毒物中心確認）",
            "無 fomepizole 時以 ethanol 輸注維持血中濃度約 100 mg/dL",
            "疑甲醇：folinic acid（或 folic acid）1 mg/kg，單次上限 50 mg，IV q4–6h",
            "疑乙二醇：thiamine 100 mg + pyridoxine 50–100 mg IV",
            "立即照會毒物科與腎臟科；送驗甲醇/乙二醇濃度與尿液鏡檢（草酸鈣結晶）",
            "透析期間 ADH 阻斷劑與 folate 不可停，需續用至濃度降到停止門檻 [E-MeOH]",
        ]
        avoid.append("勿因等待濃度報告而延遲 fomepizole — 解毒劑優先於確診")

    elif 'MALA' in name:
        give += [
            "停用 metformin 及所有 nephrotoxin",
            "依灌流指標滴定輸液復甦（乳酸清除、尿量、血壓），同時監測容積過載",
            "照會腎臟科評估 HD（清除率優於 CRRT；血流動力不穩時用 CRRT）",
            "同時覆蓋感染源：血液培養 ×2 後給經驗性抗生素（MALA 與敗血症常並存）",
        ]
        avoid += [
            "勿一律套用固定低速輸液。SSC 2026 對敗血性休克仍建議 3 小時內至少 30 mL/kg，"
            "但強調需個別化並頻繁再評估，避免過量或不足；MALA 常併容積過載，"
            "給的同時要盯灌流指標 [SSC2026]",
            "AKI 未穩定期避免非必要顯影劑",
            "勿因 bicarbonate 輸注而延後透析評估",
        ]

    elif 'Type A' in name:
        fluid = f"約 {int(weight*30)} mL" if weight else "30 mL/kg"
        give += [
            f"初始晶體輸液至少 {fluid}，於 3 小時內給完，之後以動態指標滴定；"
            "肥胖者以理想或校正體重計算，不用實際體重 [SSC2026]",
            "抗生素前完成血液培養 ×2；敗血性休克或已確立之敗血症，"
            "立即給經驗性抗生素、理想上 1 小時內（強建議）[SSC2026]",
            "首劑抗生素不因 AKI 減量；後續劑量再依腎功能調整",
        ]
        if age and age >= 65:
            give.append(f"{int(age)} 歲：SSC 2026 新增條件式建議，"
                        "≥65 歲初始 MAP 目標可設 60–65 mmHg，以減少升壓劑暴露 [SSC2026]")
        else:
            give.append("初始 MAP 目標 65 mmHg [SSC2026]")
        if aki:
            avoid.append("AKI 急性期 Cr 尚未穩定，Cockcroft-Gault 估算不可靠，勿據此減量首劑")

    elif '酮酸' in name:
        give += [
            "送驗血清 BHB 並每 2–4 小時追蹤。ADA/EASD 2024 已把定量 BHB 納入診斷與"
            "療效判定，收酮以 BHB 為準而非血糖或 AG [ADA2024]",
            "診斷門檻（三項齊備）：血糖 ≥200 mg/dL 或已知糖尿病、BHB ≥3.0 mmol/L"
            "（或尿酮 ≥2+）、pH <7.3 或 HCO₃ <18。**AG 已不再列為第一線診斷標準** [ADA2024]",
            "Thiamine 100 mg IV 先於含糖輸液（酗酒者）",
            "AKA：D5 含鹽輸液即可逆轉，多不需胰島素",
            "eDKA：胰島素輸注 0.1 U/kg/hr，血糖 <250 mg/dL 即加 D5–D10 併行，"
            "撐到酮體清除為止；停 SGLT2i [ADA2024]",
            "補鉀：**K <3.5 mmol/L 先以 10 mmol/hr 補鉀並暫緩胰島素**，"
            "待 K >3.5 再開始（2024 共識由舊版 3.3 上修）；監測磷與鎂 [ADA2024]",
            "緩解條件：BHB <3.0 mmol/L、pH >7.3、HCO₃ >15 mmol/L 且臨床穩定 [ADA2024]",
        ]
        avoid.append("勿因血糖正常而排除酮酸中毒；SGLT2i 使用者的 eDKA 血糖可完全正常")

    elif '水楊酸' in name:
        give += [
            "送驗水楊酸濃度並每 2 小時追蹤至確定下降（單次數值無法判斷，"
            "腸衣錠與胃石可使吸收延遲數小時）",
            "鹼化尿液（碳酸氫鈉輸注，目標尿 pH 7.5–8）並積極補鉀——"
            "低血鉀會使腎小管重吸收水楊酸，鹼化就無效 [ACMT-SAL]",
            "體外清除門檻：>100 mg/dL；腎功能受損時 >90 mg/dL；"
            "意識改變或新發需氧氣之低血氧（1D）；pH ≤7.20（2D）[E-SAL]",
            "照會毒物科與腎臟科",
        ]
        avoid.append("**避免插管**。鎮靜癱瘓後代償性過度換氣中斷，pH 驟降使水楊酸"
                     "大量進入中樞，是本病最典型的醫源性死因。若非插管不可：先給碳酸氫鈉、"
                     "插管後比照插管前的分鐘換氣量，並同步（而非之後）啟動透析 [ACMT-SAL]")

    elif '尿毒' in name:
        give.append("照會腎臟科；依高鉀、容積過載、尿毒症狀決定 RRT 時機")

    return give, avoid


# ==================================================================
# UI
# ==================================================================
st.title("🧪 AcidoScope")
st.caption("高陰離子隙代謝性酸中毒鑑別輔助 · 決策輔助工具，不取代臨床判斷")

with st.sidebar:
    st.header("病患參數")
    age = st.number_input("年齡", 18, 110, 65)
    weight = st.number_input("體重 (kg)", 30.0, 200.0, 60.0)
    alcohol_hx = st.checkbox("酗酒 / 近期禁食嘔吐")
    sepsis_suspect = st.checkbox("臨床疑似感染")
    st.caption("🛡️ 純本地運算，無外部 API。請勿貼入真實病人識別資料。")

col_l, col_r = st.columns([1, 1.4])

with col_l:
    st.subheader("輸入")
    lab_raw = st.text_area(
        "檢驗數值",
        "pH: 7.02  HCO3: 8  Lactate: 18.5\nNa: 138  Cl: 98  Albumin: 2.8\nCr: 4.2  BUN: 58  Glu: 165",
        height=130,
    )
    med_raw = st.text_area(
        "用藥清單",
        "Metformin 500mg tid\nEmpagliflozin 10mg qd\nValsartan 80mg qd",
        height=100,
    )

    labs = parse_labs(deidentify(lab_raw))
    meds = parse_meds(deidentify(med_raw))
    calc = compute(labs)

    st.caption(f"擷取 {len(labs)} 項檢驗 · 標記藥物：{', '.join(m[0] for m in meds) or '無'}")

    bits = []
    if calc['ag'] is not None:
        bits.append(f"AG {calc['ag']:.0f}")
    if calc['ag_corr'] is not None:
        bits.append(f"白蛋白校正後 AG {calc['ag_corr']:.0f}")
    if calc['osm_gap'] is not None:
        bits.append(f"Osm gap {calc['osm_gap']:.0f}")
    else:
        bits.append("Osm gap 未測")
    if calc['delta_ratio'] is not None:
        bits.append(f"Δ/Δ {calc['delta_ratio']:.1f}")
    st.info(" ｜ ".join(bits) if bits else "資料不足，無法計算 AG")

with col_r:
    st.subheader("① 可能病因（可並存，非互斥）")
    ranked = score_etiologies(labs, meds, calc, alcohol_hx, sepsis_suspect)

    if not ranked:
        st.warning("目前資料不足以支持任一特定病因。請補齊下方缺漏檢驗。")
    for i, e in enumerate(ranked[:4]):
        label = f"**{e['name']}** — 符合 {len(e['hits'])}/{e['total']} 項"
        if i == 0:
            st.error(label)
        else:
            st.markdown(label)
        for h in e['hits']:
            st.markdown(f"  • {h}")
        st.caption(f"↳ {e['note']}")

    top_names = [e['name'] for e in ranked[:2]]

    st.subheader("② 尚未取得、會改變判讀的檢驗")
    miss = missing_tests(labs)
    if miss:
        for m in miss:
            st.warning(f"❓ {m}")
    else:
        st.success("關鍵檢驗均已取得")

    st.subheader("③ 體外清除 / RRT 評估")
    urgent, consider = dialysis_assessment(labs, calc, top_names)
    for u in urgent:
        st.error(f"🚨 {u}")
    for c in consider:
        st.info(f"• {c}")

st.divider()
st.subheader("④ 建議處置")

for name in top_names:
    give, avoid = orders_for(name, labs, weight, age)
    if not (give or avoid):
        continue
    with st.expander(f"針對「{name}」的處置", expanded=True):
        for g in give:
            st.markdown(f"✅ {g}")
        for a in avoid:
            st.markdown(f"⛔ {a}")

st.divider()
with st.expander("📋 會診用摘要（自行核對後使用）"):
    st.text_area(
        "SBAR",
        f"""S：高陰離子隙代謝性酸中毒，鑑別診斷以 {' / '.join(top_names) or '待確認'} 為優先。
B：{age} 歲，{weight} kg。用藥標記：{', '.join(m[0] for m in meds) or '無'}。
A：pH {labs.get('pH','-')}、HCO3 {labs.get('HCO3','-')}、Lactate {labs.get('Lactate','-')}、
   AG {f"{calc['ag']:.0f}" if calc['ag'] is not None else '-'}、
   Osm gap {f"{calc['osm_gap']:.0f}" if calc['osm_gap'] is not None else '未測'}、
   Cr {labs.get('Cr','-')}。
   未取得檢驗：{'；'.join(miss) or '無'}
R：{'；'.join(urgent) if urgent else '目前無立即體外清除之絕對指徵，建議共同評估。'}
（AcidoScope 自動生成草稿，內容須由醫師核對）""",
        height=200,
    )

st.divider()
with st.expander(f"📚 文獻依據（最後查證 {EVIDENCE_REVIEWED}）"):
    st.caption(
        "建議文字中的 [代號] 對應下表。本程式為教學與決策輔助用途，"
        "引用的是各學會原始聲明，非任何訂閱資料庫之內容；"
        "臨床使用請以最新原文與院內規範為準。"
    )
    for tag, r in REFS.items():
        st.markdown(f"**[{tag}]** {r['title']}　*{r['source']}*　{r['year']}")
        if r.get('note'):
            st.caption(f"　↳ {r['note']}")
        if r.get('url'):
            st.caption(f"　{r['url']}")

st.caption("⚠️ 臨床決策輔助工具，不取代醫師判斷。所有劑量以院內藥典與毒物中心為準。")
