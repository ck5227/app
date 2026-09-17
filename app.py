"""
AcidoScope — 急診高陰離子隙代謝性酸中毒 決策輔助
精簡版 v2：並列評分（非互斥）、缺值透明化、移除行銷語與偽信心度。
※ 臨床決策輔助，不取代醫師判斷。所有劑量以院內藥典/毒物中心為準。
"""

import re
import streamlit as st

st.set_page_config(page_title="AcidoScope", page_icon="🧪", layout="wide")

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

    if None not in (na, labs.get('Osm')):
        calc = 2 * na + labs.get('Glucose', 90) / 18.0 + labs.get('BUN', 14) / 2.8
        if labs.get('Ethanol') is not None:
            calc += labs['Ethanol'] / 3.7          # 未加此項會把酒精誤判為毒醇
        out['osm_gap'] = labs['Osm'] - calc
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
        miss.append("血清 β-hydroxybutyrate — 未驗則無法排除 eDKA / AKA")
    if labs.get('Osm') is None:
        miss.append("血清滲透壓（需與血液同時抽）— 未驗則無法評估毒醇")
    if labs.get('Ethanol') is None and labs.get('Osm') is not None:
        miss.append("血中 ethanol — 未扣除會把酒精誤判成甲醇/乙二醇")
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
    urgent, consider = [], []

    if any('毒性酒精' in n for n in top_names):
        if ph is not None and ph < 7.30:
            urgent.append("疑毒醇中毒併酸血症（pH <7.30）：EXTRIP/ACMT 建議體外清除，且**解毒劑不可等透析**")
        consider.append("其他透析指徵：視覺障礙、確診高濃度毒醇、腎損傷、解毒劑無法取得")

    if any('MALA' in n for n in top_names):
        if (lac is not None and lac > 20) or (ph is not None and ph <= 7.00):
            urgent.append("MALA 併 lactate >20 或 pH ≤7.00：EXTRIP 建議體外清除（強烈）")
        elif (lac is not None and lac > 15) or (ph is not None and ph <= 7.10) or (cr is not None and cr >= 2.0):
            consider.append("MALA 併 lactate >15 / pH ≤7.10 / 明顯 AKI：EXTRIP 建議考慮體外清除")

    if any('水楊酸' in n for n in top_names):
        consider.append("水楊酸：意識改變、肺水腫、腎損傷或濃度持續上升 → 透析指徵")

    consider.append("一般 AKI：無危及生命指徵時，延後 RRT 不劣於早期啟動（STARRT-AKI / AKIKI）— "
                    "依高鉀、容積過載、難治性酸血症、尿毒症狀決定，不以單一 pH 數值啟動")
    return urgent, consider


# ------------------------------------------------------------------
# 7. 處置建議
# ------------------------------------------------------------------
def orders_for(name, labs, weight):
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
            "勿一律套用固定低速輸液或一律 30 mL/kg bolus — 兩者皆非個別化",
            "AKI 未穩定期避免非必要顯影劑",
            "勿因 bicarbonate 輸注而延後透析評估",
        ]

    elif 'Type A' in name:
        fluid = f"約 {int(weight*30)} mL" if weight else "30 mL/kg"
        give += [
            f"初始晶體輸液 {fluid}（平衡鹽液），之後以動態指標滴定",
            "抗生素前完成血液培養 ×2；1 小時內給經驗性抗生素",
            "首劑抗生素不因 AKI 減量；後續劑量再依腎功能調整",
        ]
        if aki:
            avoid.append("AKI 急性期 Cr 尚未穩定，Cockcroft-Gault 估算不可靠，勿據此減量首劑")

    elif '酮酸' in name:
        give += [
            "送驗血清 BHB 並每 2–4 小時追蹤（以 BHB 而非血糖判斷是否收酮）",
            "Thiamine 100 mg IV 先於含糖輸液（酗酒者）",
            "AKA：D5 含鹽輸液即可逆轉，多不需胰島素",
            "eDKA：胰島素輸注必須與 dextrose 併行，維持血糖 150–200 mg/dL；停 SGLT2i",
            "補鉀：K <3.3 時先補鉀再給胰島素；監測磷與鎂",
        ]
        avoid.append("勿因血糖正常而排除酮酸中毒")

    elif '水楊酸' in name:
        give += [
            "送驗水楊酸濃度並每 2 小時追蹤至下降",
            "鹼化尿液（碳酸氫鈉輸注，目標尿 pH 7.5–8）並積極補鉀",
            "照會毒物科",
        ]
        avoid.append("避免插管；插管後過度換氣代償喪失可致急遽惡化")

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
    give, avoid = orders_for(name, labs, weight)
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

st.caption("依據：EXTRIP workgroup（metformin、甲醇、水楊酸）、ACMT 毒醇處置、"
           "Surviving Sepsis Campaign、KDIGO AKI 及 STARRT-AKI/AKIKI。請以最新原文與院內規範為準。")
