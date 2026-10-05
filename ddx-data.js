/* =====================================================================
   急診主訴鑑別參考系統 — 臨床內容與引用庫
   ---------------------------------------------------------------------
   設計原則：內容與引擎分離。本檔由臨床醫師維護與簽核，不含任何程式邏輯。

   引用治理：
   - 每一條臨床主張都必須掛上 refs[]，內容為 REFS 的鍵。
   - REFS 中 verified 為查證日期字串者方屬已查證；null 代表尚未經人工查證。
   - 引擎在載入時會逐條驗證；引用缺漏或未查證者，該主張一律封鎖不顯示。
   - 本系統結構上無法產生未經查證的引用——AI 只能從本庫挑選，不能生成。
   ===================================================================== */

const EVIDENCE_REVIEWED = '2026-10-06';

const REFS = {
  // ---------- 頭暈 ----------
  KATTAH2009: {
    t: 'HINTS to Diagnose Stroke in the Acute Vestibular Syndrome: Three-Step Bedside Oculomotor Examination More Sensitive than Early MRI DWI',
    src: 'Stroke', yr: 2009, sec: '40(11):3504–3510',
    url: 'https://www.ahajournals.org/doi/10.1161/strokeaha.109.551234',
    strength: '原始前瞻性研究',
    key: '水平頭部甩動試驗正常、凝視時方向改變之眼振、或垂直性眼位偏斜，三者任一存在對中樞病因敏感度 100%、特異度 96%；床邊 HINTS 排除中樞病因的能力優於發病 24–48 小時內的 MRI-DWI。',
    limit: '單一中心、由神經耳科專家執行，受試者均為具腦中風危險因子之急性前庭症候群病人。',
    verified: '2026-10-06'
  },
  PLOS2022HINTS: {
    t: 'The HINTS examination and STANDING algorithm in acute vestibular syndrome: A systematic review and meta-analysis involving frontline point-of-care emergency physicians',
    src: 'PLoS ONE', yr: 2022, sec: '17(5):e0266252',
    url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0266252',
    strength: '系統性回顧與統合分析',
    key: '合併敏感度 0.96（0.87–1.00）、特異度 0.88（0.85–0.91）。',
    limit: '納入研究之執行者訓練程度不一；特異度低於原始研究，提示實務表現可能遜於專家。',
    verified: '2026-10-06'
  },
  AEM2024HINTS: {
    t: 'Are the HINTS and HINTS Plus Examinations Accurate for Identifying a Central Cause of Acute Vestibular Syndrome?',
    src: 'Annals of Emergency Medicine', yr: 2024, sec: 'Systematic Review Snapshot',
    url: 'https://www.annemergmed.com/article/S0196-0644(24)00039-8/fulltext',
    strength: '系統性回顧',
    key: 'HINTS 與 HINTS Plus 對急性前庭症候群之中樞病因均有高敏感度與尚可之特異度，搭配錄影輔助時表現尤佳。',
    limit: '本條摘要自公開之系統性回顧摘要，全文為付費取得；院內導入前應取得全文核對數值。',
    verified: '2026-10-06'
  },
  HINTSCAVEAT: {
    t: 'Hints to the H.I.N.T.S. Exam for Acute Vestibular Syndrome',
    src: 'PMC（臨床實務回顧）', yr: 2025, sec: 'PMC12439488',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12439488/',
    strength: '敘述性回顧',
    key: '適用對象限於急性前庭症候群：突發且持續之眩暈，併噁心嘔吐、步態不穩與自發性眼振。判讀需以眼振存在為前提，無眼振者不適用。任一項發現不符合周邊定位，即不可排除中樞病因。',
    limit: '非系統性回顧；適用範圍之界定為專家意見。',
    verified: '2026-10-06'
  },

  // ---------- 發燒 ----------
  SSC2026: {
    t: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2026',
    src: 'Critical Care Medicine / Intensive Care Medicine', yr: 2026, sec: '2026 版（取代 2021 版）',
    url: 'https://doi.org/10.1007/s00134-026-08361-1',
    strength: '國際指引（含強建議與條件式建議）',
    key: '敗血性休克或已確立之敗血症，立即給予經驗性抗生素、理想上 1 小時內（強建議）。敗血症誘發之低灌流或休克，3 小時內至少 30 mL/kg 晶體液並強調個別化與頻繁再評估。一般成人初始 MAP 目標 65 mmHg；≥65 歲可設 60–65 mmHg（條件式建議，2026 新增）。',
    limit: '本條依期刊摘要與公開評論整理，未取得全文逐條核對。',
    verified: '2026-10-06'
  },
  ASCOIDSA_FN: {
    t: 'Outpatient Management of Fever and Neutropenia in Adults Treated for Malignancy: ASCO / IDSA Clinical Practice Guideline Update',
    src: 'Journal of Clinical Oncology / Journal of Oncology Practice', yr: 2018,
    sec: 'Guideline Update Summary',
    url: 'https://ascopubs.org/doi/10.1200/JOP.18.00016',
    strength: '學會聯合臨床指引',
    key: '發熱性嗜中性白血球低下病人應於檢傷後 1 小時內給予首劑經驗性抗生素；擬門診處置者，出院前須觀察至少 4 小時。',
    limit: '以門診處置之風險分層為主軸，急診端之適用需併同院內流程判斷。',
    verified: '2026-10-06'
  },
  AGIHO2024: {
    t: '2024 update of the AGIHO guideline on diagnosis and empirical treatment of fever of unknown origin (FUO) in adult neutropenic patients with solid tumours and hematological malignancies',
    src: 'Annals of Hematology（AGIHO／DGHO）', yr: 2024, sec: '2024 update',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11836497',
    strength: '學會指引更新',
    key: '急診情境下，CISNE 分數在辨識低風險病人上較 MASCC 分數更適用。診斷流程不得延遲經驗性抗生素之給予。退燒且臨床恢復後 3–5 天即可停用經驗性抗生素，不以嗜中性白血球數為準。',
    limit: '歐洲血液腫瘤學會體系之指引，用藥選擇需依本院抗生素政策與在地抗藥性調整。',
    verified: '2026-10-06'
  },

  // ---------- 腹痛 ----------
  GERIABD: {
    t: 'Abdominal emergencies in the geriatric patient',
    src: 'International Journal of Emergency Medicine（回顧）', yr: 2014,
    sec: 'Review',
    url: 'https://www.mcgill.ca/familymed/files/familymed/abdominal_emergencies_in_the_geriatric_patient.pdf',
    strength: '敘述性回顧',
    key: '老年人腹痛表現常不典型，發燒、白血球上升與腹膜徵象可付之闕如。腸繫膜缺血、腹主動脈瘤與闌尾炎為老年腹痛致死之主要病因。',
    limit: '2014 年回顧，流行病學數據可能已有變動；臨床推理原則仍適用。',
    verified: '2026-10-06'
  },
  AMI_ED: {
    t: 'Diagnosis and Management of Acute Mesenteric Ischemia in the Emergency Department',
    src: 'EB Medicine（Emergency Medicine Practice）', yr: 2023, sec: 'Abdominal topic review',
    url: 'https://www.ebmedicine.net/topics/abdominal/emergency-medicine-mesenteric-ischemia',
    strength: '實證回顧（同儕審閱之臨床綜論）',
    key: '急性腸繫膜缺血之標誌為疼痛程度遠超過理學檢查發現；症狀多變且不易察覺，延遲診斷之死亡率可接近 80%，存活高度仰賴急診端之及時診斷。',
    limit: '商業出版之綜論，非學會指引；院內導入前宜併同外科與放射科共識。',
    verified: '2026-10-06'
  },
  AAA_MASQ: {
    t: 'Ruptured Abdominal Aortic Aneurysm Masquerading as Acute Appendicitis',
    src: 'PMC（病例報告）', yr: 2025, sec: 'PMC12661095',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12661095/',
    strength: '病例報告（證據等級低，僅作為警示用）',
    key: '腹主動脈瘤破裂可以非特異或誤導性症狀表現，曾被誤診為闌尾炎、憩室炎、腎絞痛或臟器穿孔。對老年新發之腎絞痛、肌肉骨骼背痛甚至暈厥，應先排除腹主動脈瘤破裂。',
    limit: '單一病例報告，不可作為盛行率或診斷效能之依據，僅用於提示誤診型態。',
    verified: '2026-10-06'
  },

  // ---------- 刻意未查證：用以展示封鎖機制 ----------
  LOCAL_FLOW: {
    t: '本院急診腹痛影像檢查流程與放射科會診時效',
    src: '院內流程（待建立）', yr: null, sec: '—', url: null,
    strength: '院內共識',
    key: '（內容待與放射科、外科共同訂定後填入）',
    limit: '尚未建立。',
    verified: null
  },
  TRIAGE_LOCAL: {
    t: '本院檢傷分級與頭暈病人之優先順序規範',
    src: '院內流程（待建立）', yr: null, sec: '—', url: null,
    strength: '院內共識',
    key: '（內容待與檢傷護理團隊共同訂定後填入）',
    limit: '尚未建立。',
    verified: null
  }
};

/* =====================================================================
   事實欄位：三態（是 / 否 / 未知）。未知是正當狀態，不以「否」代替。
   ===================================================================== */

const COMPLAINTS = {

  // ===================================================================
  // 頭暈（完整深度模組）
  // ===================================================================
  dizzy: {
    name: '頭暈',
    icon: '◎',
    tagline: '以「發作型態與誘發因素」而非「頭暈的描述詞」分流',
    primer: '病人說「天旋地轉」或「頭昏昏」對鑑別幾乎沒有幫助，描述詞的再現性很差。'
          + '真正能分流的是：症狀是持續還是陣發？有沒有誘發因素？現在還在發作嗎？',
    groups: [
      { g: '基本資料', fields: [
        { id: 'age', label: '年齡', type: 'num', unit: '歲' },
        { id: 'sex', label: '生理性別', type: 'choice', opts: ['男', '女'] },
        { id: 'preg', label: '可能懷孕', type: 'tri', showIf: f => f.sex === '女' && (f.age === null || (f.age >= 12 && f.age <= 55)) }
      ]},
      { g: '生命徵象', fields: [
        { id: 'sbp', label: '收縮壓', type: 'num', unit: 'mmHg' },
        { id: 'hr', label: '心跳', type: 'num', unit: '/min' },
        { id: 'temp', label: '體溫', type: 'num', unit: '°C', step: 0.1 },
        { id: 'spo2', label: 'SpO₂', type: 'num', unit: '%' },
        { id: 'vt', label: '量測時間', type: 'text', ph: '例如 03:20' }
      ]},
      { g: '發作型態（決定後續路徑）', fields: [
        { id: 'onset_h', label: '症狀開始至今', type: 'num', unit: '小時' },
        { id: 'pattern', label: '型態', type: 'choice',
          opts: ['持續性（現在仍在）', '陣發性、有誘發', '陣發性、自發', '已完全緩解'] },
        { id: 'nystagmus', label: '有自發性眼振', type: 'tri',
          hint: 'HINTS 判讀以眼振存在為前提，無眼振者不適用' },
        { id: 'posit', label: '頭位改變誘發', type: 'tri' },
        { id: 'gait', label: '無法獨立行走', type: 'tri' }
      ]},
      { g: '伴隨症狀', fields: [
        { id: 'focal', label: '局部神經學異常（複視、構音、吞嚥、肢體無力或麻木）', type: 'tri' },
        { id: 'hanke', label: '新發頭痛或頸部疼痛', type: 'tri' },
        { id: 'hearing', label: '聽力變化或耳鳴', type: 'tri' },
        { id: 'palpit', label: '心悸或暈厥前兆', type: 'tri' },
        { id: 'melena', label: '黑便、血便或明顯出血', type: 'tri' }
      ]},
      { g: '病史與用藥', fields: [
        { id: 'cvrf', label: '心血管危險因子（高血壓、糖尿病、高血脂、抽菸）', type: 'tri' },
        { id: 'af', label: '心房顫動', type: 'tri' },
        { id: 'neck', label: '近期頸部外傷、推拿或整脊', type: 'tri' },
        { id: 'ototox', label: '使用可能致頭暈之藥物（降壓、鎮靜、抗癲癇、胺基醣苷類）', type: 'tri' }
      ]},
      { g: 'HINTS（限急性前庭症候群且有自發性眼振時執行）', gate: f =>
          f.pattern === '持續性（現在仍在）' && f.nystagmus === true, fields: [
        { id: 'hi', label: '頭部甩動試驗', type: 'choice',
          opts: ['有矯正性掃視（周邊型）', '無矯正性掃視（中樞警訊）'] },
        { id: 'ny', label: '眼振方向', type: 'choice',
          opts: ['單一方向、符合 Alexander 定律（周邊型）', '凝視時方向改變（中樞警訊）'] },
        { id: 'ts', label: '垂直眼位偏斜（交替遮眼試驗）', type: 'choice',
          opts: ['無偏斜（周邊型）', '有偏斜（中樞警訊）'] },
        { id: 'hear_new', label: 'HINTS Plus：新發單側聽力喪失', type: 'tri' }
      ]}
    ],
    redflags: [
      { if: f => f.focal === true, msg: '局部神經學異常：頭暈併局部神經學缺損，應以中樞病因優先處理', refs: ['HINTSCAVEAT'] },
      { if: f => f.gait === true, msg: '無法獨立行走：嚴重步態不穩在急性前庭症候群中偏向中樞病因', refs: ['HINTSCAVEAT'] },
      { if: f => f.hanke === true && (f.neck === true || (f.age !== null && f.age < 50)),
        msg: '新發頸部或枕部疼痛併頭暈：須考慮椎動脈剝離，尤其有近期頸部操作或年輕病人', refs: ['HINTSCAVEAT'] },
      { if: f => f.sbp !== null && f.sbp < 90, msg: '收縮壓 < 90 mmHg：先處理循環，頭暈的鑑別往後排', refs: ['SSC2026'] },
      { if: f => f.hi === '無矯正性掃視（中樞警訊）' || f.ny === '凝視時方向改變（中樞警訊）' || f.ts === '有偏斜（中樞警訊）',
        msg: 'HINTS 出現中樞警訊：任一項不符合周邊定位即不可排除中樞病因', refs: ['KATTAH2009', 'HINTSCAVEAT'] },
      { if: f => f.focal === true || f.gait === true,
        msg: '（本院檢傷優先順序規範尚未建立，本條依引用治理規則自動封鎖）', refs: ['TRIAGE_LOCAL'] }
    ],
    dx: [
      {
        id: 'pcs', name: '後循環中風 / 短暫性腦缺血', danger: true,
        why: '頭暈是後循環中風最常見的表現之一，且可以完全沒有肢體無力。漏診的代價是可逆轉的治療時間窗消失。',
        rules: [
          { f: 'focal', want: true, s: '有局部神經學異常' },
          { f: 'gait', want: true, s: '無法獨立行走' },
          { f: 'cvrf', want: true, s: '有心血管危險因子' },
          { f: 'af', want: true, s: '心房顫動' },
          { f: 'hi', want: '無矯正性掃視（中樞警訊）', s: 'HINTS：頭部甩動試驗無矯正性掃視' },
          { f: 'ny', want: '凝視時方向改變（中樞警訊）', s: 'HINTS：眼振方向改變' },
          { f: 'ts', want: '有偏斜（中樞警訊）', s: 'HINTS：垂直眼位偏斜' },
          { f: 'hear_new', want: true, s: 'HINTS Plus：新發單側聽力喪失' },
          { f: 'posit', want: false, s: '非頭位誘發' }
        ],
        against: [
          { f: 'pattern', want: '陣發性、有誘發', s: '陣發且有頭位誘發，較符合良性陣發性姿勢性眩暈' }
        ],
        ask: [
          { q: '症狀是持續還是陣發？現在還在發作嗎？', why: '持續性才構成急性前庭症候群，HINTS 才有適用前提', refs: ['HINTSCAVEAT'] },
          { q: '有沒有自發性眼振？', why: '無眼振者 HINTS 不適用，判讀無效', refs: ['HINTSCAVEAT'] },
          { q: '能不能自己走？', why: '嚴重步態不穩偏向中樞', refs: ['HINTSCAVEAT'] },
          { q: '有無新發頭痛或頸痛？近期頸部推拿或外傷？', why: '指向椎動脈剝離', refs: ['HINTSCAVEAT'] }
        ],
        tests: [
          { t: 'HINTS 三步驟床邊眼動檢查', purpose: '在急性前庭症候群中區分中樞與周邊',
            note: '敏感度 100%、特異度 96%（專家執行）；統合分析之合併敏感度 0.96、特異度 0.88。優於發病 24–48 小時內之 MRI-DWI。',
            caveat: '僅適用於持續性眩暈且有自發性眼振者。任一項不符周邊即不可排除中樞。',
            refs: ['KATTAH2009', 'PLOS2022HINTS', 'AEM2024HINTS', 'HINTSCAVEAT'], yield: 'high' },
          { t: '腦部電腦斷層', purpose: '排除出血',
            note: '對後循環缺血性中風敏感度低，陰性結果不能用來排除。',
            caveat: '若目的是排除後循環中風，這是低產出檢查；臨床決策不應因 CT 正常而放鬆。',
            refs: ['KATTAH2009'], yield: 'low' },
          { t: 'MRI 含 DWI', purpose: '確認後循環梗塞',
            note: '發病 24–48 小時內可能偽陰性，床邊 HINTS 於此時間窗內敏感度更高。',
            refs: ['KATTAH2009'], yield: 'mid' },
          { t: '12 導程心電圖', purpose: '評估心律不整與心房顫動', refs: ['KATTAH2009'], yield: 'mid' }
        ],
        reassess: '若 HINTS 三項全部符合周邊型且無其他神經學異常，中樞病因的可能性大幅下降；'
                + '但只要任一項不符周邊，或病人無法獨立行走，即應依中樞病因處置，不因 CT 正常而改變。'
      },
      {
        id: 'vad', name: '椎動脈剝離', danger: true,
        why: '年輕病人頭暈併頸部或枕部疼痛的主要致命原因，常有近期頸部操作史，容易被當成肌肉緊繃。',
        rules: [
          { f: 'hanke', want: true, s: '新發頭痛或頸部疼痛' },
          { f: 'neck', want: true, s: '近期頸部外傷、推拿或整脊' },
          { f: 'focal', want: true, s: '有局部神經學異常' }
        ],
        against: [],
        ask: [
          { q: '疼痛的位置與性質？是否為此生最劇烈？', why: '剝離之疼痛常為新發且性質與過去不同', refs: ['HINTSCAVEAT'] },
          { q: '近期有無整脊、推拿、劇烈轉頭或頸部外傷？', why: '典型誘因', refs: ['HINTSCAVEAT'] }
        ],
        tests: [
          { t: 'CT 血管攝影（頭頸部）', purpose: '確認椎動脈剝離', refs: ['HINTSCAVEAT'], yield: 'high' }
        ],
        reassess: '疼痛合併任何後循環症狀即應影像評估，不以年齡輕為由排除。'
      },
      {
        id: 'vn', name: '前庭神經炎', danger: false,
        why: '急性前庭症候群中最常見的周邊病因，但只有在 HINTS 三項全部符合周邊型、且無其他神經學異常時才能作此診斷。',
        rules: [
          { f: 'pattern', want: '持續性（現在仍在）', s: '持續性眩暈' },
          { f: 'nystagmus', want: true, s: '有自發性眼振' },
          { f: 'hi', want: '有矯正性掃視（周邊型）', s: 'HINTS：頭部甩動有矯正性掃視' },
          { f: 'ny', want: '單一方向、符合 Alexander 定律（周邊型）', s: 'HINTS：眼振單一方向' },
          { f: 'ts', want: '無偏斜（周邊型）', s: 'HINTS：無垂直眼位偏斜' },
          { f: 'focal', want: false, s: '無局部神經學異常' },
          { f: 'gait', want: false, s: '可獨立行走' }
        ],
        // HINTS 的判讀原則是「任一項不符合周邊定位即不可排除中樞」，
        // 因此三項中的任何一項中樞警訊都必須單獨列為不符合，不可只檢查其中一項。
        against: [
          { f: 'focal', want: true, s: '有局部神經學異常，不符周邊病因' },
          { f: 'gait', want: true, s: '無法獨立行走，嚴重步態不穩偏向中樞病因' },
          { f: 'hi', want: '無矯正性掃視（中樞警訊）', s: 'HINTS：頭部甩動試驗無矯正性掃視，為中樞警訊' },
          { f: 'ny', want: '凝視時方向改變（中樞警訊）', s: 'HINTS：眼振凝視時方向改變，為中樞警訊' },
          { f: 'ts', want: '有偏斜（中樞警訊）', s: 'HINTS：垂直眼位偏斜，為中樞警訊' },
          { f: 'hear_new', want: true, s: 'HINTS Plus：新發單側聽力喪失，須提高中樞警覺' }
        ],
        ask: [
          { q: '有無聽力變化？', why: '併單側聽力喪失時須提高中樞警覺（HINTS Plus）', refs: ['AEM2024HINTS'] }
        ],
        tests: [
          { t: 'HINTS 三步驟床邊眼動檢查', purpose: '確認三項均符合周邊定位',
            caveat: '三項必須全部符合周邊型才支持本診斷。',
            refs: ['KATTAH2009', 'HINTSCAVEAT'], yield: 'high' }
        ],
        reassess: '診斷成立後仍應確認病人可獨立行走再考慮離院；無法行走者不論 HINTS 結果為何都應留觀。'
      },
      {
        id: 'bppv', name: '良性陣發性姿勢性眩暈', danger: false,
        why: '陣發、短暫、由頭位改變誘發，是門急診最常見的眩暈原因。',
        rules: [
          { f: 'pattern', want: '陣發性、有誘發', s: '陣發性且有誘發因素' },
          { f: 'posit', want: true, s: '頭位改變誘發' },
          { f: 'focal', want: false, s: '無局部神經學異常' }
        ],
        against: [
          { f: 'pattern', want: '持續性（現在仍在）', s: '持續性症狀不符合本診斷' },
          { f: 'focal', want: true, s: '有局部神經學異常' }
        ],
        ask: [
          { q: '每次發作持續幾秒到幾分鐘？', why: '本診斷之發作多短於一分鐘', refs: ['HINTSCAVEAT'] }
        ],
        tests: [
          { t: 'Dix-Hallpike 試驗', purpose: '誘發並確認後半規管型', refs: ['HINTSCAVEAT'], yield: 'high' }
        ],
        reassess: '若誘發試驗陰性但症狀持續，應重新考慮是否為急性前庭症候群並評估 HINTS 適用性。'
      },
      {
        id: 'cardio', name: '心律不整 / 姿勢性低血壓 / 出血', danger: true,
        why: '病人描述的「頭暈」若實為暈厥前兆，鑑別應走循環而非前庭路徑；消化道出血可以頭暈為唯一表現。',
        rules: [
          { f: 'palpit', want: true, s: '心悸或暈厥前兆' },
          { f: 'melena', want: true, s: '黑便、血便或明顯出血' },
          { f: 'af', want: true, s: '心房顫動' }
        ],
        against: [
          { f: 'posit', want: true, s: '明確由頭位誘發，較符合前庭病因' }
        ],
        ask: [
          { q: '是天旋地轉，還是快要暈倒、眼前發黑？', why: '區分眩暈與暈厥前兆，決定走前庭或循環路徑', refs: ['HINTSCAVEAT'] },
          { q: '有無黑便、血便或近期出血？', why: '貧血可以頭暈為唯一表現', refs: ['GERIABD'] }
        ],
        tests: [
          { t: '12 導程心電圖', purpose: '心律不整與傳導異常', refs: ['KATTAH2009'], yield: 'high' },
          { t: '血色素', purpose: '評估貧血', refs: ['GERIABD'], yield: 'high' },
          { t: '臥立姿血壓', purpose: '姿勢性低血壓', refs: ['GERIABD'], yield: 'mid' }
        ],
        reassess: '若確認為暈厥前兆，應轉入暈厥之風險分層路徑，不再以前庭疾病處理。'
      },
      {
        id: 'drug', name: '藥物或代謝性原因', danger: false,
        why: '多重用藥的高齡病人常見，但屬排除性診斷。',
        rules: [
          { f: 'ototox', want: true, s: '使用可能致頭暈之藥物' }
        ],
        against: [],
        ask: [{ q: '近期有無新增或調整藥物？', why: '時序關係是主要線索', refs: ['GERIABD'] }],
        tests: [{ t: '血糖、電解質', purpose: '排除代謝性原因', refs: ['GERIABD'], yield: 'mid' }],
        reassess: '停藥或調整後症狀未改善者，應重新評估其他病因。'
      }
    ]
  },

  // ===================================================================
  // 腹痛（危險診斷完整，治療細節較淺）
  // ===================================================================
  abdo: {
    name: '腹痛',
    icon: '◍',
    tagline: '年齡與懷孕可能性會整個改寫鑑別順序',
    primer: '老年人的腹痛可以沒有發燒、沒有白血球上升、沒有腹膜徵象。'
          + '以年輕人的標準去評估高齡腹痛，是這個主訴最常見的失誤來源。',
    groups: [
      { g: '基本資料', fields: [
        { id: 'age', label: '年齡', type: 'num', unit: '歲' },
        { id: 'sex', label: '生理性別', type: 'choice', opts: ['男', '女'] },
        { id: 'preg', label: '可能懷孕', type: 'tri',
          showIf: f => f.sex === '女' && (f.age === null || (f.age >= 12 && f.age <= 55)),
          hint: '育齡女性腹痛，未驗 hCG 前不可排除異位妊娠' }
      ]},
      { g: '生命徵象', fields: [
        { id: 'sbp', label: '收縮壓', type: 'num', unit: 'mmHg' },
        { id: 'hr', label: '心跳', type: 'num', unit: '/min' },
        { id: 'temp', label: '體溫', type: 'num', unit: '°C', step: 0.1 },
        { id: 'vt', label: '量測時間', type: 'text', ph: '例如 03:20' }
      ]},
      { g: '疼痛特性', fields: [
        { id: 'onset_h', label: '症狀開始至今', type: 'num', unit: '小時' },
        { id: 'sudden', label: '突然發作（可明確指出發作的那一刻）', type: 'tri' },
        { id: 'site', label: '主要位置', type: 'choice',
          opts: ['上腹', '右上腹', '右下腹', '左下腹', '臍周', '腰背', '全腹'] },
        { id: 'oop', label: '疼痛程度遠超過理學檢查發現', type: 'tri',
          hint: '急性腸繫膜缺血的標誌性表現' },
        { id: 'perit', label: '腹膜徵象（反彈痛、肌衛）', type: 'tri' }
      ]},
      { g: '病史', fields: [
        { id: 'af', label: '心房顫動或近期栓塞事件', type: 'tri' },
        { id: 'vasc', label: '已知血管疾病或動脈瘤', type: 'tri' },
        { id: 'surg', label: '腹部手術史', type: 'tri' },
        { id: 'immuno', label: '免疫抑制（化療、類固醇、移植）', type: 'tri' },
        { id: 'nsaid', label: '使用 NSAID 或抗凝血劑', type: 'tri' }
      ]}
    ],
    redflags: [
      { if: f => f.sbp !== null && f.sbp < 90, msg: '收縮壓 < 90 mmHg 併腹痛：血管性災難與穿孔應優先排除', refs: ['GERIABD'] },
      { if: f => f.preg === null && f.sex === '女', msg: '育齡女性之懷孕可能性仍為未知：未驗 hCG 前不可排除異位妊娠', refs: ['GERIABD'] },
      { if: f => f.oop === true, msg: '疼痛程度遠超理學檢查：急性腸繫膜缺血之標誌性表現，延遲診斷死亡率可達 80%', refs: ['AMI_ED'] },
      { if: f => f.age !== null && f.age >= 60 && f.sudden === true,
        msg: '≥60 歲突發腹痛或腰背痛：在排除腹主動脈瘤破裂之前，不應診斷為腎絞痛或肌肉骨骼疼痛', refs: ['AAA_MASQ', 'GERIABD'] },
      { if: f => f.age !== null && f.age >= 65 && f.temp !== null && f.temp < 37.5,
        msg: '高齡病人可無發燒仍有嚴重腹腔感染：體溫正常不足以降低警覺', refs: ['GERIABD'] }
    ],
    dx: [
      {
        id: 'raaa', name: '腹主動脈瘤破裂', danger: true,
        why: '可偽裝成腎絞痛、憩室炎、闌尾炎甚至單純暈厥。對高齡新發腰背痛，這是必須主動排除而非等待浮現的診斷。',
        rules: [
          { f: 'sudden', want: true, s: '突然發作' },
          { f: 'site', want: '腰背', s: '腰背部疼痛' },
          { f: 'vasc', want: true, s: '已知血管疾病或動脈瘤' }
        ],
        against: [],
        ask: [
          { q: '是否為此生最劇烈、且可指出發作的那一秒？', why: '血管性災難多為瞬間達到最痛', refs: ['AAA_MASQ'] },
          { q: '過去有無診斷過腹主動脈瘤？有無抽菸史？', why: '主要危險因子', refs: ['AAA_MASQ'] }
        ],
        tests: [
          { t: '床邊超音波（主動脈)', purpose: '快速測量主動脈直徑',
            note: '可於床邊數分鐘內完成，不需移動不穩定病人。', refs: ['AAA_MASQ'], yield: 'high' },
          { t: '電腦斷層（含顯影）', purpose: '確認破裂與解剖',
            caveat: '血流動力不穩者不應為了做電腦斷層而延誤手術會診。', refs: ['AAA_MASQ'], yield: 'high' },
          { t: '本院影像排程與放射科會診時效', purpose: '估算可行的檢查時間',
            note: '（院內流程尚未建立，本條依引用治理規則自動封鎖）',
            refs: ['LOCAL_FLOW'], yield: 'mid' }
        ],
        reassess: '床邊超音波未見動脈瘤可大幅降低可能性；但影像品質受腸氣影響，高度懷疑時仍應進一步評估。'
      },
      {
        id: 'ami', name: '急性腸繫膜缺血', danger: true,
        why: '症狀多變且早期理學檢查可以完全正常，延遲診斷之死亡率接近 80%。存活高度仰賴急診端的及時懷疑。',
        rules: [
          { f: 'oop', want: true, s: '疼痛程度遠超過理學檢查發現' },
          { f: 'af', want: true, s: '心房顫動或近期栓塞事件' },
          { f: 'vasc', want: true, s: '已知血管疾病' },
          { f: 'sudden', want: true, s: '突然發作' }
        ],
        against: [],
        ask: [
          { q: '有無心房顫動、近期心肌梗塞或血管手術？', why: '栓塞來源', refs: ['AMI_ED'] },
          { q: '進食後是否加劇？近期有無體重下降？', why: '慢性腸繫膜缺血之急性惡化', refs: ['AMI_ED'] }
        ],
        tests: [
          { t: 'CT 血管攝影', purpose: '確認腸繫膜血管阻塞',
            note: '為診斷首選影像。', refs: ['AMI_ED'], yield: 'high' },
          { t: '乳酸', purpose: '評估組織灌流',
            caveat: '乳酸正常不能排除早期腸繫膜缺血，為晚期指標。', refs: ['AMI_ED'], yield: 'low' }
        ],
        reassess: '乳酸與白血球正常不足以排除本診斷；懷疑度高時應直接安排血管攝影並照會外科。'
      },
      {
        id: 'ectopic', name: '異位妊娠', danger: true,
        why: '育齡女性腹痛的首要排除項目。病人否認性行為或自認無懷孕可能，都不足以取代檢驗。',
        rules: [
          { f: 'preg', want: true, s: '懷孕可能性存在' },
          { f: 'site', want: '右下腹', s: '下腹痛' }
        ],
        against: [
          { f: 'sex', want: '男', s: '生理性別男' }
        ],
        ask: [
          { q: '最後一次月經？是否規則？', why: '建立懷孕可能性', refs: ['GERIABD'] }
        ],
        tests: [
          { t: '尿液或血清 hCG', purpose: '確立或排除懷孕',
            note: '育齡女性腹痛之必要檢驗。', refs: ['GERIABD'], yield: 'high' },
          { t: '骨盆超音波', purpose: 'hCG 陽性時評估著床位置', refs: ['GERIABD'], yield: 'high' }
        ],
        reassess: 'hCG 陰性方可將本診斷移出考慮；陽性且未見子宮內妊娠者應視為異位妊娠直至證實為否。'
      },
      {
        id: 'perf', name: '消化道穿孔', danger: true,
        why: '高齡與使用類固醇者可以沒有明顯腹膜徵象。',
        rules: [
          { f: 'sudden', want: true, s: '突然發作' },
          { f: 'perit', want: true, s: '腹膜徵象' },
          { f: 'nsaid', want: true, s: '使用 NSAID 或抗凝血劑' }
        ],
        against: [],
        ask: [{ q: '有無消化性潰瘍病史或長期服用止痛藥？', why: '主要危險因子', refs: ['GERIABD'] }],
        tests: [
          { t: '立位胸部 X 光或電腦斷層', purpose: '偵測腹腔游離氣體',
            caveat: 'X 光敏感度有限，陰性不能排除，電腦斷層較可靠。', refs: ['GERIABD'], yield: 'mid' }
        ],
        reassess: '高齡或免疫抑制者缺乏腹膜徵象不代表沒有穿孔。'
      },
      {
        id: 'appe', name: '急性闌尾炎', danger: false,
        why: '常見，但在高齡與孕婦的表現常不典型，且穿孔率較高。',
        rules: [
          { f: 'site', want: '右下腹', s: '右下腹痛' },
          { f: 'perit', want: true, s: '腹膜徵象' }
        ],
        against: [],
        ask: [{ q: '疼痛是否由臍周轉移至右下腹？', why: '典型轉移型態', refs: ['GERIABD'] }],
        tests: [
          { t: '超音波或電腦斷層', purpose: '確認闌尾發炎',
            caveat: '孕婦與兒童應優先考慮超音波。', refs: ['GERIABD'], yield: 'high' }
        ],
        reassess: '高齡病人診斷延遲與穿孔率顯著較高，應降低影像門檻。'
      },
      {
        id: 'biliary', name: '膽道感染 / 急性膽管炎', danger: true,
        why: '可快速進展為敗血性休克，需要的是引流而非只有抗生素。',
        rules: [
          { f: 'site', want: '右上腹', s: '右上腹痛' },
          { f: 'temp', gte: 38, s: '發燒' }
        ],
        against: [],
        ask: [{ q: '有無黃疸或茶色尿？', why: '膽管炎之三聯徵之一', refs: ['SSC2026'] }],
        tests: [
          { t: '肝膽功能與超音波', purpose: '評估膽道阻塞', refs: ['SSC2026'], yield: 'high' }
        ],
        reassess: '合併低血壓或意識改變者，依敗血性休克路徑同步處置並緊急照會以安排引流。'
      },
      {
        id: 'mi', name: '下壁心肌梗塞（以上腹痛表現）', danger: true,
        why: '上腹痛可以是心肌梗塞的唯一表現，尤其糖尿病與高齡病人。不做心電圖就不會發現。',
        rules: [
          { f: 'site', want: '上腹', s: '上腹痛' },
          { f: 'age', gte: 50, s: '年齡 ≥ 50' }
        ],
        against: [],
        ask: [{ q: '有無冒冷汗、呼吸困難或轉移至下顎、手臂？', why: '心因性症狀', refs: ['GERIABD'] }],
        tests: [
          { t: '12 導程心電圖', purpose: '偵測 ST 段變化',
            note: '上腹痛病人之低成本高產出檢查。', refs: ['GERIABD'], yield: 'high' }
        ],
        reassess: '初次心電圖正常不能排除，症狀持續者應重複施行。'
      }
    ]
  },

  // ===================================================================
  // 發燒（危險診斷完整）
  // ===================================================================
  fever: {
    name: '發燒',
    icon: '◈',
    tagline: '宿主狀態比體溫數字更能決定風險',
    primer: '同樣 38.5°C，在健康成人與化療後第十天的病人身上是兩件完全不同的事。'
          + '第一個該問的不是「燒多高」，而是「這個人的免疫狀態與感染源在哪裡」。',
    groups: [
      { g: '基本資料', fields: [
        { id: 'age', label: '年齡', type: 'num', unit: '歲' },
        { id: 'sex', label: '生理性別', type: 'choice', opts: ['男', '女'] },
        { id: 'preg', label: '可能懷孕', type: 'tri',
          showIf: f => f.sex === '女' && (f.age === null || (f.age >= 12 && f.age <= 55)) }
      ]},
      { g: '生命徵象', fields: [
        { id: 'temp', label: '體溫', type: 'num', unit: '°C', step: 0.1 },
        { id: 'sbp', label: '收縮壓', type: 'num', unit: 'mmHg' },
        { id: 'hr', label: '心跳', type: 'num', unit: '/min' },
        { id: 'rr', label: '呼吸速率', type: 'num', unit: '/min' },
        { id: 'spo2', label: 'SpO₂', type: 'num', unit: '%' },
        { id: 'gcs', label: '意識（GCS）', type: 'num' },
        { id: 'vt', label: '量測時間', type: 'text', ph: '例如 03:20' }
      ]},
      { g: '宿主狀態（最優先）', fields: [
        { id: 'chemo', label: '六週內接受過化學治療', type: 'tri',
          hint: '觸發發熱性嗜中性白血球低下路徑' },
        { id: 'immuno', label: '其他免疫抑制（類固醇、移植、生物製劑）', type: 'tri' },
        { id: 'asplenia', label: '無脾或脾功能低下', type: 'tri' },
        { id: 'device', label: '體內人工裝置（導管、人工瓣膜、關節）', type: 'tri' }
      ]},
      { g: '定位線索', fields: [
        { id: 'neuro', label: '意識改變、頸部僵硬或新發頭痛', type: 'tri' },
        { id: 'skinpain', label: '軟組織疼痛程度遠超過外觀', type: 'tri',
          hint: '壞死性軟組織感染的早期表現' },
        { id: 'resp', label: '咳嗽、呼吸困難', type: 'tri' },
        { id: 'urin', label: '排尿症狀或腰側疼痛', type: 'tri' },
        { id: 'abdo', label: '腹痛', type: 'tri' },
        { id: 'travel', label: '近三個月旅遊史', type: 'tri' }
      ]}
    ],
    redflags: [
      { if: f => f.chemo === true,
        msg: '六週內化療：依發熱性嗜中性白血球低下處理，檢傷後儘速評估，1 小時內給予首劑經驗性抗生素，診斷流程不得延誤給藥',
        refs: ['ASCOIDSA_FN', 'AGIHO2024'] },
      { if: f => f.sbp !== null && f.sbp < 90,
        msg: '收縮壓 < 90 mmHg：依敗血性休克處置，立即給予抗生素、理想上 1 小時內，並開始輸液復甦',
        refs: ['SSC2026'] },
      { if: f => f.skinpain === true,
        msg: '軟組織疼痛遠超外觀：壞死性軟組織感染須緊急外科評估，抗生素無法取代清創',
        refs: ['SSC2026'] },
      { if: f => f.neuro === true,
        msg: '發燒併意識改變或頸部僵硬：腦膜炎須緊急處理，抗生素不應等待腰椎穿刺或影像',
        refs: ['SSC2026'] },
      { if: f => f.asplenia === true,
        msg: '無脾病人發燒：可於數小時內進展為猛爆性敗血症，門檻應大幅下修',
        refs: ['SSC2026'] }
    ],
    dx: [
      {
        id: 'fn', name: '發熱性嗜中性白血球低下', danger: true,
        why: '時間敏感度最高的發燒情境。治療的啟動不應等待血球報告。',
        rules: [
          { f: 'chemo', want: true, s: '六週內接受過化學治療' },
          { f: 'temp', gte: 38, s: '發燒' },
          { f: 'device', want: true, s: '體內人工裝置（可能之感染源）' }
        ],
        against: [],
        ask: [
          { q: '最後一次化療是什麼時候？用的是什麼方案？', why: '決定白血球最低點的時間窗', refs: ['ASCOIDSA_FN'] },
          { q: '有無人工血管或中央靜脈導管？', why: '導管相關感染為主要來源', refs: ['AGIHO2024'] }
        ],
        tests: [
          { t: '全血球計數含分類', purpose: '確認嗜中性白血球數',
            caveat: '不應等待結果才給抗生素。', refs: ['AGIHO2024'], yield: 'high' },
          { t: '血液培養（含導管與周邊各一套）', purpose: '找出病原',
            caveat: '採檢不得延誤首劑抗生素。', refs: ['AGIHO2024'], yield: 'high' },
          { t: 'CISNE 風險分層', purpose: '辨識可門診處置之低風險病人',
            note: '急診情境下較 MASCC 分數更適用。', refs: ['AGIHO2024'], yield: 'high' }
        ],
        reassess: '退燒且臨床恢復後 3–5 天即可停用經驗性抗生素，不以嗜中性白血球數為停藥依據。'
      },
      {
        id: 'sepsis', name: '敗血症 / 敗血性休克', danger: true,
        why: '最常見也最不可漏。即使已找到其他診斷，灌流不足仍須同步處理。',
        rules: [
          { f: 'sbp', lte: 100, s: '收縮壓偏低' },
          { f: 'rr', gte: 22, s: '呼吸急促' },
          { f: 'gcs', lte: 14, s: '意識改變' },
          { f: 'temp', gte: 38, s: '發燒' }
        ],
        against: [],
        ask: [
          { q: '感染源最可能在哪裡？', why: '抗生素選擇與是否需要引流取決於來源', refs: ['SSC2026'] }
        ],
        tests: [
          { t: '血液培養 ×2', purpose: '病原鑑定',
            caveat: '應儘早採檢、理想上在抗生素之前，但不得因此延誤給藥。', refs: ['SSC2026'], yield: 'high' },
          { t: '乳酸', purpose: '評估組織灌流與治療反應', refs: ['SSC2026'], yield: 'high' }
        ],
        reassess: '初始輸液至少 30 mL/kg 於 3 小時內給完並個別化調整；'
                + '一般成人初始 MAP 目標 65 mmHg，≥65 歲可採 60–65 mmHg。'
      },
      {
        id: 'nstf', name: '壞死性軟組織感染', danger: true,
        why: '早期外觀可以近乎正常，唯一的線索常常是疼痛程度與外觀不成比例。抗生素不能取代清創。',
        rules: [
          { f: 'skinpain', want: true, s: '疼痛程度遠超過外觀' },
          { f: 'sbp', lte: 100, s: '收縮壓偏低' }
        ],
        against: [],
        ask: [
          { q: '有無皮膚破損、糖尿病或近期外傷？', why: '入侵門戶', refs: ['SSC2026'] },
          { q: '疼痛是否快速擴展？', why: '進展速度為重要線索', refs: ['SSC2026'] }
        ],
        tests: [
          { t: '緊急外科會診', purpose: '決定是否探查與清創',
            note: '影像不應延誤外科評估。', refs: ['SSC2026'], yield: 'high' }
        ],
        reassess: '懷疑度高時，影像陰性不應作為延後手術探查的理由。'
      },
      {
        id: 'cns', name: '腦膜炎 / 腦炎', danger: true,
        why: '抗生素延遲與預後直接相關，不應等待影像或腰椎穿刺。',
        rules: [
          { f: 'neuro', want: true, s: '意識改變、頸部僵硬或新發頭痛' },
          { f: 'temp', gte: 38, s: '發燒' }
        ],
        against: [],
        ask: [{ q: '頭痛的發作方式與最劇烈程度？', why: '區分蛛網膜下腔出血', refs: ['SSC2026'] }],
        tests: [
          { t: '腰椎穿刺', purpose: '確立診斷',
            caveat: '不應為了等待腰椎穿刺或影像而延遲抗生素。', refs: ['SSC2026'], yield: 'high' }
        ],
        reassess: '抗生素先給，後續再依腦脊髓液結果調整。'
      },
      {
        id: 'travel', name: '旅遊相關感染（瘧疾、登革熱等）', danger: true,
        why: '瘧疾可在數日內致命，而診斷完全取決於有沒有問旅遊史。',
        rules: [
          { f: 'travel', want: true, s: '近三個月旅遊史' },
          { f: 'temp', gte: 38, s: '發燒' }
        ],
        against: [],
        ask: [
          { q: '去了哪裡、什麼時候回來、有無瘧疾預防用藥？', why: '決定是否送驗瘧疾', refs: ['SSC2026'] }
        ],
        tests: [
          { t: '瘧疾血液抹片或快速篩檢', purpose: '排除瘧疾',
            caveat: '單次陰性不能排除，需重複送驗。', refs: ['SSC2026'], yield: 'high' }
        ],
        reassess: '旅遊史未問，此診斷就不會出現在鑑別清單上——這是本項的主要風險。'
      },
      {
        id: 'common', name: '一般社區感染（呼吸道、泌尿道）', danger: false,
        why: '最常見，但必須是在危險診斷已被適當評估之後才下的結論。',
        rules: [
          { f: 'resp', want: true, s: '呼吸道症狀' },
          { f: 'urin', want: true, s: '泌尿道症狀' },
          { f: 'chemo', want: false, s: '非化療後' },
          { f: 'sbp', gte: 100, s: '血壓穩定' }
        ],
        against: [
          { f: 'chemo', want: true, s: '化療後病人不適用一般社區感染之處置門檻' }
        ],
        ask: [{ q: '症狀是否足以解釋發燒的程度？', why: '避免過早收斂', refs: ['SSC2026'] }],
        tests: [
          { t: '胸部 X 光、尿液常規', purpose: '確認感染源',
            caveat: '找到一個感染源不代表沒有第二個。', refs: ['SSC2026'], yield: 'mid' }
        ],
        reassess: '若治療反應不如預期，應回頭檢視是否有未被發現的危險診斷。'
      }
    ]
  }
};
