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
  // ---------- 頭暈：GRADE 指引 ----------
  GRACE3: {
    t: 'Guidelines for reasonable and appropriate care in the emergency department 3 (GRACE-3): Acute dizziness and vertigo in the emergency department',
    src: 'Academic Emergency Medicine（SAEM）', yr: 2023, sec: 'Edlow JA et al. 30(5):442–486',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37166022/',
    strength: 'GRADE 方法學臨床指引，15 條建議',
    key: '以「發作時序與誘發因素」而非症狀描述分流。'
       + '建議 2（強建議、高確定性）：受過訓練者對有眼振之急性前庭症候群使用 HINTS。'
       + '建議 3（條件式、中確定性）：以手指摩擦評估單側聽力喪失。'
       + '建議 4（條件式、中確定性）：無眼振之急性前庭症候群評估步態嚴重度。'
       + '建議 5（強烈反對、高確定性）：不以非顯影 CT 或 CTA 區分中樞與周邊。'
       + '建議 7（強建議、高確定性）：HINTS 指向中樞或結果不明確時，安排含 DWI 之中風 MRI 與 MRA。'
       + '建議 8（良好實務聲明）：自發陣發型需詳細病史與神經學檢查，著重腦神經、眼動、協調與步態。'
       + '建議 9（強烈反對、中確定性）：自發陣發型不常規做 CT。'
       + '建議 10（條件式、中確定性）：疑 TIA 時以 CTA 或 MRA 排除後循環血管病變。'
       + '建議 11（強建議、中確定性）：誘發陣發型常規做 Dix-Hallpike。'
       + '建議 12（強烈反對、中確定性）：誘發陣發型不常規做 CT 或 CTA。'
       + '建議 13（條件式反對、中確定性）：Dix-Hallpike 陽性且眼振典型時不常規做 MRI。'
       + '建議 14（條件式、極低確定性）：發病 3 天內之前庭神經炎可共同決策是否使用短期類固醇。'
       + '建議 15（強建議、中確定性）：Dix-Hallpike 陽性即施行 Epley 復位術。',
    limit: '建議 1 指出未受訓之急診醫師無法可靠執行與判讀 HINTS；本系統之 HINTS 路徑以執行者受過訓練為前提。'
         + '各建議之強度與確定性依 SGEM 之逐條摘要整理，未取得全文逐字核對。',
    verified: '2026-10-06'
  },
  LEE2025NYS: {
    t: 'Usefulness of Nystagmus Patterns in Distinguishing Peripheral From Central Acute Vestibular Syndromes at the Bedside: A Critical Review',
    src: 'Journal of Clinical Neurology', yr: 2025, sec: 'Lee SU, Tarnutzer AA. 21(3):161–172',
    url: 'https://doi.org/10.3988/jcn.2025.0105',
    strength: '批判性回顧（含既有統合分析數據）',
    key: '單純扭轉、扭轉合併垂直、或垂直型之自發性眼振，對中樞病因特異度 97.7%，但敏感度僅 19.1%。'
       + '急性前庭症候群病人若完全無自發性眼振，對中樞病因特異度 97.9%。'
       + '水平或水平合併扭轉型眼振較常見於周邊病因（94.8% 對 43.4%），但不能排除中樞。',
    limit: '眼振型態單獨使用之敏感度低，作者強調須併同 HINTS 等床邊檢查，不可單憑眼振型態下結論。',
    verified: '2026-10-06'
  },
  AAOHNS2017: {
    t: 'Clinical Practice Guideline: Benign Paroxysmal Positional Vertigo (Update)',
    src: 'Otolaryngology–Head and Neck Surgery（AAO-HNS）', yr: 2017, sec: 'Bhattacharyya N et al. 156(3 Suppl):S1–S47',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28248609/',
    strength: '學會臨床實務指引',
    key: 'Dix-Hallpike 誘發出伴隨眩暈之扭轉、上跳型眼振時，診斷為後半規管 BPPV。'
       + '不應常規以抗組織胺或苯二氮平類等前庭抑制劑治療 BPPV。'
       + '已診斷 BPPV 且無不符合之徵象者，不建議影像或前庭功能檢查。'
       + '症狀持續者應評估未緩解之 BPPV 或其他周邊、中樞疾病。'
       + 'BPPV 為成人最常見之前庭疾病，終生盛行率 2.4%；後半規管型占 85–95%。',
    limit: '對象為 BPPV；不適用於持續性眩暈之急性前庭症候群。',
    verified: '2026-10-06'
  },
  // ---------- 腹痛 ----------
  AFP2023ABD: {
    t: 'Acute Abdominal Pain in Adults: Evaluation and Diagnosis',
    src: 'American Family Physician', yr: 2023, sec: 'Yew KS, George MK, Allred HB. 107(6):585–596',
    url: 'https://www.aafp.org/afp/2023/0600/acute-abdominal-pain-adults',
    strength: '同儕審閱臨床綜論（含似然比表與診斷流程圖）',
    key: '應先快速辨識血流動力不穩、腹膜炎徵象、或疼痛程度與理學檢查不成比例者，這些病人常需緊急復甦或手術。'
       + '所有停經前女性之急性腹痛都應驗孕，即使使用可靠避孕方式；陽性時以骨盆超音波確認著床位置，'
       + '經陰道超音波未能確認子宮內或異位妊娠者，不能排除異位妊娠（位置不明之妊娠）。'
       + '高齡、免疫低下與肥胖病人之理學表現常較不明顯。'
       + '突發或劇烈腹痛之可能病因包括中空器官穿孔與主動脈瘤破裂。'
       + '腸繫膜缺血危險因子（動脈粥樣硬化、心房顫動、大於 70 歲、血管炎、高凝狀態）存在時應考慮 CT 血管攝影；'
       + '疑腸繫膜缺血或敗血症應測乳酸，但早期可能正常。'
       + '右上腹痛以超音波為首選；電腦斷層與超音波已取代常規腹部 X 光，X 光僅在資源受限且懷疑穿孔、腸阻塞或異物時有角色。'
       + '使用 NSAID 應提高對胃炎或消化性潰瘍之懷疑。上腹痛之鑑別包括心絞痛、心肌梗塞與心包膜炎。'
       + '疼痛由臍周轉移至右下腹，對闌尾炎之 LR+ 為 3.2；孕婦疑闌尾炎以超音波為首選，不確定時優先 MRI。'
       + '床邊超音波可用於評估主動脈瘤、膽囊炎、異位妊娠與闌尾炎。'
       + '常見診斷依序為腸胃炎 10.8%、非特異性腹痛 10.4%、膽結石 4.5%、泌尿道結石 4.3%、憩室炎 3.8%、闌尾炎 3.8%；約 10% 為泌尿道病因。'
       + '似然比：Murphy sign LR+ 15.6；右下腹痛 LR+ 7.3–8.5；腹脹 LR+ 5.8；腹部手術史 LR+ 3.9；發燒對闌尾炎 LR+ 1.9；憩室炎臨床印象 LR+ 32。'
       + '靜止不動提示腹膜炎，扭動不安提示膽絞痛或腎絞痛；腸音消失為警訊但診斷角色有限。'
       + '在合適情境下 lipase 高於正常上限三倍提示胰臟炎。結石專用電腦斷層可保留給 >50 歲無結石史、>75 歲、疼痛難控、腹部壓痛或發燒者。'
       + '非局部化之急性腹痛通常需做含顯影之腹骨盆電腦斷層。免疫正常且無危險因子者，憩室炎可臨床診斷。'
       + '腹部手術、放射治療、克隆氏症或惡性腫瘤病史應提高對小腸阻塞之懷疑。',
    limit: '美國家庭醫學會之綜論文章，非 GRADE 指引；對象為未懷孕成人之診斷評估，不涵蓋治療。',
    verified: '2026-10-06'
  },

  NICE_NG126: {
    t: 'Ectopic pregnancy and miscarriage: diagnosis and initial management (NG126)',
    src: 'NICE guideline', yr: 2019, sec: '2026-06-17 更新；第 1.4 節 Symptoms and signs and initial assessment',
    url: 'https://www.nice.org.uk/guidance/ng126/chapter/symptoms-and-signs-of-ectopic-pregnancy-and-initial-assessment',
    strength: 'NICE 正式指引',
    key: '1.4.1 血流動力不穩或疼痛、出血程度令人擔憂者直接送急診。'
       + '1.4.2 異位妊娠非典型表現很常見。'
       + '1.4.3 常見症狀為腹部或骨盆痛、無月經、陰道出血；其他包括腸胃症狀、頭暈或暈厥、肩尖痛、泌尿道症狀、排便疼痛。'
       + '1.4.5 評估育齡女性時應意識到可能懷孕，即使症狀不典型也考慮驗孕；異位妊娠之表現可類似腸胃或泌尿道感染。'
       + '1.4.8 即使沒有危險因子也應排除異位妊娠，約三分之一病人沒有已知危險因子。',
    limit: '英國照護體系之轉介流程（早期妊娠評估單位）需對應本院婦產科會診流程。',
    verified: '2026-10-06'
  },
  WSES_AMI2022: {
    t: 'Acute mesenteric ischemia: updated guidelines of the World Society of Emergency Surgery',
    src: 'World Journal of Emergency Surgery', yr: 2022, sec: 'Bala M, Catena F, Kashuk J, et al. 17:54',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9580452/',
    strength: 'GRADE 分級之國際外科指引',
    key: '劇烈腹痛與理學檢查不成比例者，應假設為急性腸繫膜缺血直到排除（強建議，1C）。'
       + '無單一生物標記可確診，乳酸、白血球與 D-dimer 可輔助（弱建議，2B）。'
       + '疑似者應立即施行 CT 血管攝影，不得延遲（強建議，1A）；診斷每延遲 6 小時，死亡率加倍。'
       + '動脈阻塞且具備專業時，以血管內再灌流為首選（強建議，1C）。',
    limit: '外科學會指引；再灌流方式取決於院內血管介入能力。',
    verified: '2026-10-06'
  },
  ACS2025: {
    t: '2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes',
    src: 'J Am Coll Cardiol / Circulation', yr: 2025, sec: 'Rao SV et al.；PMID 40013746',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40013746/',
    strength: 'ACC/AHA 正式指引',
    key: '疑似急性冠心症者，應於首次醫療接觸 10 分鐘內取得並判讀 12 導程心電圖，以辨識 STEMI（Class 1，LOE B-NR）。',
    limit: '本系統僅引用初始心電圖時效；後續 troponin 策略與治療請查閱全文。',
    verified: '2026-10-06'
  },

  // ---------- 發燒（國內） ----------
  TSEM2018FEVER: {
    t: '急診成人感染病人之鑑別思路',
    src: '台灣急診醫學通訊（台灣急診醫學會）', yr: 2018, sec: '陳世英（台大醫院急診醫學部）。1(6):e2018010608',
    url: 'https://www.sem.org.tw/EJournal/Detail/88',
    strength: '學會刊物專家綜論（非 GRADE 指引）',
    key: '生命徵象不穩定或有嚴重敗血症跡象者，第一時間急救、採檢並給予經驗性抗微生物藥物。'
       + '嚴重感染及免疫功能低下病人可能沒有發燒，甚至以低體溫表現。'
       + '病史應涵蓋共病、醫療相關暴露（化療、透析等）、藥物史（類固醇、免疫抑制劑、化療藥物）與 TOCC 接觸史（旅遊、職業、接觸、群聚）。'
       + '腦膜炎之表現包括發燒、頭痛、噴射狀嘔吐、懼光、頸部痠痛與意識變化；理學檢查可見頸部僵硬、搖頭加劇頭痛、Kernig 與 Brudzinski 徵象。'
       + '壞死性筋膜炎之警訊為皮膚病灶擴散迅速、不成比例的劇痛、出血性水泡、心搏過速、尿量減少與意識變化。'
       + '診斷病毒感染前應確認：具典型上呼吸道或腸胃炎症狀、病程在可預期範圍、無定位性細菌感染徵象。'
       + '健康成人之發燒大多數由病毒引起，且多為自限性病程。'
       + '判斷為無併發症之病毒性感染者，可考慮出院於門診追蹤，但須告知如何自我觀察併發症徵象。',
    limit: '2018 年專家綜論。文中提及之「早期目標導向療法（EGDT）」已於 ProCESS、ARISE、ProMISe 試驗後不再建議，'
         + '本系統不引用該部分；敗血症之處置以 SSC 2026 為準。',
    verified: '2026-10-06'
  },



  // ---------- 動向與新主訴（2026-10-06 查證） ----------
  NICE_NG250: {
    t: 'Pneumonia: diagnosis and management (NG250)',
    src: 'NICE guideline', yr: 2025, sec: '2025-09-02 發布，取代 CG191；第 1.2.9 條',
    url: 'https://www.nice.org.uk/guidance/ng250/chapter/Recommendations',
    strength: 'NICE 正式指引',
    key: '在醫院診斷之社區型肺炎，以 CURB65 併同臨床判斷決定照護地點：'
       + '≥3 分考慮住院，必要時轉介重症照護；2 分可選虛擬病房、當日急症照護（SDEC）、居家醫院或住院；'
       + '0–1 分考慮出院返家，轉介基層照護並給予安全網（返診警訊）衛教。'
       + 'CURB65 每項 1 分：意識混亂、尿素 >7 mmol/L、呼吸速率 ≥30、收縮壓 <90 或舒張壓 ≤60 mmHg、年齡 ≥65。',
    limit: '英國照護體系之「虛擬病房、居家醫院」在台灣多需以留觀或住院替代。共病與懷孕等因素可影響分數判讀。',
    verified: '2026-10-06'
  },
  CURB65_2003: {
    t: 'Defining community acquired pneumonia severity on presentation to hospital: an international derivation and validation study',
    src: 'Thorax', yr: 2003, sec: 'Lim WS et al. 58(5):377–382；PMID 12728155',
    url: 'https://pubmed.ncbi.nlm.nih.gov/12728155/',
    strength: '原始推導與驗證研究',
    key: 'CURB-65 各分數之 30 天死亡率：0 分 0.7%、1 分 3.2%、2 分 3%、3 分 17%、4 分 41.5%、5 分 57%。',
    limit: '英國、紐西蘭、荷蘭之住院病人資料。',
    verified: '2026-10-06'
  },
  NICE_NG147: {
    t: 'Diverticular disease: diagnosis and management (NG147)',
    src: 'NICE guideline', yr: 2019, sec: '第 1.3 節 Acute diverticulitis',
    url: 'https://www.nice.org.uk/guidance/ng147/chapter/Recommendations',
    strength: 'NICE 正式指引',
    key: '疼痛無法控制且有腹部腫塊、腹膜炎、敗血症、瘻管或腸阻塞徵象者，疑為複雜性憩室炎，當天轉醫院評估。'
       + '1.3.7 全身狀況良好者：考慮不給抗生素、給予單純止痛，症狀持續或惡化時返診。'
       + '1.3.8 全身不適、免疫抑制或有重大共病者給予抗生素。'
       + '1.3.5 疑複雜性且發炎指數上升者，入院 24 小時內做顯影電腦斷層。'
       + '1.3.12 電腦斷層確認無併發症者，檢視抗生素需求並依共病決定出院。',
    limit: '英國基層與醫院分工之轉診流程，需對應本院流程。',
    verified: '2026-10-06'
  },
  NICE_CG188: {
    t: 'Gallstone disease: diagnosis and management (CG188)',
    src: 'NICE guideline', yr: 2014, sec: 'Recommendations',
    url: 'https://www.nice.org.uk/guidance/cg188/chapter/Recommendations',
    strength: 'NICE 正式指引',
    key: '疑似膽結石疾病者，安排肝功能檢查與超音波。急性膽囊炎者，建議診斷後 1 週內施行早期腹腔鏡膽囊切除。',
    limit: '2014 年指引。',
    verified: '2026-10-06'
  },
  WSES_APP2020: {
    t: 'Diagnosis and treatment of acute appendicitis: 2020 update of the WSES Jerusalem guidelines',
    src: 'World Journal of Emergency Surgery', yr: 2020, sec: 'Di Saverio S et al. 15:27；PMID 32295644',
    url: 'https://pubmed.ncbi.nlm.nih.gov/32295644/',
    strength: 'GRADE 分級之國際外科指引',
    key: '建議以臨床分數（AIR、AAS 為佳）排除急性闌尾炎（強建議，1A）；以分數判定之低風險病人需要的影像與住院較少。'
       + '床邊超音波為第一線診斷工具（強建議，1B）；需要斷層影像之中度風險者，建議低劑量顯影電腦斷層（1A）。'
       + '選擇性之無併發症闌尾炎可討論以抗生素非手術治療（1A），5 年復發率可達 39%。'
       + '建議於 24 小時內施行腹腔鏡闌尾切除，不應延遲超過入院後 24 小時（強建議，1B）。'
       + '孕婦以分級壓迫超音波為初始影像，不確定時再做 MRI（弱建議，2C）。',
    limit: '外科學會指引；非手術治療需與病人共同決策。',
    verified: '2026-10-06'
  },
  ESC_PE2019: {
    t: '2019 ESC Guidelines for the diagnosis and management of acute pulmonary embolism developed in collaboration with the ERS',
    src: 'European Respiratory Journal / European Heart Journal', yr: 2019,
    sec: 'Konstantinides SV et al. Eur Respir J 2019;54:1901647；Eur Heart J 2020;41:543（PMID 31504429）',
    url: 'https://publications.ersnet.org/content/erj/54/3/1901647',
    strength: 'ESC/ERS 正式指引',
    key: '血流動力不穩者，立即做床邊心臟超音波，以區分疑似高風險肺栓塞與其他致命情況。'
       + '血流動力穩定者確診後，應依臨床表現、右心室大小或功能與生物標記進一步分層。'
       + '提早出院並在家持續抗凝，需同時符合三項：(1) 早期肺栓塞相關死亡或嚴重併發症風險低；'
       + '(2) 無需住院之嚴重共病或加重因素；(3) 可提供適當之門診照護與抗凝治療（考量順從性與醫療、社會資源）。'
       + 'Hestia 規則或 PESI/sPESI 皆可用於分流；若採 PESI/sPESI，必須另外評估在家治療之可行性（Hestia 已內含此評估）。',
    limit: '建議等級表格未能以文字擷取，本系統不標示 Class 等級。',
    verified: '2026-10-06'
  },
  RCUK_ANA2021: {
    t: 'Emergency treatment of anaphylaxis: Guidelines for healthcare providers',
    src: 'Resuscitation Council UK', yr: 2021, sec: '2021 年 5 月；GRADE-ADOLOPMENT 方法學；第 4–8 章',
    url: 'https://www.resus.org.uk/library/additional-guidance/guidance-anaphylaxis/emergency-treatment',
    strength: '學會臨床指引（GRADE）',
    key: '成人與 12 歲以上：腎上腺素（1 mg/mL）500 微克肌肉注射；呼吸道、呼吸或循環問題持續時，5 分鐘後重複。'
       + '不再建議常規使用類固醇作為緊急治療。'
       + '出院前觀察依風險分層：症狀緩解後觀察 2 小時可考慮快速出院，條件為發作 30 分鐘內給予單劑且 5–10 分鐘內反應良好、症狀完全緩解、'
       + '已備有未使用之自行注射筆並受過訓練、出院後有適當照看；'
       + '需要 2 劑肌注腎上腺素或曾有雙相反應者，至少觀察 6 小時；'
       + '需要超過 2 劑、有嚴重氣喘或嚴重呼吸窘迫、過敏原可能持續吸收、深夜就診或難以應對惡化、就醫不便者，至少觀察 12 小時。'
       + '所有病人出院前應由資深醫師評估，並衛教雙相反應之可能與返診方式。',
    limit: '台灣腎上腺素自行注射筆取得不易，「2 小時快速出院」之條件多難完全符合。',
    verified: '2026-10-06'
  },
  BTS_PLEURAL2023: {
    t: 'British Thoracic Society Guideline for pleural disease',
    src: 'Thorax', yr: 2023, sec: 'Roberts ME et al. 78(11):1143；PMID 37553157',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37553157/',
    strength: '學會臨床指引',
    key: '症狀輕微（無明顯疼痛或喘、無生理功能受損）或無症狀之成人原發性自發性氣胸，不論大小皆可考慮保守治療。'
       + '支持良好且院內具備專業與追蹤機制時，原發性自發性氣胸之初始治療可考慮門診式（ambulatory）處置。'
       + '不適合保守或門診處置者，考慮針頭抽吸或胸管引流。',
    limit: '本條摘要取自學會公告之建議重點；次發性氣胸與張力性氣胸之處置未納入本條。',
    verified: '2026-10-06'
  },
  AANZDEM2017: {
    t: 'An Observational Study of Dyspnea in Emergency Departments: The Asia, Australia, and New Zealand Dyspnea in Emergency Departments Study (AANZDEM)',
    src: 'Academic Emergency Medicine', yr: 2017, sec: 'Kelly AM et al. 24(3):328–336；PMID 27743490',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27743490/',
    strength: '前瞻性多國世代研究（澳洲、紐西蘭、新加坡、香港、馬來西亞）',
    key: '以喘為主訴者占急診 5.2%。最常見診斷：下呼吸道感染 20.2%、心衰竭 14.9%、COPD 13.6%、氣喘 12.7%。'
       + '64% 需住院、3.3% 需加護病房，院內死亡率 6%。',
    limit: '急診診斷分布，非最終出院診斷之全部；地區照護模式可能不同。',
    verified: '2026-10-06'
  },
  ADA2024: {
    t: 'Hyperglycemic Crises in Adults With Diabetes: A Consensus Report',
    src: 'Diabetes Care（ADA、EASD 等多學會）', yr: 2024, sec: '2024 年 8 月；PMID 39052901',
    url: 'https://pubmed.ncbi.nlm.nih.gov/39052901/',
    strength: '多學會共識報告',
    key: '診斷三項齊備：血糖 ≥200 mg/dL 或已知糖尿病；BHB ≥3.0 mmol/L 或尿酮 ≥2+；pH <7.3 或 HCO₃ <18 mmol/L。'
       + '陰離子隙不再是第一線診斷標準。'
       + '照護層級：輕度（BHB ≤6、pH >7.25、HCO₃ ≥15）可於一般病房；中度宜降階病房（step-down）；重度（BHB >6、pH <7.0、HCO₃ <10）需加護病房。'
       + '起始胰島素前 K <3.5 mmol/L 者先以 10 mmol/h 補鉀並暫緩胰島素。'
       + '緩解：BHB <3.0 mmol/L、pH >7.3、HCO₃ >15 mmol/L。',
    limit: '照護層級之分級引自共識報告之公開摘要整理；中度之完整定義請查全文。',
    verified: '2026-10-06'
  },
  E_MET: {
    t: 'Extracorporeal treatment for metformin poisoning: recommendations from the EXTRIP workgroup',
    src: 'Critical Care Medicine', yr: 2015, sec: 'EXTRIP workgroup',
    url: 'https://www.extrip-workgroup.org/metformin',
    strength: 'EXTRIP 共識建議（Delphi）',
    key: '建議體外清除：lactate >20 mmol/L 或 pH ≤7.0（1D）。建議考慮：lactate >15 或 pH ≤7.1（2D）。'
       + '下修門檻之共病：休克、腎功能受損（1D）；肝衰竭、意識下降（2D）。'
       + '首選含碳酸氫鹽透析液之間歇性血液透析（1D）；停止門檻 lactate <3 且 pH >7.35（1D）。',
    limit: '台灣多數院所無法急測 metformin 濃度，屬臨床診斷。',
    verified: '2026-10-06'
  },
  E_MEOH: {
    t: 'Recommendations for the role of extracorporeal treatments in the management of acute methanol poisoning',
    src: 'Critical Care Medicine', yr: 2015, sec: 'Roberts DM et al. 2015 年 2 月；PMID 25493973',
    url: 'https://pubmed.ncbi.nlm.nih.gov/25493973/',
    strength: 'EXTRIP 系統性回顧與共識建議',
    key: '體外清除指徵：昏迷、癲癇、新發視覺缺損、pH ≤7.15、陰離子隙 >24 mmol/L、解毒與支持治療下酸中毒持續；'
       + '或甲醇濃度：併用 fomepizole >700 mg/L、併用乙醇 >600 mg/L、無 ADH 阻斷劑 >500 mg/L。'
       + '停止門檻 <200 mg/L 且臨床改善；透析期間持續 ADH 阻斷劑與 folate。',
    limit: '台灣多數院所無法急測甲醇濃度。',
    verified: '2026-10-06'
  },
  E_EG: {
    t: 'Extracorporeal treatment for ethylene glycol poisoning: systematic review and recommendations from the EXTRIP workgroup',
    src: 'Critical Care', yr: 2023, sec: 'Ghannoum M et al. 2023 年 2 月；PMID 36765419',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36765419/',
    strength: 'EXTRIP 系統性回顧與共識建議',
    key: '不以攝入劑量單獨決定。併用 fomepizole 時，濃度 >50 mmol/L 或滲透壓間隙 >50 建議體外清除；'
       + 'glycolate >12 mmol/L 或陰離子隙 >27 mmol/L；或出現昏迷、癲癇、急性腎損傷。',
    limit: '台灣多數院所無法急測乙二醇與 glycolate。',
    verified: '2026-10-06'
  },
  E_SAL: {
    t: 'Extracorporeal Treatment for Salicylate Poisoning: Systematic Review and Recommendations From the EXTRIP Workgroup',
    src: 'Annals of Emergency Medicine', yr: 2015, sec: 'Juurlink DN et al. 2015 年 8 月；PMID 25986310',
    url: 'https://pubmed.ncbi.nlm.nih.gov/25986310/',
    strength: 'EXTRIP 系統性回顧與共識建議',
    key: '建議體外清除（1D）：>100 mg/dL；腎功能受損時 >90 mg/dL；意識改變；新發需氧氣之低血氧；標準治療失敗。'
       + '建議考慮（2D）：>90 mg/dL；腎功能受損時 >80 mg/dL；pH ≤7.20。首選間歇性血液透析；停止門檻 <19 mg/dL 且臨床改善。',
    limit: '濃度單位以 mg/dL 表示。',
    verified: '2026-10-06'
  },
  ACMT_SAL: {
    t: 'Guidance Document: Management Priorities in Salicylate Toxicity',
    src: 'American College of Medical Toxicology', yr: 2013, sec: 'ACMT Position / Guidance',
    url: 'https://www.acmt.net/wp-content/uploads/2022/06/PRS_130313_Management-Priorities-in-Salicylate-Toxicity.pdf',
    strength: '學會指引文件',
    key: '插管與機械通氣可使水楊酸毒性急遽惡化並增加死亡率，除非以過度換氣與碳酸氫鈉維持正常或略偏鹼之 pH。'
       + '若插管無法避免：先給碳酸氫鈉、插管後比照插管前之呼吸速率；以水楊酸毒性為插管適應症時，透析應優先於或至少與插管同時進行。'
       + '尿液鹼化目標 pH 7.5–8.0；低血鉀會使鹼化失效。',
    limit: '2013 年文件。',
    verified: '2026-10-06'
  },

  // ---------- 頭暈：原始研究與回顧 ----------
  KATTAH2009: {
    t: 'HINTS to Diagnose Stroke in the Acute Vestibular Syndrome: Three-Step Bedside Oculomotor Examination More Sensitive than Early MRI DWI',
    src: 'Stroke', yr: 2009, sec: '40(11):3504–3510',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19762709/',
    strength: '原始前瞻性研究（PMID 19762709）',
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
    url: 'https://pubmed.ncbi.nlm.nih.gov/38385911/',
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
    strength: '國際指引（含強建議與條件式建議）；PMID 41869847',
    key: '敗血性休克或已確立之敗血症，立即給予經驗性抗生素、理想上 1 小時內（強建議）。敗血症誘發之低灌流或休克，3 小時內至少 30 mL/kg 晶體液並強調個別化與頻繁再評估。一般成人初始 MAP 目標 65 mmHg；≥65 歲可設 60–65 mmHg（條件式建議，2026 新增）。'
       + '血液培養應儘早採檢，理想上在給予抗生素之前。',
    limit: '本條依期刊摘要與公開評論整理，未取得全文逐條核對。',
    verified: '2026-10-06'
  },
  ASCOIDSA_FN: {
    t: 'Outpatient Management of Fever and Neutropenia in Adults Treated for Malignancy: ASCO / IDSA Clinical Practice Guideline Update',
    src: 'Journal of Clinical Oncology / Journal of Oncology Practice', yr: 2018,
    sec: 'Guideline Update Summary',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29517953/',
    strength: '學會聯合臨床指引',
    key: '發熱性嗜中性白血球低下病人應於檢傷後 1 小時內給予首劑經驗性抗生素；擬門診處置者，出院前須觀察至少 4 小時。',
    limit: '以門診處置之風險分層為主軸，急診端之適用需併同院內流程判斷。',
    verified: '2026-10-06'
  },
  AGIHO2024: {
    t: '2024 update of the AGIHO guideline on diagnosis and empirical treatment of fever of unknown origin (FUO) in adult neutropenic patients with solid tumours and hematological malignancies',
    src: 'The Lancet Regional Health – Europe（AGIHO／DGHO）', yr: 2025, sec: '2024 年更新版；PMID 39973942',
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
  AAA_MASQ: {
    t: 'Ruptured Abdominal Aortic Aneurysm Masquerading as Acute Appendicitis',
    src: 'Cureus（病例報告）', yr: 2025, sec: 'PMID 41322883；PMC12661095',
    url: 'https://pubmed.ncbi.nlm.nih.gov/41322883/',
    strength: '病例報告（證據等級低，僅作為警示用）',
    key: '腹主動脈瘤破裂可以非特異或誤導性症狀表現，曾被誤診為闌尾炎、憩室炎、腎絞痛或臟器穿孔。對老年新發之腎絞痛、肌肉骨骼背痛甚至暈厥，應先排除腹主動脈瘤破裂。',
    limit: '單一病例報告，不可作為盛行率或診斷效能之依據，僅用於提示誤診型態。',
    verified: '2026-10-06'
  },

  // ---------- 刻意未查證：用以展示封鎖機制 ----------
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
        { id: 'nystype', label: '自發性眼振型態（休息、未誘發時觀察）', type: 'choice',
          opts: ['水平、單一方向', '垂直或扭轉型', '凝視時方向改變'],
          showIf: f => f.nystagmus === true,
          hint: '垂直或扭轉型：中樞特異度 97.7%、敏感度 19.1%。注意與 Dix-Hallpike 誘發之扭轉上跳型區分' },
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
      { if: f => f.focal === true, msg: '局部神經學異常：頭暈併腦神經、眼動、協調或肢體異常，應以中樞病因優先處理', refs: ['GRACE3'] },
      { if: f => f.gait === true, msg: '無法獨立行走：嚴重步態不穩在急性前庭症候群中偏向中樞病因', refs: ['GRACE3'] },
      { if: f => f.hi === '無矯正性掃視（中樞警訊）' || f.ny === '凝視時方向改變（中樞警訊）' || f.ts === '有偏斜（中樞警訊）',
        msg: 'HINTS 出現中樞警訊：任一項不符合周邊定位即不可排除中樞病因', refs: ['KATTAH2009', 'HINTSCAVEAT'] },
      { if: f => f.nystype === '垂直或扭轉型',
        msg: '休息時出現垂直或扭轉型自發性眼振：對中樞病因特異度 97.7%，應視為中樞直至證實為否（但敏感度僅 19.1%，沒看到不能排除）', refs: ['LEE2025NYS'] },
      { if: f => f.pattern === '持續性（現在仍在）' && f.nystagmus === false,
        msg: '持續性眩暈卻無自發性眼振：對中樞病因特異度 97.9%；HINTS 不適用，應改以步態嚴重度評估', refs: ['LEE2025NYS', 'GRACE3'] },
    ],
    dx: [
      {
        id: 'pcs', name: '後循環中風 / 短暫性腦缺血', danger: true,
        dispo: { admit: ['HINTS 中樞警訊、結果不明確或神經學異常：安排含 DWI 之中風 MRI 與 MRA；不以 CT 正常作為離院依據'], refs: ['GRACE3'] },
        why: '頭暈是後循環中風最常見的表現之一，且可以完全沒有肢體無力。漏診的代價是可逆轉的治療時間窗消失。',
        rules: [
          { f: 'focal', want: true, s: '有局部神經學異常', decisive: true },
          { f: 'gait', want: true, s: '無法獨立行走' },
          { f: 'cvrf', want: true, s: '有心血管危險因子' },
          { f: 'af', want: true, s: '心房顫動' },
          { f: 'hi', want: '無矯正性掃視（中樞警訊）', s: 'HINTS：頭部甩動試驗無矯正性掃視', decisive: true },
          { f: 'ny', want: '凝視時方向改變（中樞警訊）', s: 'HINTS：眼振方向改變', decisive: true },
          { f: 'ts', want: '有偏斜（中樞警訊）', s: 'HINTS：垂直眼位偏斜', decisive: true },
          { f: 'hear_new', want: true, s: 'HINTS Plus：新發單側聽力喪失' },
          { f: 'nystype', want: '垂直或扭轉型', s: '垂直或扭轉型自發性眼振', decisive: true },
          { f: 'nystype', want: '凝視時方向改變', s: '凝視時方向改變之眼振', decisive: true },
          { f: 'posit', want: false, s: '非頭位誘發' }
        ],
        against: [
          { f: 'pattern', want: '陣發性、有誘發', s: '陣發且有頭位誘發，較符合良性陣發性姿勢性眩暈' }
        ],
        ask: [
          { q: '症狀是持續還是陣發？現在還在發作嗎？', why: '持續性才構成急性前庭症候群，HINTS 才有適用前提', refs: ['HINTSCAVEAT'] },
          { q: '有沒有自發性眼振？', why: '無眼振者 HINTS 不適用，判讀無效', refs: ['HINTSCAVEAT'] },
          { q: '能不能自己走？', why: '無眼振者以步態嚴重度區分中樞與周邊', refs: ['GRACE3'] },
        ],
        tests: [
          { t: 'HINTS 三步驟床邊眼動檢查', purpose: '在急性前庭症候群中區分中樞與周邊',
            note: '敏感度 100%、特異度 96%（專家執行）；統合分析之合併敏感度 0.96、特異度 0.88。優於發病 24–48 小時內之 MRI-DWI。',
            caveat: '僅適用於持續性眩暈且有自發性眼振者。任一項不符周邊即不可排除中樞。',
            refs: ['GRACE3', 'KATTAH2009', 'PLOS2022HINTS', 'AEM2024HINTS', 'HINTSCAVEAT'], yield: 'high' },
          { t: '腦部電腦斷層', purpose: '排除出血',
            note: '對後循環缺血性中風敏感度低，陰性結果不能用來排除。',
            caveat: '若目的是排除後循環中風，這是低產出檢查；臨床決策不應因 CT 正常而放鬆。',
            refs: ['GRACE3'], yield: 'low' },
          { t: 'MRI 含 DWI', purpose: '確認後循環梗塞',
            note: '發病 24–48 小時內可能偽陰性，床邊 HINTS 於此時間窗內敏感度更高。',
            refs: ['GRACE3', 'KATTAH2009'], yield: 'high' },
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
        ],
        tests: [
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
          { f: 'nystype', want: '水平、單一方向', s: '水平單一方向之自發性眼振' },
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
          { f: 'hear_new', want: true, s: 'HINTS Plus：新發單側聽力喪失，須提高中樞警覺' },
          { f: 'nystype', want: '垂直或扭轉型', s: '垂直或扭轉型自發性眼振，不符周邊病因' }
        ],
        ask: [
          { q: '有無聽力變化？可用手指摩擦床邊測試', why: '併單側聽力喪失時須提高中樞警覺（HINTS Plus）', refs: ['GRACE3'] }
        ],
        tests: [
          { t: 'HINTS 三步驟床邊眼動檢查', purpose: '確認三項均符合周邊定位',
            caveat: '三項必須全部符合周邊型才支持本診斷。',
            refs: ['KATTAH2009', 'HINTSCAVEAT'], yield: 'high' }
        ],
        reassess: '診斷成立後仍應確認病人可獨立行走再考慮離院；無法行走者不論 HINTS 結果為何都應留觀。'
      },
      {
        id: 'bppv', name: '良性陣發性姿勢性眩暈（BPPV）', danger: false,
        dispo: { home: ['Dix-Hallpike 典型陽性並完成 Epley、無中樞徵象：可返家；復位後不需姿勢限制', '1 個月內回診，確認症狀緩解或持續'],
                 caution: ['行動或平衡障礙、中樞神經疾病、家中缺乏支持或跌倒風險高者，需調整處置'], refs: ['AAOHNS2017'] },
        common: { rank: 1, ref: 'AAOHNS2017', note: '成人最常見之前庭疾病，終生盛行率 2.4%' },
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
          { q: '是否只在特定頭位改變時發作、平時不暈？', why: '誘發陣發型應常規以 Dix-Hallpike 確認', refs: ['GRACE3'] }
        ],
        tests: [
          { t: 'Dix-Hallpike 試驗', purpose: '誘發並確認後半規管型',
            note: '誘發出伴隨眩暈之扭轉、上跳型眼振即可診斷。此為「誘發」眼振，與休息時之自發性垂直眼振意義相反。',
            refs: ['GRACE3', 'AAOHNS2017'], yield: 'high' },
          { t: 'Epley 復位術', purpose: 'Dix-Hallpike 陽性即施行',
            caveat: '確診典型後半規管 BPPV 後，不需常規影像，也不應常規使用前庭抑制劑。',
            refs: ['GRACE3', 'AAOHNS2017'], yield: 'high' }
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
        ],
        tests: [
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
        ask: [],
        tests: [],
        reassess: '停藥或調整後症狀未改善者，應重新評估其他病因。'
      }
    ]
  },

  // ===================================================================
  // 腹痛（依 AFP 2023、NICE NG126、WSES 2022、ACC/AHA 2025 重寫）
  // ===================================================================
  abdo: {
    name: '腹痛',
    icon: '◍',
    tagline: '先辨識危險，再定位疼痛；年齡與懷孕可能性會改寫鑑別順序',
    primer: '疼痛位置是線索，不是診斷。高齡、免疫低下與肥胖病人之理學表現常較不明顯。',
    groups: [
      { g: '基本資料', fields: [
        { id: 'age', label: '年齡', type: 'num', unit: '歲' },
        { id: 'sex', label: '生理性別', type: 'choice', opts: ['男', '女'] },
        { id: 'preg', label: '可能懷孕', type: 'tri',
          showIf: f => f.sex === '女' && (f.age === null || (f.age >= 12 && f.age <= 55)),
          hint: '育齡女性即使症狀不典型也應驗孕' }
      ]},
      { g: '生命徵象', fields: [
        { id: 'sbp', label: '收縮壓', type: 'num', unit: 'mmHg' },
        { id: 'hr', label: '心跳', type: 'num', unit: '/min' },
        { id: 'temp', label: '體溫', type: 'num', unit: '°C', step: 0.1 },
        { id: 'spo2', label: 'SpO₂', type: 'num', unit: '%' },
        { id: 'vt', label: '量測時間', type: 'text', ph: '例如 03:20' }
      ]},
      { g: '主要疼痛位置', core: true, fields: [
        { id: 'site', label: '病人的右側顯示在左邊', type: 'grid',
          opts: ['ruq', 'epi', 'luq', 'rflank', 'diffuse', 'lflank', 'rlq', 'pelvis', 'llq'],
          labels: { ruq: '右上腹', epi: '上腹中央', luq: '左上腹', rflank: '右側腰', diffuse: '臍周／全腹',
                    lflank: '左側腰', rlq: '右下腹', pelvis: '下腹／骨盆', llq: '左下腹' } }
      ]},
      { g: '危險徵象', core: true, fields: [
        { id: 'sudden', label: '突然發作或劇烈疼痛', type: 'tri' },
        { id: 'perit', label: '反彈痛、肌衛或腹部僵硬', type: 'tri' },
        { id: 'oop', label: '疼痛程度與理學檢查不成比例', type: 'tri' },
        { id: 'syncope', label: '暈厥、意識改變或低灌流', type: 'tri' }
      ]},
      { g: '伴隨症狀與理學檢查', fields: [
        { id: 'diarrhea', label: '腹瀉', type: 'tri' },
        { id: 'distend', label: '腹脹或停止排氣排便', type: 'tri' },
        { id: 'migrate', label: '疼痛由臍周轉移至右下腹', type: 'tri' },
        { id: 'murphy', label: 'Murphy sign 陽性', type: 'tri' },
        { id: 'jaundice', label: '黃疸', type: 'tri' },
        { id: 'urinary', label: '血尿、排尿症狀或腰側絞痛', type: 'tri' },
        { id: 'chest', label: '胸悶、冒冷汗或喘', type: 'tri' },
        { id: 'vagbleed', label: '陰道出血', type: 'tri', showIf: f => f.sex === '女' }
      ]},
      { g: '病史與用藥', fields: [
        { id: 'af', label: '心房顫動、動脈粥樣硬化或高凝狀態', type: 'tri' },
        { id: 'surg', label: '腹部手術史或疝氣', type: 'tri' },
        { id: 'aaa', label: '已知主動脈瘤或主動脈疾病', type: 'tri' },
        { id: 'immuno', label: '免疫抑制', type: 'tri' },
        { id: 'nsaid', label: '使用 NSAID 或消化性潰瘍史', type: 'tri' },
        { id: 'gallhx', label: '膽結石病史', type: 'tri' }
      ]}
    ],
    redflags: [
      { if: f => f.sbp !== null && f.sbp < 90,
        msg: '收縮壓 < 90 mmHg：血流動力不穩之腹痛常需緊急復甦或手術，先穩定再鑑別', refs: ['AFP2023ABD'] },
      { if: f => f.perit === true,
        msg: '腹膜炎徵象：常需緊急復甦或手術，立即資深醫師與外科評估', refs: ['AFP2023ABD'] },
      { if: f => f.oop === true,
        msg: '疼痛與理學檢查不成比例：應先假設為急性腸繫膜缺血直到排除，並儘速安排 CT 血管攝影',
        refs: ['WSES_AMI2022', 'AFP2023ABD'] },
      { if: f => f.sex === '女' && (f.age === null || (f.age >= 12 && f.age <= 55)) && f.preg === null,
        msg: '育齡女性懷孕可能性未知：即使症狀不典型也應驗孕；約三分之一異位妊娠沒有已知危險因子',
        refs: ['NICE_NG126', 'AFP2023ABD'] },
      { if: f => f.preg === true && (f.syncope === true || (f.sbp !== null && f.sbp < 100)),
        msg: '懷孕可能合併暈厥或低血壓：視為異位妊娠破裂直到排除，立即婦產科評估', refs: ['NICE_NG126'] },
      { if: f => f.age !== null && f.age >= 60 && f.sudden === true,
        msg: '≥60 歲突發或劇烈腹痛：主動脈瘤破裂與中空器官穿孔須優先排除；勿先診斷為腎絞痛或肌肉痛',
        refs: ['AFP2023ABD', 'AAA_MASQ'] },
      { if: f => (f.age !== null && f.age >= 65) || f.immuno === true,
        msg: '高齡或免疫抑制：發燒、白血球上升與腹膜徵象可能付之闕如，應降低影像門檻',
        refs: ['AFP2023ABD', 'GERIABD'] }
    ],
    dx: [
      // ---------------- 常見 ----------------
      {
        id: 'gastro', name: '腸胃炎／非特異性腹痛', danger: false,
        common: { rank: 1, ref: 'AFP2023ABD', note: '急診腹痛最常見：腸胃炎 10.8%、非特異性腹痛 10.4%' },
        why: '最常見，但屬排除性診斷。只有在危險診斷已被適當評估後才成立。',
        rules: [
          { f: 'diarrhea', want: true, s: '腹瀉' },
          { f: 'perit', want: false, s: '無腹膜炎徵象' }
        ],
        against: [
          { f: 'perit', want: true, s: '有腹膜炎徵象' },
          { f: 'oop', want: true, s: '疼痛與理學檢查不成比例' }
        ],
        ask: [
          { q: '噁心嘔吐是否足以解釋病況？', why: '噁心嘔吐雖常見於腸胃炎，也常見於小腸阻塞、闌尾炎與腸麻痺', refs: ['AFP2023ABD'] }
        ],
        tests: [],
        reassess: '工作診斷而非結論。重測生命徵象並重做腹部檢查；持續局部疼痛或惡化應重新展開鑑別。'
      },
      {
        id: 'gall', name: '膽結石／急性膽囊炎', danger: false, regions: ['ruq', 'epi'],
        dispo: { admit: ['急性膽囊炎：照會外科，建議診斷後 1 週內腹腔鏡膽囊切除'], refs: ['NICE_CG188'] },
        common: { rank: 2, ref: 'AFP2023ABD', note: '急診腹痛第三常見：膽結石 4.5%' },
        why: '右上腹或上腹痛之常見原因。單一臨床徵象不足以確診，需併同超音波。',
        rules: [
          { f: 'site', any: ['ruq', 'epi'], s: '右上腹或上腹痛', weak: true },
          { f: 'murphy', want: true, s: 'Murphy sign 陽性（LR+ 15.6）', decisive: true },
          { f: 'temp', gte: 38, s: '發燒' },
          { f: 'gallhx', want: true, s: '膽結石病史' }
        ],
        against: [],
        ask: [
          { q: '有無發燒、噁心嘔吐或黃疸？', why: '急性膽囊炎可合併發燒與嘔吐，黃疸較少見', refs: ['AFP2023ABD'] }
        ],
        tests: [
          { t: '右上腹超音波', purpose: '評估膽囊炎與膽石',
            note: '右上腹痛之首選影像；床邊超音波亦可協助。', refs: ['AFP2023ABD'], yield: 'high' }
        ],
        reassess: '膽石不一定是本次疼痛原因；合併黃疸、發燒或循環異常者另評估膽管炎與敗血症。'
      },
      {
        id: 'stone', name: '泌尿道結石', danger: false, regions: ['rflank', 'lflank', 'rlq', 'llq', 'pelvis'],
        common: { rank: 3, ref: 'AFP2023ABD', note: '急診腹痛第四常見：泌尿道結石 4.3%' },
        why: '突發腰側絞痛之常見原因，但高齡新發「腎絞痛」須先排除主動脈瘤破裂。',
        rules: [
          { f: 'site', any: ['rflank', 'lflank'], s: '腰側疼痛' },
          { f: 'urinary', want: true, s: '血尿、排尿症狀或腰側絞痛' }
        ],
        against: [],
        ask: [
          { q: '是否坐立難安、來回扭動？', why: '扭動不安較常見於膽絞痛或腎絞痛，靜止不動則提示腹膜炎', refs: ['AFP2023ABD'] }
        ],
        tests: [
          { t: '超音波（含床邊超音波）', purpose: '評估腎水腫與結石', refs: ['AFP2023ABD'], yield: 'high' },
          { t: '結石專用電腦斷層', purpose: '確認結石與併發症',
            caveat: '可保留給 >50 歲且無結石史、>75 歲、疼痛難以控制、腹部壓痛或發燒者。',
            refs: ['AFP2023ABD'], yield: 'mid' }
        ],
        reassess: '≥60 歲首次腎絞痛，應先排除主動脈瘤破裂；合併發燒者評估感染性阻塞。'
      },
      {
        id: 'div', name: '急性憩室炎', danger: false, regions: ['llq', 'rlq', 'pelvis'],
        dispo: { admit: ['疼痛無法控制且有腹部腫塊、腹膜炎、敗血症、瘻管或腸阻塞徵象：當天住院評估，靜脈抗生素，發炎指數上升者 24 小時內顯影電腦斷層'],
                 home: ['全身狀況良好：可不給抗生素、單純止痛，症狀持續或惡化時返診', '電腦斷層確認無併發症：依共病決定出院'],
                 caution: ['全身不適、免疫抑制或重大共病：需給予抗生素'], refs: ['NICE_NG147'] },
        common: { rank: 4, ref: 'AFP2023ABD', note: '急診腹痛第五常見：憩室炎 3.8%' },
        why: '下腹痛合併發燒或排便改變；複雜性者可合併膿瘍或穿孔。',
        rules: [
          { f: 'site', any: ['llq', 'rlq', 'pelvis'], s: '下腹痛', weak: true },
          { f: 'temp', gte: 38, s: '發燒' }
        ],
        against: [],
        ask: [
          { q: '有無厭食、噁心但不吐、排便習慣改變？', why: '左下腹痛合併這些症狀與發燒提示憩室炎', refs: ['AFP2023ABD'] }
        ],
        tests: [
          { t: '電腦斷層（含顯影）', purpose: '確認診斷並評估併發症',
            note: '臨床印象之 LR+ 為 32；免疫正常且無危險因子者可臨床診斷。', refs: ['AFP2023ABD'], yield: 'high' }
        ],
        reassess: '免疫抑制或全身不適者另評估；膿瘍、腹膜炎或惡化者會診外科。'
      },
      {
        id: 'appe', name: '急性闌尾炎', danger: true, regions: ['rlq', 'diffuse', 'pelvis'], primary: ['rlq'],
        dispo: { admit: ['確診：計畫 24 小時內腹腔鏡闌尾切除，不應延遲超過入院後 24 小時'],
                 home: ['臨床分數（AIR、AAS）判定低風險者，所需影像與住院較少'],
                 caution: ['選擇性無併發症者可共同決策抗生素非手術治療（5 年復發率可達 39%）'], refs: ['WSES_APP2020'] },
        showIf: f => f.site === null || ['rlq', 'diffuse', 'pelvis'].includes(f.site) || f.migrate === true,
        common: { rank: 5, ref: 'AFP2023ABD', note: '急診腹痛第五常見：闌尾炎 3.8%' },
        why: '常見，但高齡與孕婦表現常不典型，延遲診斷穿孔率較高。',
        rules: [
          { f: 'site', any: ['rlq'], s: '右下腹痛（LR+ 7.3–8.5）' },
          { f: 'migrate', want: true, s: '疼痛由臍周轉移至右下腹（LR+ 3.2）' },
          { f: 'perit', want: true, s: '腹膜刺激徵象' },
          { f: 'temp', gte: 38, s: '發燒（LR+ 1.9）' }
        ],
        against: [],
        ask: [
          { q: '疼痛是否由臍周轉移至右下腹？', why: '轉移性疼痛 LR+ 3.2；右下腹痛 LR+ 7.3–8.5', refs: ['AFP2023ABD'] },
          { q: '計算臨床分數（AIR 或 AAS）', why: '以臨床分數排除闌尾炎（強建議 1A）；低風險者所需影像與住院較少', refs: ['WSES_APP2020'] }
        ],
        tests: [
          { t: '床邊超音波', purpose: '第一線影像', note: '第一線診斷工具（強建議 1B）。', refs: ['WSES_APP2020'], yield: 'high' },
          { t: '低劑量顯影電腦斷層', purpose: '中度風險需斷層影像者', note: '優於標準劑量電腦斷層（強建議 1A）。', refs: ['WSES_APP2020'], yield: 'high' },
          { t: '超音波（必要時加做選擇性電腦斷層）', purpose: '確認闌尾發炎',
            note: '常規超音波合併選擇性電腦斷層，敏感度優於常規電腦斷層且減少輻射。',
            caveat: '孕婦以超音波為首選，結果不確定時優先 MRI。', refs: ['AFP2023ABD'], yield: 'high' }
        ],
        reassess: '單一陰性發現不足以排除；症狀持續者應重新評估或追蹤影像。'
      },
      {
        id: 'uti', name: '泌尿道感染／腎盂腎炎', danger: false, regions: ['rflank', 'lflank', 'pelvis'],
        common: { rank: 6, ref: 'AFP2023ABD', note: '約 10% 的急診腹痛為泌尿道病因' },
        why: '腹痛的常見腹外病因；合併阻塞時屬急症。',
        rules: [
          { f: 'urinary', want: true, s: '排尿症狀或腰側疼痛' },
          { f: 'temp', gte: 38, s: '發燒' }
        ],
        against: [],
        ask: [
          { q: '有無排尿疼痛、頻尿或血尿？', why: '約一成急診腹痛為泌尿道病因', refs: ['AFP2023ABD'] }
        ],
        tests: [
          { t: '尿液常規', purpose: '評估感染與血尿', refs: ['AFP2023ABD'], yield: 'high' }
        ],
        reassess: '合併發燒與阻塞、無尿或循環異常者應立即升級處置。'
      },
      {
        id: 'pan', name: '急性胰臟炎', danger: false, regions: ['epi', 'luq'],
        why: '上腹痛可延伸至背部。需持續尋找病因，不因飲酒史就認定為酒精性。',
        rules: [
          { f: 'site', any: ['epi', 'luq'], s: '上腹或左上腹痛', weak: true },
          { f: 'gallhx', want: true, s: '膽結石病史' }
        ],
        against: [],
        ask: [
          { q: '疼痛是否延伸到背部？有無飲酒或膽石史？', why: '上腹痛之鑑別包括胰臟炎', refs: ['AFP2023ABD'] }
        ],
        tests: [
          { t: 'Lipase', purpose: '支持胰臟炎診斷',
            note: '在合適臨床情境下，高於正常上限三倍提示胰臟炎。', refs: ['AFP2023ABD'], yield: 'high' }
        ],
        reassess: '確診後仍應尋找病因，並監測器官功能。'
      },

      // ---------------- 危險（不能漏） ----------------
      {
        id: 'raaa', name: '腹主動脈瘤破裂／主動脈急症', danger: true,
        dispo: { admit: ['血流動力不穩之腹痛常需緊急復甦或手術'], refs: ['AFP2023ABD'] },
        why: '可偽裝成腎絞痛、憩室炎、闌尾炎甚至單純暈厥。高齡新發腰背痛須主動排除。',
        rules: [
          { f: 'sudden', want: true, s: '突然發作或劇烈疼痛' },
          { f: 'site', any: ['rflank', 'lflank', 'diffuse', 'epi'], s: '腰背或腹中央疼痛', weak: true },
          { f: 'aaa', want: true, s: '已知主動脈瘤', decisive: true },
          { f: 'syncope', want: true, s: '暈厥或低灌流' },
          { f: 'age', gte: 60, s: '年齡 ≥ 60', weak: true }
        ],
        against: [],
        ask: [
          { q: '是否可指出發作的那一刻？是否延伸到背部？', why: '突發或劇烈腹痛之可能病因包括主動脈瘤破裂', refs: ['AFP2023ABD', 'AAA_MASQ'] }
        ],
        tests: [
          { t: '床邊超音波（主動脈）', purpose: '快速測量主動脈直徑',
            note: '可於床邊完成，不需移動不穩定病人。', refs: ['AFP2023ABD', 'AAA_MASQ'], yield: 'high' },
          { t: '電腦斷層血管攝影', purpose: '確認破裂與解剖',
            caveat: '血流動力不穩者不應為了做影像而延誤手術會診。', refs: ['AAA_MASQ'], yield: 'high' },
        ],
        reassess: '床邊超音波品質受腸氣影響；高度懷疑時仍應進一步評估。'
      },
      {
        id: 'ami', name: '急性腸繫膜缺血', danger: true,
        dispo: { admit: ['疑似即刻 CT 血管攝影；動脈阻塞且具專業時以血管內再灌流為首選'], refs: ['WSES_AMI2022'] },
        why: '早期理學檢查可以完全正常；每延遲 6 小時診斷，死亡率加倍。',
        rules: [
          { f: 'oop', want: true, s: '疼痛與理學檢查不成比例', decisive: true },
          { f: 'af', want: true, s: '心房顫動、動脈粥樣硬化或高凝狀態' },
          { f: 'age', gte: 70, s: '年齡 > 70', weak: true },
          { f: 'sudden', want: true, s: '突然發作' }
        ],
        against: [],
        ask: [
          { q: '有無心房顫動、動脈粥樣硬化、血管炎或高凝狀態？', why: '腸繫膜缺血危險因子，存在時應考慮 CT 血管攝影', refs: ['AFP2023ABD', 'WSES_AMI2022'] }
        ],
        tests: [
          { t: 'CT 血管攝影', purpose: '確認腸繫膜血管阻塞',
            note: '疑似時應立即施行，不得延遲（強建議、高品質證據 1A）。',
            refs: ['WSES_AMI2022'], yield: 'high' },
          { t: '乳酸、D-dimer', purpose: '輔助判斷',
            caveat: '無單一生物標記可確診（弱建議 2B）；乳酸早期可能正常，正常不能排除。',
            refs: ['WSES_AMI2022', 'AFP2023ABD'], yield: 'mid' }
        ],
        reassess: '檢驗正常不能作為延後 CT 血管攝影的理由；確診後由血管與外科團隊評估再灌流。'
      },
      {
        id: 'perf', name: '消化道穿孔／腹膜炎', danger: true,
        dispo: { admit: ['腹膜炎徵象常需緊急復甦或手術'], refs: ['AFP2023ABD'] },
        why: '高齡與使用類固醇者可沒有明顯腹膜徵象；初次生命徵象穩定不能排除。',
        rules: [
          { f: 'sudden', want: true, s: '突然發作' },
          { f: 'perit', want: true, s: '腹膜炎徵象', decisive: true },
          { f: 'nsaid', want: true, s: '使用 NSAID 或消化性潰瘍史' }
        ],
        against: [],
        ask: [
          { q: '有無使用 NSAID？消化性潰瘍病史？', why: '使用 NSAID 應提高對消化性潰瘍之懷疑', refs: ['AFP2023ABD'] }
        ],
        tests: [
          { t: '電腦斷層（含顯影）', purpose: '評估中空器官穿孔', refs: ['AFP2023ABD'], yield: 'high' },
          { t: '立位胸部或腹部 X 光', purpose: '偵測游離氣體',
            caveat: '電腦斷層與超音波已取代常規 X 光；X 光僅在資源受限時有角色。', refs: ['AFP2023ABD'], yield: 'low' }
        ],
        reassess: '高齡或免疫抑制者缺乏腹膜徵象不代表沒有穿孔。'
      },
      {
        id: 'ectopic', name: '異位妊娠', danger: true,
        dispo: { admit: ['血流動力不穩，或疼痛、出血程度令人擔憂：直接急診處置',
                         '驗孕陽性合併腹痛與壓痛、骨盆壓痛或子宮頸舉痛：立即轉早期妊娠評估（本院對應婦產科會診）'], refs: ['NICE_NG126'] },
        showIf: f => f.sex !== '男' && (f.age === null || (f.age >= 12 && f.age <= 55)) && f.preg !== false,
        why: '非典型表現很常見；症狀可類似腸胃或泌尿道疾病。約三分之一沒有已知危險因子。',
        rules: [
          { f: 'preg', want: true, s: '懷孕可能性存在', decisive: true },
          { f: 'vagbleed', want: true, s: '陰道出血' },
          { f: 'syncope', want: true, s: '暈厥、頭暈或低灌流' },
          { f: 'site', any: ['pelvis', 'rlq', 'llq'], s: '下腹或骨盆痛', weak: true }
        ],
        against: [],
        ask: [
          { q: '最後一次月經？陰道出血？肩尖痛、頭暈或暈厥？', why: '異位妊娠可有多種症狀，較少見的症狀仍可能重要', refs: ['NICE_NG126'] }
        ],
        tests: [
          { t: '懷孕檢測（尿液或血清 hCG）', purpose: '確立或排除懷孕',
            note: '育齡女性即使症狀不典型也應驗孕，即使使用可靠避孕方式。', refs: ['NICE_NG126', 'AFP2023ABD'], yield: 'high' },
          { t: '經陰道超音波', purpose: 'hCG 陽性時確認著床位置', refs: ['AFP2023ABD'], yield: 'high' }
        ],
        reassess: 'hCG 陽性但未能確認子宮內或異位妊娠者，屬「位置不明之妊娠」，不能排除異位妊娠，需追蹤至釐清。'
      },
      {
        id: 'acs', name: '急性冠心症（腹外病因）', danger: true,
        showIf: f => f.site === null || ['epi', 'ruq', 'luq'].includes(f.site) || f.chest === true,
        why: '上腹不適可以是急性冠心症的表現；只追查腹內病因就會錯過。',
        rules: [
          { f: 'chest', want: true, s: '胸悶、冒冷汗或喘' },
          { f: 'site', any: ['epi'], s: '上腹痛' },
          { f: 'age', gte: 50, s: '年齡 ≥ 50', weak: true }
        ],
        against: [],
        ask: [
          { q: '上腹痛是否可能為心因性？', why: '心絞痛、心肌梗塞與心包膜炎屬上腹痛之鑑別', refs: ['AFP2023ABD'] }
        ],
        tests: [
          { t: '12 導程心電圖', purpose: '辨識 STEMI',
            note: '疑似急性冠心症，應於首次醫療接觸 10 分鐘內完成並判讀（Class 1）。',
            refs: ['ACS2025'], yield: 'high' }
        ],
        reassess: '單次初始心電圖或 troponin 正常不代表已排除；依指引序列評估。'
      },
      {
        id: 'bowel', name: '腸阻塞（含絞扼）', danger: true, regions: ['diffuse', 'epi'],
        why: '絞扼或缺血時需緊急手術；沒有手術史也可能發生。',
        rules: [
          { f: 'distend', want: true, s: '腹脹或停止排氣排便（LR+ 5.8）' },
          { f: 'surg', want: true, s: '腹部手術史或疝氣（LR+ 3.9）' },
          { f: 'site', any: ['diffuse'], s: '臍周或瀰漫性疼痛', weak: true }
        ],
        against: [],
        ask: [
          { q: '有無腹部手術、放射治療、克隆氏症或惡性腫瘤病史？', why: '應提高對小腸阻塞之懷疑', refs: ['AFP2023ABD'] }
        ],
        tests: [
          { t: '電腦斷層（含顯影）', purpose: '確認阻塞並評估缺血',
            note: '非局部化之急性腹痛通常需做含顯影之腹骨盆電腦斷層。', refs: ['AFP2023ABD'], yield: 'high' }
        ],
        reassess: '腸音消失為警訊，但腸音在診斷上角色有限；高度懷疑比理學發現更重要。'
      },
      {
        id: 'chol', name: '急性膽管炎', danger: true, regions: ['ruq', 'epi'],
        showIf: f => f.site === null || ['ruq', 'epi'].includes(f.site) || f.jaundice === true,
        why: '可快速進展為敗血性休克；需要的是引流而非只有抗生素。',
        rules: [
          { f: 'jaundice', want: true, s: '黃疸' },
          { f: 'temp', gte: 38, s: '發燒' },
          { f: 'site', any: ['ruq'], s: '右上腹痛', weak: true }
        ],
        against: [],
        ask: [
          { q: '有無黃疸、發燒、全身不適？', why: '膽管炎屬右上腹與上腹痛之鑑別', refs: ['AFP2023ABD'] }
        ],
        tests: [
          { t: '右上腹超音波與肝膽指數', purpose: '評估膽道阻塞', refs: ['AFP2023ABD'], yield: 'high' }
        ],
        reassess: '合併低血壓或意識改變者，依敗血性休克路徑同步處置。'
      }
    ]
  },

  // ===================================================================
  // 喘
  // ===================================================================
  dysp: {
    name: '喘',
    icon: '◌',
    tagline: '先穩定呼吸與循環；常見不代表輕症，三分之二需要住院',
    primer: '亞太急診以喘為主訴者，下呼吸道感染、心衰竭、COPD 與氣喘合計逾六成，但 64% 需住院、院內死亡率 6%。',
    // CURB-65：尿素 >7 mmol/L 換算為 BUN >19.6 mg/dL（尿素 mmol/L ≈ BUN mg/dL × 0.357）
    derive: f => {
      const parts = [
        f.confusion,
        f.bun === null ? null : f.bun > 19.6,
        f.rr === null ? null : f.rr >= 30,
        (f.sbp === null && f.dbp === null) ? null : ((f.sbp !== null && f.sbp < 90) || (f.dbp !== null && f.dbp <= 60)),
        f.age === null ? null : f.age >= 65
      ];
      const known = parts.filter(p => p !== null);
      return {
        curb65: known.length === 5 ? known.filter(Boolean).length : null,
        curb65min: known.filter(Boolean).length,
        curb65miss: 5 - known.length
      };
    },
    shows: [
      { k: 'curb65', label: 'CURB-65', fmt: (v, d) => v !== null ? `${v} 分` : `≥${d.curb65min} 分（缺 ${d.curb65miss} 項）` }
    ],
    groups: [
      { g: '基本資料', fields: [
        { id: 'age', label: '年齡', type: 'num', unit: '歲' },
        { id: 'sex', label: '生理性別', type: 'choice', opts: ['男', '女'] }
      ]},
      { g: '生命徵象', fields: [
        { id: 'sbp', label: '收縮壓', type: 'num', unit: 'mmHg' },
        { id: 'dbp', label: '舒張壓', type: 'num', unit: 'mmHg' },
        { id: 'hr', label: '心跳', type: 'num', unit: '/min' },
        { id: 'rr', label: '呼吸速率', type: 'num', unit: '/min' },
        { id: 'spo2', label: 'SpO₂', type: 'num', unit: '%' },
        { id: 'temp', label: '體溫', type: 'num', unit: '°C', step: 0.1 },
        { id: 'vt', label: '量測時間', type: 'text', ph: '例如 03:20' }
      ]},
      { g: '危險徵象', core: true, fields: [
        { id: 'anaexp', label: '接觸可能過敏原後急性發作，合併皮膚或黏膜症狀', type: 'tri' },
        { id: 'chestpain', label: '胸痛、胸悶或冒冷汗', type: 'tri' },
        { id: 'confusion', label: '新發意識混亂', type: 'tri', hint: 'CURB-65 之一項' }
      ]},
      { g: '病史與症狀', core: true, fields: [
        { id: 'fever_cough', label: '發燒、咳嗽或膿痰', type: 'tri' },
        { id: 'wheeze', label: '喘鳴', type: 'tri' },
        { id: 'pleuritic', label: '突發單側胸痛', type: 'tri' },
        { id: 'edema', label: '下肢水腫或端坐呼吸', type: 'tri' },
        { id: 'dvt', label: '近期手術、長期臥床、癌症或單側下肢腫脹', type: 'tri' },
        { id: 'copdhx', label: 'COPD 病史', type: 'tri' },
        { id: 'asthmahx', label: '氣喘病史', type: 'tri' },
        { id: 'hfhx', label: '心衰竭病史', type: 'tri' }
      ]},
      { g: '檢驗', fields: [
        { id: 'bun', label: 'BUN', type: 'num', unit: 'mg/dL', hint: 'CURB-65 以尿素 >7 mmol/L 計，約等於 BUN >19.6 mg/dL' }
      ]}
    ],
    redflags: [
      { if: f => f.sbp !== null && f.sbp < 90,
        msg: '收縮壓 < 90 mmHg：立即做床邊心臟超音波，區分高風險肺栓塞與其他致命情況', refs: ['ESC_PE2019'] },
      { if: f => f.anaexp === true,
        msg: '疑似過敏性休克：成人腎上腺素 500 微克肌肉注射，呼吸道、呼吸或循環問題持續時 5 分鐘後重複；類固醇不再作為常規緊急治療',
        refs: ['RCUK_ANA2021'] },
      { if: f => f.chestpain === true,
        msg: '合併胸痛、胸悶或冒冷汗：疑似急性冠心症，首次醫療接觸 10 分鐘內完成並判讀 12 導程心電圖', refs: ['ACS2025'] },
      { if: f => f.curb65 !== null && f.curb65 >= 3,
        msg: 'CURB-65 ≥ 3：考慮住院，必要時轉重症照護（30 天死亡率 3 分約 17%，4 分約 41.5%）',
        refs: ['NICE_NG250', 'CURB65_2003'] }
    ],
    dx: [
      {
        id: 'lrti', name: '下呼吸道感染／肺炎', danger: false,
        common: { rank: 1, ref: 'AANZDEM2017', note: '亞太急診喘最常見：下呼吸道感染 20.2%' },
        why: '急診喘最常見的原因。嚴重度以 CURB-65 併同臨床判斷分層，決定照護地點。',
        rules: [
          { f: 'fever_cough', want: true, s: '發燒、咳嗽或膿痰' },
          { f: 'temp', gte: 38, s: '發燒' },
          { f: 'rr', gte: 30, s: '呼吸速率 ≥ 30' }
        ],
        against: [],
        ask: [
          { q: '計算 CURB-65：意識混亂、BUN、呼吸速率、血壓、年齡', why: '在醫院診斷之社區型肺炎，以 CURB-65 併同臨床判斷決定照護地點', refs: ['NICE_NG250', 'CURB65_2003'] }
        ],
        tests: [],
        reassess: '共病、懷孕與社會支持可改變分數之判讀；出院者須給予返診警訊衛教。',
        dispo: {
          admit: ['CURB-65 ≥ 3：住院，必要時轉重症照護',
                  'CURB-65 = 2：留觀或住院（英國另有虛擬病房、居家醫院等選項）'],
          home: ['CURB-65 = 0–1：可出院返家，轉介門診追蹤並給予返診警訊衛教'],
          refs: ['NICE_NG250']
        }
      },
      {
        id: 'hf', name: '急性心衰竭', danger: false,
        common: { rank: 2, ref: 'AANZDEM2017', note: '亞太急診喘第二常見：心衰竭 14.9%' },
        why: '常見且常與肺炎、COPD 並存；「找到一個原因」不代表沒有第二個。',
        rules: [
          { f: 'hfhx', want: true, s: '心衰竭病史' },
          { f: 'edema', want: true, s: '下肢水腫或端坐呼吸' }
        ],
        against: [], ask: [], tests: [],
        reassess: '治療反應不如預期時，回頭檢視肺栓塞、急性冠心症與感染。'
      },
      {
        id: 'copd', name: 'COPD 急性惡化', danger: false,
        common: { rank: 3, ref: 'AANZDEM2017', note: '亞太急診喘第三常見：COPD 13.6%' },
        why: '常見，但惡化的誘因（感染、肺栓塞、心衰竭、氣胸）需要另外尋找。',
        rules: [
          { f: 'copdhx', want: true, s: 'COPD 病史' },
          { f: 'wheeze', want: true, s: '喘鳴' }
        ],
        against: [], ask: [], tests: [],
        reassess: '已知 COPD 不代表這次一定是 COPD 惡化。'
      },
      {
        id: 'asthma', name: '氣喘急性發作', danger: false,
        common: { rank: 4, ref: 'AANZDEM2017', note: '亞太急診喘第四常見：氣喘 12.7%' },
        why: '常見；需與過敏性休克之支氣管痙攣區分。',
        rules: [
          { f: 'asthmahx', want: true, s: '氣喘病史' },
          { f: 'wheeze', want: true, s: '喘鳴' }
        ],
        against: [
          { f: 'anaexp', want: true, s: '接觸過敏原後急性發作合併皮膚黏膜症狀，應先以過敏性休克處置' }
        ],
        ask: [], tests: [],
        reassess: '對治療反應不佳者，考慮其他診斷。'
      },
      {
        id: 'pe', name: '肺栓塞', danger: true,
        why: '症狀可以只有喘；血流動力不穩者為高風險，需立即辨識。',
        rules: [
          { f: 'dvt', want: true, s: '近期手術、長期臥床、癌症或單側下肢腫脹' },
          { f: 'pleuritic', want: true, s: '突發單側胸痛' },
          { f: 'hr', gte: 100, s: '心搏過速', weak: true }
        ],
        against: [],
        ask: [],
        tests: [
          { t: '床邊心臟超音波', purpose: '血流動力不穩時區分高風險肺栓塞與其他致命情況', refs: ['ESC_PE2019'], yield: 'high' }
        ],
        reassess: '血流動力穩定者確診後，依臨床表現、右心室大小或功能與生物標記進一步分層。',
        dispo: {
          admit: ['血流動力不穩，或有需住院之嚴重共病'],
          home: ['同時符合三項者可考慮提早出院、在家抗凝：(1) 早期死亡或嚴重併發症風險低；(2) 無需住院之嚴重共病；(3) 能確保門診照護與抗凝治療',
                 '分流工具可用 Hestia 或 PESI/sPESI；採 PESI/sPESI 時須另外評估在家治療之可行性'],
          refs: ['ESC_PE2019']
        }
      },
      {
        id: 'acs', name: '急性冠心症', danger: true,
        why: '喘可以是急性冠心症唯一的表現。',
        rules: [
          { f: 'chestpain', want: true, s: '胸痛、胸悶或冒冷汗' },
          { f: 'age', gte: 50, s: '年齡 ≥ 50', weak: true }
        ],
        against: [], ask: [],
        tests: [
          { t: '12 導程心電圖', purpose: '辨識 STEMI', note: '首次醫療接觸 10 分鐘內完成並判讀（Class 1）。', refs: ['ACS2025'], yield: 'high' }
        ],
        reassess: '單次心電圖正常不代表已排除。'
      },
      {
        id: 'ptx', name: '氣胸', danger: true,
        why: '突發單側胸痛合併喘時須考慮；合併血流動力不穩須想到張力性氣胸。',
        rules: [
          { f: 'pleuritic', want: true, s: '突發單側胸痛' }
        ],
        against: [], ask: [], tests: [],
        reassess: '不適合保守或門診處置者，考慮針頭抽吸或胸管引流。',
        dispo: {
          admit: ['症狀明顯、生理功能受損，或不適合保守、門診處置者：針頭抽吸或胸管引流'],
          home: ['原發性自發性氣胸且症狀輕微（無明顯疼痛或喘、無生理功能受損）：不論大小可考慮保守治療',
                 '支持良好且院內具備專業與追蹤機制：可考慮門診式處置'],
          refs: ['BTS_PLEURAL2023']
        }
      },
      {
        id: 'ana', name: '過敏性休克', danger: true,
        why: '腎上腺素延遲是主要的可避免死因。',
        rules: [
          { f: 'anaexp', want: true, s: '接觸過敏原後急性發作合併皮膚黏膜症狀', decisive: true },
          { f: 'wheeze', want: true, s: '喘鳴' },
          { f: 'sbp', lte: 90, s: '低血壓' }
        ],
        against: [], ask: [],
        tests: [
          { t: '腎上腺素肌肉注射', purpose: '第一線治療',
            note: '成人與 12 歲以上：1 mg/mL 腎上腺素 500 微克（0.5 mL）肌注；問題持續時 5 分鐘後重複。',
            caveat: '類固醇不再作為常規緊急治療。', refs: ['RCUK_ANA2021'], yield: 'high' }
        ],
        reassess: '所有病人出院前應由資深醫師評估，並衛教雙相反應與返診方式。',
        dispo: {
          admit: ['需要超過 2 劑腎上腺素、嚴重氣喘或嚴重呼吸窘迫、過敏原可能持續吸收、深夜就診或就醫不便：症狀緩解後至少觀察 12 小時',
                  '需要 2 劑肌注腎上腺素或曾有雙相反應：至少觀察 6 小時'],
          home: ['發作 30 分鐘內單劑且 5–10 分鐘內反應良好、症狀完全緩解、備有自行注射筆並受訓、出院後有人照看：症狀緩解後觀察 2 小時可考慮出院'],
          refs: ['RCUK_ANA2021']
        }
      },
      {
        id: 'sepsis', name: '敗血症（肺部或其他來源）', danger: true,
        why: '喘合併發燒或意識改變時，須同時處理灌流不足。',
        rules: [
          { f: 'fever_cough', want: true, s: '發燒、咳嗽或膿痰' },
          { f: 'confusion', want: true, s: '新發意識混亂' },
          { f: 'sbp', lte: 90, s: '低血壓' },
          { f: 'rr', gte: 22, s: '呼吸急促', weak: true }
        ],
        against: [], ask: [],
        tests: [
          { t: '血液培養', purpose: '病原鑑定', caveat: '儘早採檢、理想上在抗生素之前，但不得延誤給藥。', refs: ['SSC2026'], yield: 'high' },
          { t: '乳酸', purpose: '評估灌流', caveat: '疑敗血症應檢測，但早期可能正常。', refs: ['AFP2023ABD'], yield: 'mid' }
        ],
        reassess: '1 小時內給抗生素；敗血症誘發低灌流者 3 小時內至少 30 mL/kg 晶體液並個別化再評估。',
        dispo: { admit: ['敗血性休克或敗血症：住院（必要時加護），1 小時內抗生素並持續復甦與再評估'], refs: ['SSC2026'] }
      },
      {
        id: 'metab', name: '代謝性酸中毒之代償呼吸（Kussmaul）', danger: false,
        why: '深快呼吸可以是代謝性酸中毒的代償，而非肺部疾病。請改用「代謝性酸中毒」分頁評估。',
        rules: [
          { f: 'rr', gte: 30, s: '呼吸速率 ≥ 30', weak: true }
        ],
        against: [], ask: [], tests: [],
        reassess: '血液氣體分析可區分。'
      }
    ]
  },

  // ===================================================================
  // 代謝性酸中毒（含嚴重中毒）
  // ===================================================================
  acid: {
    name: '代謝性酸中毒',
    icon: '◇',
    tagline: '先算陰離子隙；病因可並存，嚴重中毒依 EXTRIP 門檻決定體外清除',
    primer: '陰離子隙、白蛋白校正值與滲透壓間隙由本頁自動計算；任一所需數值缺漏即不計算，不以預設值代入。',
    derive: f => {
      const d = { ag: null, agc: null, osmgap: null, mixed: null };
      if (f.na !== null && f.cl !== null && f.hco3 !== null) {
        d.ag = f.na - (f.cl + f.hco3);
        d.agc = f.alb !== null ? d.ag + 2.5 * (4.0 - f.alb) : null;
      }
      if (f.na !== null && f.glu !== null && f.bun !== null && f.osm !== null) {
        const calc = 2 * f.na + f.glu / 18 + f.bun / 2.8 + (f.etoh !== null ? f.etoh / 3.7 : 0);
        d.osmgap = f.osm - calc;
      }
      const g = d.agc !== null ? d.agc : d.ag;
      d.mixed = (g !== null && f.ph !== null) ? (g >= 16 && f.ph > 7.40) : null;
      d.agx = g;
      return d;
    },
    shows: [
      { k: 'ag', label: '陰離子隙', fmt: v => v !== null ? v.toFixed(0) : '需 Na、Cl、HCO₃' },
      { k: 'agc', label: '白蛋白校正', fmt: v => v !== null ? v.toFixed(0) : '需 Albumin' },
      { k: 'osmgap', label: '滲透壓間隙', fmt: v => v !== null ? v.toFixed(0) : '需 Na、血糖、BUN、Osm' }
    ],
    groups: [
      { g: '基本資料', fields: [
        { id: 'age', label: '年齡', type: 'num', unit: '歲' },
        { id: 'sex', label: '生理性別', type: 'choice', opts: ['男', '女'] }
      ]},
      { g: '生命徵象', fields: [
        { id: 'sbp', label: '收縮壓', type: 'num', unit: 'mmHg' },
        { id: 'hr', label: '心跳', type: 'num', unit: '/min' },
        { id: 'rr', label: '呼吸速率', type: 'num', unit: '/min' },
        { id: 'temp', label: '體溫', type: 'num', unit: '°C', step: 0.1 },
        { id: 'ams', label: '意識改變', type: 'tri' }
      ]},
      { g: '血液氣體與電解質', core: true, fields: [
        { id: 'ph', label: 'pH', type: 'num', step: 0.01 },
        { id: 'hco3', label: 'HCO₃', type: 'num', unit: 'mmol/L' },
        { id: 'na', label: 'Na', type: 'num', unit: 'mmol/L' },
        { id: 'cl', label: 'Cl', type: 'num', unit: 'mmol/L' },
        { id: 'k', label: 'K', type: 'num', unit: 'mmol/L', step: 0.1 },
        { id: 'alb', label: 'Albumin', type: 'num', unit: 'g/dL', step: 0.1 }
      ]},
      { g: '其他檢驗', core: true, fields: [
        { id: 'lactate', label: 'Lactate', type: 'num', unit: 'mmol/L', step: 0.1 },
        { id: 'glu', label: '血糖', type: 'num', unit: 'mg/dL' },
        { id: 'bhb', label: 'β-hydroxybutyrate', type: 'num', unit: 'mmol/L', step: 0.1 },
        { id: 'osm', label: '血清滲透壓（實測）', type: 'num', unit: 'mOsm/kg' },
        { id: 'bun', label: 'BUN', type: 'num', unit: 'mg/dL' },
        { id: 'cr', label: 'Creatinine', type: 'num', unit: 'mg/dL', step: 0.1 },
        { id: 'etoh', label: '血中乙醇', type: 'num', unit: 'mg/dL' },
        { id: 'sal', label: '水楊酸濃度', type: 'num', unit: 'mg/dL' }
      ]},
      { g: '病史與暴露', core: true, fields: [
        { id: 'ingest', label: '疑似誤食、服毒或飲用來路不明酒類', type: 'tri' },
        { id: 'visual', label: '視力模糊、畏光或「像下雪」', type: 'tri' },
        { id: 'tinnitus', label: '耳鳴或聽力下降', type: 'tri' },
        { id: 'aspirin', label: '使用或可能過量 aspirin／水楊酸', type: 'tri' },
        { id: 'metformin', label: '使用 metformin', type: 'tri' },
        { id: 'sglt2', label: '使用 SGLT2 抑制劑', type: 'tri' },
        { id: 'dm', label: '已知糖尿病', type: 'tri' },
        { id: 'infection', label: '臨床疑似感染', type: 'tri' }
      ]}
    ],
    redflags: [
      { if: f => f.ph !== null && f.ph <= 7.15 && (f.ingest === true || f.visual === true),
        msg: 'pH ≤ 7.15 合併疑似毒性酒精：EXTRIP 建議體外清除（甲醇）；照會毒物科與腎臟科', refs: ['E_MEOH'] },
      { if: f => f.agx !== null && f.agx > 24 && (f.ingest === true || f.visual === true),
        msg: '陰離子隙 > 24 合併疑似毒性酒精：EXTRIP 建議體外清除（甲醇）', refs: ['E_MEOH'] },
      { if: f => f.osmgap !== null && f.osmgap > 50,
        msg: '滲透壓間隙 > 50：疑乙二醇中毒時，EXTRIP 建議體外清除', refs: ['E_EG'] },
      { if: f => f.metformin === true && ((f.lactate !== null && f.lactate > 20) || (f.ph !== null && f.ph <= 7.0)),
        msg: 'Metformin 併 lactate > 20 或 pH ≤ 7.0：EXTRIP 建議體外清除（1D）', refs: ['E_MET'] },
      { if: f => f.metformin === true && !((f.lactate !== null && f.lactate > 20) || (f.ph !== null && f.ph <= 7.0))
                 && ((f.lactate !== null && f.lactate > 15) || (f.ph !== null && f.ph <= 7.1)),
        msg: 'Metformin 併 lactate > 15 或 pH ≤ 7.1：EXTRIP 建議考慮體外清除（2D）', refs: ['E_MET'] },
      { if: f => f.sal !== null && f.sal > 100,
        msg: '水楊酸 > 100 mg/dL：EXTRIP 建議體外清除（1D）', refs: ['E_SAL'] },
      { if: f => (f.aspirin === true || f.tinnitus === true || (f.sal !== null && f.sal > 0)) && f.ams === true,
        msg: '疑似水楊酸中毒合併意識改變：EXTRIP 建議體外清除（1D）', refs: ['E_SAL'] },
      { if: f => f.aspirin === true || f.tinnitus === true || f.mixed === true,
        msg: '疑似水楊酸中毒：避免插管；若無法避免，先給碳酸氫鈉、插管後維持插管前之呼吸速率，並同時啟動透析', refs: ['ACMT_SAL'] },
      { if: f => f.k !== null && f.k < 3.5 && (f.dm === true || (f.bhb !== null && f.bhb >= 3)),
        msg: 'K < 3.5 mmol/L：若為酮酸中毒，先以 10 mmol/h 補鉀並暫緩胰島素', refs: ['ADA2024'] }
    ],
    dx: [
      {
        id: 'dka', name: '糖尿病酮酸中毒（含血糖正常型）', danger: true,
        why: '診斷看 BHB 而非血糖；使用 SGLT2 抑制劑者血糖可以正常。',
        rules: [
          { f: 'bhb', gte: 3, s: 'BHB ≥ 3.0 mmol/L', decisive: true },
          { f: 'dm', want: true, s: '已知糖尿病' },
          { f: 'sglt2', want: true, s: '使用 SGLT2 抑制劑' },
          { f: 'glu', gte: 200, s: '血糖 ≥ 200 mg/dL', weak: true },
          { f: 'hco3', lte: 17.9, s: 'HCO₃ < 18' }
        ],
        against: [],
        ask: [],
        tests: [
          { t: '血清 β-hydroxybutyrate', purpose: '診斷與緩解判定', note: '診斷 ≥3.0、緩解 <3.0 mmol/L；陰離子隙不再為第一線診斷標準。', refs: ['ADA2024'], yield: 'high' },
          { t: '血鉀', purpose: '決定能否開始胰島素', caveat: 'K <3.5 先補鉀並暫緩胰島素。', refs: ['ADA2024'], yield: 'high' }
        ],
        reassess: '緩解條件：BHB <3.0、pH >7.3、HCO₃ >15 mmol/L。',
        dispo: {
          admit: ['重度（BHB >6、pH <7.0 或 HCO₃ <10）：加護病房', '中度：降階病房（step-down）',
                  '輕度（BHB ≤6、pH >7.25、HCO₃ ≥15）：一般病房'],
          refs: ['ADA2024']
        }
      },
      {
        id: 'lacsep', name: '乳酸中毒：敗血症／灌流不足', danger: true,
        why: '最常見也最不可漏；即使找到其他病因，灌流不足仍須同步處理。',
        rules: [
          { f: 'infection', want: true, s: '臨床疑似感染' },
          { f: 'lactate', gte: 4, s: 'Lactate ≥ 4' },
          { f: 'sbp', lte: 90, s: '低血壓' }
        ],
        against: [], ask: [],
        tests: [
          { t: '血液培養', purpose: '病原鑑定', caveat: '儘早採檢、理想上在抗生素之前，但不得延誤給藥。', refs: ['SSC2026'], yield: 'high' }
        ],
        reassess: '1 小時內抗生素；低灌流者 3 小時內至少 30 mL/kg 晶體液並個別化再評估。',
        dispo: { admit: ['敗血性休克或敗血症：住院（必要時加護），持續復甦與再評估'], refs: ['SSC2026'] }
      },
      {
        id: 'mala', name: 'Metformin 相關乳酸中毒（MALA）', danger: true,
        why: '台灣多數院所無法急測 metformin 濃度，屬臨床診斷；與敗血症可並存。',
        rules: [
          { f: 'metformin', want: true, s: '使用 metformin' },
          { f: 'lactate', gte: 5, s: 'Lactate ≥ 5' },
          { f: 'cr', gte: 1.5, s: '腎功能下降' }
        ],
        against: [], ask: [],
        tests: [
          { t: '血液透析評估', purpose: '清除乳酸與 metformin',
            note: 'lactate >20 或 pH ≤7.0 建議（1D）；>15 或 ≤7.1 建議考慮（2D）；休克、腎功能受損、肝衰竭、意識下降會下修門檻。',
            caveat: '首選含碳酸氫鹽透析液之間歇性血液透析；停止門檻 lactate <3 且 pH >7.35。', refs: ['E_MET'], yield: 'high' }
        ],
        reassess: '同時覆蓋感染源。',
        dispo: { admit: ['符合體外清除門檻者：住院並照會腎臟科安排透析'], refs: ['E_MET'] }
      },
      {
        id: 'toxalc', name: '毒性酒精中毒（甲醇／乙二醇）', danger: true,
        why: '滲透壓間隙正常不能排除（晚期母體已代謝完）；視覺症狀指向甲醇。',
        rules: [
          { f: 'visual', want: true, s: '視力模糊或「像下雪」', decisive: true },
          { f: 'ingest', want: true, s: '疑似誤食或來路不明酒類' },
          { f: 'osmgap', gte: 20, s: '滲透壓間隙偏高' },
          { f: 'agx', gte: 24, s: '陰離子隙 ≥ 24' }
        ],
        against: [], ask: [],
        tests: [
          { t: '體外清除評估（甲醇）', purpose: '依 EXTRIP 門檻',
            note: '昏迷、癲癇、新發視覺缺損、pH ≤7.15、陰離子隙 >24；透析期間持續 ADH 阻斷劑與 folate。', refs: ['E_MEOH'], yield: 'high' },
          { t: '體外清除評估（乙二醇）', purpose: '依 EXTRIP 2023 門檻',
            note: '滲透壓間隙 >50、陰離子隙 >27，或昏迷、癲癇、急性腎損傷。', refs: ['E_EG'], yield: 'high' }
        ],
        reassess: '無法急測濃度時，以臨床與酸鹼數據決定。',
        dispo: { admit: ['疑似毒性酒精中毒：住院，照會毒物科與腎臟科評估體外清除'], refs: ['E_MEOH', 'E_EG'] }
      },
      {
        id: 'sal', name: '水楊酸中毒', danger: true,
        why: '呼吸性鹼中毒與代謝性酸中毒併存是典型表現；插管是最常見的醫源性致命錯誤。',
        rules: [
          { f: 'aspirin', want: true, s: '使用或可能過量 aspirin' },
          { f: 'tinnitus', want: true, s: '耳鳴或聽力下降' },
          { f: 'mixed', want: true, s: '高陰離子隙合併 pH > 7.40（混合型）', decisive: true },
          { f: 'sal', gte: 30, s: '水楊酸濃度偏高' }
        ],
        against: [], ask: [],
        tests: [
          { t: '水楊酸濃度（追蹤至下降）', purpose: '決定體外清除',
            note: '>100 mg/dL；腎功能受損時 >90；意識改變；新發需氧氣之低血氧（1D）。pH ≤7.20 建議考慮（2D）。', refs: ['E_SAL'], yield: 'high' },
          { t: '尿液鹼化', purpose: '增加排除', caveat: '目標尿 pH 7.5–8.0；低血鉀會使鹼化失效。', refs: ['ACMT_SAL'], yield: 'high' }
        ],
        reassess: '停止透析門檻 <19 mg/dL 且臨床改善。',
        dispo: { admit: ['疑似水楊酸中毒：住院，照會毒物科；符合 EXTRIP 門檻者安排血液透析'], refs: ['E_SAL'] }
      },
      {
        id: 'uremia', name: '尿毒性酸中毒', danger: false,
        why: '須為明確的重度腎功能不全，且已排除其他高陰離子隙病因。',
        rules: [
          { f: 'cr', gte: 4, s: 'Creatinine ≥ 4' },
          { f: 'bun', gte: 60, s: 'BUN 明顯上升', weak: true }
        ],
        against: [], ask: [], tests: [],
        reassess: '不要因為腎功能差就停止尋找其他病因。'
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
      { if: f => f.temp !== null && f.temp < 36 && (f.chemo === true || f.immuno === true),
        msg: '免疫低下病人體溫偏低：嚴重感染與免疫低下者可能不發燒，甚至以低體溫表現', refs: ['TSEM2018FEVER'] },
      { if: f => f.chemo === true,
        msg: '六週內化療：依發熱性嗜中性白血球低下處理，檢傷後儘速評估，1 小時內給予首劑經驗性抗生素，診斷流程不得延誤給藥',
        refs: ['ASCOIDSA_FN', 'AGIHO2024'] },
      { if: f => f.sbp !== null && f.sbp < 90,
        msg: '收縮壓 < 90 mmHg：依敗血性休克處置，立即給予抗生素、理想上 1 小時內，並開始輸液復甦',
        refs: ['SSC2026'] },
      { if: f => f.skinpain === true,
        msg: '軟組織疼痛遠超外觀：壞死性筋膜炎之警訊（不成比例劇痛、擴散迅速、出血性水泡）',
        refs: ['TSEM2018FEVER'] },
      { if: f => f.neuro === true,
        msg: '發燒併意識改變、頸部僵硬或劇烈頭痛：須考慮腦膜炎',
        refs: ['TSEM2018FEVER'] },
    ],
    dx: [
      {
        id: 'fn', name: '發熱性嗜中性白血球低下', danger: true,
        dispo: { home: ['CISNE（急診較 MASCC 適用）判定低風險：可考慮門診治療；須於檢傷後 1 小時內給首劑經驗性抗生素，並觀察至少 4 小時再離院'],
                 refs: ['ASCOIDSA_FN', 'AGIHO2024'] },
        why: '時間敏感度最高的發燒情境。治療的啟動不應等待血球報告。',
        rules: [
          { f: 'chemo', want: true, s: '六週內接受過化學治療' },
          { f: 'temp', gte: 38, s: '發燒' },
          { f: 'device', want: true, s: '體內人工裝置（可能之感染源）' }
        ],
        against: [],
        ask: [
          { q: '最後一次化療是什麼時候？用的是什麼方案？', why: '決定白血球最低點的時間窗', refs: ['ASCOIDSA_FN'] },
          { q: '有無人工血管或中央靜脈導管？', why: '導管相關感染為主要來源', refs: ['AGIHO2024'] },
          { q: '有無其他醫療相關暴露或免疫抑制藥物（類固醇、免疫抑制劑）？', why: '影響病原與抗藥性風險', refs: ['TSEM2018FEVER'] }
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
        dispo: { admit: ['敗血性休克或敗血症：住院（必要時加護），1 小時內抗生素並持續復甦與再評估'], refs: ['SSC2026'] },
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
          { t: '乳酸', purpose: '評估灌流', caveat: '疑敗血症應檢測，但早期可能正常。', refs: ['AFP2023ABD'], yield: 'mid' }
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
          { q: '皮膚病灶是否快速擴散？有無出血性水泡？疼痛是否與外觀不成比例？', why: '壞死性筋膜炎之臨床警訊', refs: ['TSEM2018FEVER'] },
          { q: '有無心搏過速、尿量減少或意識變化？', why: '進展為全身性嚴重感染之徵象', refs: ['TSEM2018FEVER'] }
        ],
        tests: [
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
        ask: [
          { q: '有無頭痛、噴射狀嘔吐、懼光、頸部痠痛或意識變化？', why: '腦膜炎之臨床表現', refs: ['TSEM2018FEVER'] },
          { q: '頸部僵硬？搖頭是否加劇頭痛？Kernig、Brudzinski 徵象？', why: '腦膜炎之理學檢查重點', refs: ['TSEM2018FEVER'] }
        ],
        tests: [
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
          { q: '近期旅遊、職業、特殊感染接觸與群聚（TOCC）？', why: '發燒病史之必問項目；未問則旅遊相關感染不會進入鑑別', refs: ['TSEM2018FEVER'] }
        ],
        tests: [
        ],
        reassess: '旅遊史未問，此診斷就不會出現在鑑別清單上——這是本項的主要風險。'
      },
      {
        id: 'common', name: '一般社區感染（多為病毒、自限性）', danger: false,
        dispo: { home: ['符合病毒感染條件且無併發症：可出院於門診追蹤，並衛教如何自我觀察併發症徵象'], refs: ['TSEM2018FEVER'] },
        common: { rank: 1, ref: 'TSEM2018FEVER', note: '健康成人發燒多數由病毒引起且為自限性病程' },
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
        ask: [
          { q: '是否具典型上呼吸道或腸胃炎症狀、病程在可預期範圍、且無定位性細菌感染徵象？', why: '三項皆符合才考慮病毒感染；任一不符即應考慮細菌感染並進一步檢查', refs: ['TSEM2018FEVER'] }
        ],
        tests: [
        ],
        reassess: '若治療反應不如預期，應回頭檢視是否有未被發現的危險診斷。'
      }
    ]
  }
};
