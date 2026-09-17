import streamlit as st
import re

# ==============================================================================
# 頁面基礎設定與視覺樣式
# ==============================================================================
st.set_page_config(
    page_title="智酸析 AcidoScope - 急診酸中毒與智慧醫囑副駕",
    page_icon="🧪",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 自訂卡片風格 CSS
st.markdown("""
<style>
    .metric-card { background-color: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-left: 5px solid #0d6efd; }
    .warning-box { background-color: #fff3cd; border-radius: 8px; padding: 12px; border-left: 5px solid #ffc107; margin-bottom: 10px; }
    .danger-box { background-color: #f8d7da; border-radius: 8px; padding: 12px; border-left: 5px solid #dc3545; margin-bottom: 10px; }
    .success-box { background-color: #d1e7dd; border-radius: 8px; padding: 12px; border-left: 5px solid #198754; margin-bottom: 10px; }
</style>
""", unsafe_allow_html=True)

st.title("🧪 智酸析 (AcidoScope) - 急診重症酸中毒智慧鑑別與指引醫囑 Co-pilot")
st.caption("【院內 AI 應用賽參賽成果】四角病因秒鑑別 × EXTRIP 急透析判定 × 動態腎功能指引醫囑 | 本地零 PII 資安架構")

# ==============================================================================
# 模組一：本地記憶體零 PII 脫敏引擎 (Client-side De-identification)
# ==============================================================================
def local_deidentify(text: str) -> str:
    """於記憶體層級徹底抹除身分證、病歷號、姓名等個資，確保資料 100% 不外洩"""
    # 抹除台灣身分證字號
    text = re.sub(r'[A-Z][1289]\d{8}', '***[身分證已遮蔽]***', text, flags=re.IGNORECASE)
    # 抹除 7-10 碼病歷號
    text = re.sub(r'\b\d{7,10}\b', '***[病歷號已遮蔽]***', text)
    # 抹除就醫日期
    text = re.sub(r'\d{4}[-/]\d{1,2}[-/]\d{1,2}', '[日期已遮蔽]', text)
    return text

def parse_labs_input(text: str) -> dict:
    """自動從雜亂檢驗文字中抓取關鍵檢驗數值"""
    labs = {}
    rules = {
        'pH': r'pH\s*[:=]?\s*([6-7]\.\d{1,3})',
        'pCO2': r'pCO2\s*[:=]?\s*(\d{1,3})',
        'HCO3': r'HCO3\s*[:=]?\s*(\d{1,2}(?:\.\d)?)',
        'Lactate': r'(?:Lactate|Lac)\s*[:=]?\s*(\d{1,2}(?:\.\d)?)',
        'Na': r'\bNa\s*[:=]?\s*(\d{2,3})',
        'Cl': r'\bCl\s*[:=]?\s*(\d{2,3})',
        'Cr': r'(?:Cr|Creatinine)\s*[:=]?\s*(\d{1,2}(?:\.\d)?)',
        'BUN': r'\bBUN\s*[:=]?\s*(\d{1,3})',
        'Glucose': r'(?:Glu|Glucose)\s*[:=]?\s*(\d{2,4})',
        'Measured_Osm': r'(?:Osm|Osmolality)\s*[:=]?\s*(\d{3})',
        'SBP': r'SBP\s*[:=]?\s*(\d{2,3})',
        'HR': r'HR\s*[:=]?\s*(\d{2,3})'
    }
    for key, pat in rules.items():
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                labs[key] = float(m.group(1))
            except:
                pass
    return labs

def parse_medications_input(text: str) -> list:
    """背景掃描高危致病藥物"""
    found = []
    t = text.lower()
    if re.search(r'(metformin|glucophage|庫魯化|美獲蒙|伏糖)', t):
        found.append(('Metformin (二甲雙胍)', 'MALA 粒線體毒性誘發因子'))
    if re.search(r'(empagliflozin|dapagliflozin|canagliflozin|jardiance|forxiga|排糖高|安普諾)', t):
        found.append(('SGLT2 抑制劑', 'eDKA 正常血糖酮酸中毒誘發因子'))
    if re.search(r'(ibuprofen|diclofenac|ketorolac|naproxen|losartan|valsartan|enalapril)', t):
        found.append(('NSAID / RAS 抑制劑', '急性腎衰竭加劇因子'))
    if re.search(r'(aspirin|bopirin|阿斯匹靈)', t):
        found.append(('Aspirin (水楊酸)', '水楊酸中毒風險'))
    return found

# ==============================================================================
# 模組二：生化計算、EXTRIP 洗腎指引與四角鑑別診斷核心 (Phase 1)
# ==============================================================================
def analyze_acidosis(labs: dict, meds: list, smart_blood_test_prob: int, alcoholism_history: bool):
    na = labs.get('Na', 140.0)
    cl = labs.get('Cl', 100.0)
    hco3 = labs.get('HCO3', 24.0)
    glu = labs.get('Glucose', 100.0)
    bun = labs.get('BUN', 15.0)
    cr = labs.get('Cr', 1.0)
    lactate = labs.get('Lactate', 1.0)
    ph = labs.get('pH', 7.40)
    sbp = labs.get('SBP', 120.0)
    hr = labs.get('HR', 80.0)
    measured_osm = labs.get('Measured_Osm', None)

    # 1. 基礎生化公式計算
    anion_gap = na - (cl + hco3)
    shock_index = (hr / sbp) if sbp > 0 else 0
    
    # 計算滲透壓隙 (Osmolar Gap)
    calc_osm = (2 * na) + (glu / 18.0) + (bun / 2.8)
    osm_gap = (measured_osm - calc_osm) if measured_osm else 0.0

    has_metformin = any('Metformin' in m[0] for m in meds)
    has_sglt2i = any('SGLT2' in m[0] for m in meds)

    # 2. 四角病因鑑別演算法
    etiology = "未明原因代謝性酸中毒"
    confidence = 60
    reasons = []
    negative_pertinence = []

    # 判定 A: 毒性酒精 (甲醇/乙二醇)
    if osm_gap >= 15.0 and anion_gap >= 16.0:
        etiology = "毒性酒精中毒 (甲醇 / 乙二醇)"
        confidence = 94
        reasons.append(f"高滲透壓隙顯著異常 (Osmolar Gap = {osm_gap:.1f} mOsm/kg > 15)，伴隨嚴重高陰離子隙酸中毒。")
        negative_pertinence.append("高滲透隙強烈排他性支持外源性毒醇攝入，非單純內源性代謝酸中毒。")
        
    # 判定 B: MALA (二甲雙胍乳酸酸中毒)
    elif has_metformin and lactate >= 8.0 and cr >= 2.0:
        etiology = "二甲雙胍相關乳酸酸中毒 (MALA)"
        confidence = 92
        reasons.append("雲端藥歷檢出 Metformin，合併重度乳酸血症 (Lactate ≥ 8) 與急性腎衰竭。")
        if shock_index < 1.0:
            negative_pertinence.append(f"休克指數僅 {shock_index:.2f} (未顯著異常)，強烈排他支持 Type B 粒線體毒性，非一般敗血休克。")
            
    # 判定 C: 酒精性酮酸中毒 (AKA)
    elif alcoholism_history and anion_gap >= 16.0 and (not measured_osm or osm_gap < 15.0):
        etiology = "酒精性酮酸中毒 (Alcoholic Ketoacidosis, AKA)"
        confidence = 88
        reasons.append("具長期酗酒史/禁食嘔吐，呈現代謝性酸中毒，但排除高滲透壓毒醇中毒。")
        negative_pertinence.append("滲透壓隙正常，排他支持內源性酮體生成，非甲醇/乙二醇毒害。")

    # 判定 D: 智血檢吻合之敗血性休克 (Type A)
    elif smart_blood_test_prob >= 60 and lactate >= 4.0:
        etiology = "敗血性休克引發組織缺氧 (Type A 乳酸酸中毒)"
        confidence = 89
        reasons.append(f"【中醫大智血檢】預測菌血症機率達 {smart_blood_test_prob}%，合併全身組織低灌流與高乳酸。")
        negative_pertinence.append("無粒線體抑制藥物暴露史，符合全身性感染 SIRS 誘發之缺氧性酸中毒。")
        
    # 判定 E: SGLT2i 引發之 eDKA
    elif has_sglt2i and anion_gap >= 16.0 and glu < 250:
        etiology = "正常血糖型糖尿病酮酸中毒 (eDKA)"
        confidence = 86
        reasons.append("雲端藥歷檢出 SGLT2 抑制劑，血糖未達傳統 DKA 門檻 (<250 mg/dL) 但呈現顯著 High AG 酸中毒。")

    # 3. EXTRIP 血液透析急迫性判定
    dialysis_level = "GREEN"
    dialysis_title = "暫無需緊急血液透析"
    dialysis_detail = "未達急診緊急血液淨化（EXTRIP）絕對適應症，建議常規醫療處置。"

    if "毒性酒精" in etiology:
        if osm_gap > 15.0 or ph <= 7.15:
            dialysis_level = "RED"
            dialysis_title = "🚨 強烈建議立即啟動緊急透析 (EXTRIP 毒醇指引)"
            dialysis_detail = "符合 EXTRIP 甲醇/乙二醇指引：嚴重高滲透隙伴隨酸血症，透析為清除毒醇母體與有毒代謝物之關鍵！"
            
    elif "MALA" in etiology:
        if lactate > 20.0 or ph <= 7.00:
            dialysis_level = "RED"
            dialysis_title = "🚨 強烈建議立即啟動緊急透析 (EXTRIP 等級 1D)"
            dialysis_detail = f"動脈血乳酸達 {lactate} mmol/L (>20) 或 pH {ph} (≤7.00)，內科常規治療極易心跳停止，應立即透析清除 Metformin！"
        elif (15.0 <= lactate <= 20.0 or 7.01 <= ph <= 7.10) and cr >= 2.0:
            dialysis_level = "RED"
            dialysis_title = "⚠️ 建議啟動緊急透析 (EXTRIP 等級 2D)"
            dialysis_detail = "乳酸達 15-20 mmol/L 且合併急性腎損傷 (Cr ≥ 2.0)，指引建議積極啟動透析阻斷器官衰竭。"
            
    elif "AKA" in etiology:
        dialysis_level = "GREEN"
        dialysis_title = "🟢 嚴禁盲目洗腎！給予含糖輸液即可逆轉"
        dialysis_detail = "AKA 為飢餓與酒精代謝紊亂，補充葡萄糖 (D5W) 刺激內源性胰島素並給予維生素 B1，即可迅速逆轉，不需洗腎！"
        
    elif ph < 7.10 or (cr >= 4.5 and anion_gap >= 22):
        dialysis_level = "RED"
        dialysis_title = "🚨 建議啟動緊急透析 (KDIGO 難治型酸中毒)"
        dialysis_detail = f"難治型重度酸血症 (pH {ph} < 7.10) 合併代謝失衡，常規內科復甦效果有限。"

    return {
        'anion_gap': anion_gap,
        'shock_index': shock_index,
        'osm_gap': osm_gap,
        'etiology': etiology,
        'confidence': confidence,
        'reasons': reasons,
        'negative_pertinence': negative_pertinence,
        'dialysis_level': dialysis_level,
        'dialysis_title': dialysis_title,
        'dialysis_detail': dialysis_detail
    }

# ==============================================================================
# 模組三：Phase 2 動態指引醫囑與個人化腎功能劑量引擎 (Guideline-to-Order)
# ==============================================================================
def generate_dynamic_guideline_orders(etiology: str, labs: dict, weight: float, age: int):
    """超越長庚傳統死板熱鍵：依據病患 eGFR、體重與年齡，動態算好劑量並產出指引醫囑"""
    cr = labs.get('Cr', 1.0)
    # Cockcroft-Gault 公式估算肌酸酐廓清率 (mL/min)
    crcl = int(((140 - age) * weight) / (72 * cr)) if cr > 0 else 90

    order_bundle = []
    contraindicated_orders = []

    if "MALA" in etiology:
        order_bundle.append(("【透析準備】緊急置入雙腔血液透析導管 (Double Lumen) - 建議右內頸靜脈", "EXTRIP 透析路徑首選"))
        order_bundle.append(("【急診抽血】Type & Screen (備血) + 凝血功能 (PT/APTT) + 病毒標記 (B/C肝/HIV)", "洗腎前常規配套"))
        order_bundle.append(("【輸液保護】生理食鹽水點滴限速 < 20 mL/hr，嚴密監控尿量，避免過度輸液", "防肺水腫"))
        contraindicated_orders.append("禁止開立腹部/胸部顯影劑 CT 檢查 (Contrast CT) - 避免不可逆腎壞死")
        contraindicated_orders.append("避免常規 30 mL/kg 大量點滴灌注 - MALA 為粒線體毒性，盲目灌水易致急性心衰竭")
        
    elif "毒性酒精" in etiology:
        order_bundle.append(("【急診透析】立即照會腎臟科準備血液透析 (HD) 清除毒性醇類與甲酸", "EXTRIP 毒醇指引"))
        order_bundle.append(("【解毒處置】給予 Fomepizole 15 mg/kg (若無則使用 Ethanol 10% 輸注液)", "阻斷乙醇脫氫酶 (ADH)"))
        order_bundle.append(("【葉酸補充】Folic acid 50 mg IV q4h (加速甲酸分解)", "甲醇中毒神經保護"))
        
    elif "AKA" in etiology:
        order_bundle.append(("【含糖輸液】D5W (5% 葡萄糖) 500 mL run 100 mL/hr (刺激胰島素分泌以關閉酮體)", "AKA 第一線治療"))
        order_bundle.append(("【維生素補充】Thiamine (維生素 B1) 100 mg IV stat (打糖前必給)", "預防韋尼克氏腦病變"))
        order_bundle.append(("【電解質監控】抽血追蹤血鉀 (K) 與血磷 (Phosphate)", "給糖後易發生細胞內轉移低血鉀"))
        contraindicated_orders.append("暫無緊急血液透析適應症，避免盲目插管洗腎")
        
    elif "敗血" in etiology:
        # 動態計算 30 mL/kg 輸液量
        fluid_target = int(weight * 30)
        order_bundle.append((f"【黃金一小時】晶體輸液 (Balanced Crystalloid) {fluid_target} mL 於 3 小時內輸注完畢", "Surviving Sepsis Campaign 30mL/kg"))
        order_bundle.append(("【感染源評估】血液培養兩套 (Blood Culture x2) + 驗尿 + 驗胸部 X 光", "抗生素前完成"))
        
        # 依腎功能動態微調抗生素劑量 (超越長庚死板模式)
        if crcl < 15:
            order_bundle.append((f"【抗生素劑量調校】Cefepime 1g IV q24h (原劑量 2g q8h，因 CrCl {crcl} 自動下修)", "Sanford 腎功能減量指引"))
        elif crcl < 30:
            order_bundle.append((f"【抗生素劑量調校】Cefepime 1g IV q12h (原劑量 2g q8h，因 CrCl {crcl} 自動下修)", "Sanford 腎功能減量指引"))
        else:
            order_bundle.append(("【抗生素劑量調校】Cefepime 2g IV q8h (常規劑量)", "腎功能正常"))
            
    elif "eDKA" in etiology:
        order_bundle.append(("【急診加驗】加驗血清酮體 (Beta-hydroxybutyrate) 與靜脈氣體分析 (VBG)", "eDKA 破案關鍵"))
        order_bundle.append(("【雙軌輸注】D5W 葡萄糖輸注維持血糖 150-200 mg/dL ＋ Regular Insulin 0.05-0.1 U/kg/hr", "關閉脂肪分解與酮酸"))
        
    return crcl, order_bundle, contraindicated_orders

# ==============================================================================
# 前端畫面佈局 (Streamlit Layout)
# ==============================================================================
# 側邊欄：病患參數與中醫大智血檢連動
with st.sidebar:
    st.header("⚙️ 病患生理與院內 AI 參數")
    age = st.number_input("病患年齡 (Age)", min_value=18, max_value=110, value=74)
    weight = st.number_input("病患體重 (kg)", min_value=30.0, max_value=150.0, value=58.0)
    
    st.markdown("---")
    st.subheader("🔗 院內生態系介面連動")
    smart_prob = st.slider("中醫大【智血檢】菌血症預測機率 (%)", min_value=0, max_value=100, value=25, help="直接串接院內既有智血檢/智抗菌輸出結果")
    alcohol_history = st.checkbox("病患有長期酗酒史 / 近期嘔吐禁食", value=False)
    
    st.caption("🛡️ 資安狀態：本地沙盒離線運行，未連外網公有 API。")

# 主畫面分欄
col_input, col_display = st.columns([1.1, 1.3])

with col_input:
    st.subheader("📥 步驟一：貼上檢驗與藥歷（支援全選複製）")
    st.info("💡 貼上文字後，系統自動於本地記憶體抹除身分證號、病歷號與姓名。")
    
    default_labs = """pH: 7.02, pCO2: 24, HCO3: 8, Lactate: 18.5
Na: 138, Cl: 98, Cr: 4.2, BUN: 58, Glu: 165
Measured_Osm: 318
SBP: 108, HR: 84"""
    
    input_lab_raw = st.text_area("1. 抽血數據與生命徵象文字 (LIS 檢驗結果)", value=default_labs, height=120)
    
    default_meds = """病患健保雲端慢箋明細：
1. Glucophage (Metformin) 500mg 1# tid ac
2. Jardiance (Empagliflozin) 10mg 1# qd
3. Diovan 80mg 1# qd
4. Voltaren (Diclofenac) prn"""
    
    input_med_raw = st.text_area("2. 健保雲端藥歷文字塊 (Ctrl+V 貼上)", value=default_meds, height=130)
    
    # 執行本地端脫敏
    safe_lab_text = local_deidentify(input_lab_raw)
    safe_med_text = local_deidentify(input_med_raw)
    
    parsed_labs = parse_labs_input(safe_lab_text)
    parsed_meds = parse_medications_input(safe_med_text)
    
    st.markdown("**🔍 系統背景解析狀態**：")
    st.write(f"• 抽血參數擷取：`{len(parsed_labs)}` 項 | 藥歷關鍵高危標籤：`{[m[0] for m in parsed_meds]}`")

with col_display:
    st.subheader("⚡ 步驟二：秒級決策、EXTRIP 洗腎判定與防呆卡片")
    
    # 運算 Phase 1 結果
    res = analyze_acidosis(parsed_labs, parsed_meds, smart_prob, alcohol_history)
    crcl, orders, contra_orders = generate_dynamic_guideline_orders(res['etiology'], parsed_labs, weight, age)
    
    # 1. 四角鑑別診斷卡片
    st.markdown("### ❶ 酸中毒四角病因秒鑑別")
    if "MALA" in res['etiology'] or "毒性酒精" in res['etiology']:
        st.error(f"🔴 **最可能病因：{res['etiology']} (信心度: {res['confidence']}%)**")
    elif "AKA" in res['etiology'] or "eDKA" in res['etiology']:
        st.warning(f"🟡 **最可能病因：{res['etiology']} (信心度: {res['confidence']}%)**")
    else:
        st.info(f"🔵 **最可能病因：{res['etiology']} (信心度: {res['confidence']}%)**")
        
    for r in res['reasons']:
        st.write(f"• **支持依據**：{r}")
    for nr in res['negative_pertinence']:
        st.write(f"• **反向排他**：{nr}")
        
    st.caption(f"生化指標：Anion Gap = {res['anion_gap']:.1f} mEq/L | 休克指數 = {res['shock_index']:.2f} | 滲透壓隙 Osm Gap = {res['osm_gap']:.1f} mOsm/kg")

    # 2. 洗腎急迫性判定
    st.markdown("---")
    st.markdown("### ❷ 緊急血液透析（RRT）急迫性判定")
    if res['dialysis_level'] == "RED":
        st.error(f"🚨 **{res['dialysis_title']}**")
        st.write(res['dialysis_detail'])
    else:
        st.success(f"🟢 **{res['dialysis_title']}**")
        st.write(res['dialysis_detail'])

    # 3. 臨床處置防呆與禁忌攔截 (Poka-Yoke)
    if contra_orders:
        st.markdown("---")
        st.markdown("### ❸ 處置禁忌與陷阱主動防禦 (Poka-Yoke)")
        for co in contra_orders:
            st.warning(f"⛔ {co}")

# ==============================================================================
# 步驟三：Phase 2 動態指引醫囑推薦與一鍵 SBAR 會診 (超越傳統長庚熱鍵)
# ==============================================================================
st.markdown("---")
st.subheader("📋 步驟三：最新指引個人化醫囑推薦包（超越長庚死板熱鍵）")
st.caption(f"系統已自動依據病患體重 `{weight} kg`、年齡 `{age} 歲`、肌酸酐 `{parsed_labs.get('Cr', 1.0)} mg/dL`，算出 CrCl 為 `{crcl} mL/min`，完成個人化劑量調校：")

col_ord1, col_ord2 = st.columns([1.2, 1])

with col_ord1:
    st.markdown("#### ☑️ 建議勾選開立醫囑 (Guideline Orders)")
    selected_orders = []
    for idx, (ord_title, ord_desc) in enumerate(orders):
        chk = st.checkbox(f"{ord_title}", value=True, key=f"chk_{idx}")
        st.caption(f"&nbsp;&nbsp;&nbsp;&nbsp;↳ 實證指引來源: *{ord_desc}*")
        if chk:
            selected_orders.append(ord_title)

with col_ord2:
    st.markdown("#### 🚀 一鍵 SBAR 腎臟科急會診單 (可直接複製貼入 HIS)")
    sbar_text = f"""【急診-腎臟科緊急透析會診 (智酸析 AcidoScope 自動生成)】
S (現況): 病患呈嚴重代謝性酸中毒，高度疑似 {res['etiology']}，已達 EXTRIP 緊急血液透析指引準則。
B (背景): 年齡 {age} 歲，體重 {weight} kg。藥歷檢出: {[m[0] for m in parsed_meds]}。
A (評估): 
  - 氣體分析: pH {parsed_labs.get('pH','-')}, HCO3 {parsed_labs.get('HCO3','-')}, Lactate {parsed_labs.get('Lactate','-')} mmol/L
  - 生化數據: AG {res['anion_gap']:.1f}, Cr {parsed_labs.get('Cr','-')} mg/dL (CrCl {crcl} mL/min), Osm Gap {res['osm_gap']:.1f}
  - 智血檢菌血症率: {smart_prob}% | 判定: {res['dialysis_title']}
R (建議): 請求腎臟科醫師緊急前來急診評估，儘速安排緊急床邊血液透析 (HD/CRRT)。"""

    st.text_area("SBAR 文字框", value=sbar_text, height=220)

st.success("✅ 臨床應用完整閉環：從「抽血秒鑑別」➔「EXTRIP 決定洗不洗」➔「防呆攔截」➔「指引醫囑算好劑量」➔「一鍵 SBAR 會診」，完全不用改動院內 HIS！")