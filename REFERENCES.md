# 文獻依據

**最後查證：2026-09-20**

本 repo 的兩個工具（`app.py` / AcidoScope、`nightshift3.html` / 值班 03:00）所引用的，
是各學會公開發表的原始聲明與系統性回顧，**不包含 UpToDate、Micromedex、DynaMed、
OpenEvidence 等訂閱資料庫的內容**。那些資料庫是有版權的二次文獻，其內容不得重製散布；
本專案引用的是它們所引用的上游出處。

程式與遊戲中的建議文字以 `[代號]` 標註對應下表。

---

## SSC2026 — Surviving Sepsis Campaign 2026

> Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and
> Septic Shock 2026. *Critical Care Medicine* / *Intensive Care Medicine*, 2026.
> <https://doi.org/10.1007/s00134-026-08361-1>

取代 2021 版，共 129 條建議、其中 46 條為全新。與本專案相關的變動：

| 項目 | 2026 版內容 |
|---|---|
| 初始輸液 | 敗血性休克或敗血症誘發之低灌流，**3 小時內至少 30 mL/kg** 晶體液；強調個別化與頻繁再評估，避免過量或不足 |
| 肥胖病人 | 以**理想或校正體重**計算輸液量，不用實際體重 |
| MAP 目標 | 一般成人 65 mmHg；**≥65 歲可設 60–65 mmHg**（條件式建議，新增），以減少升壓劑暴露 |
| 抗生素時機 | 敗血性休克或已確立之敗血症：立即給予，**理想上 1 小時內**（強建議）。僅為「可能敗血症」且無休克者，3 小時內 |
| 血液培養 | 儘早採檢，理想上在給抗生素之前 |
| 新增 | 復甦後的移除液體策略、抗生素最佳化、照護轉銜時的用藥整合 |

> **註**：本專案原先的文字曾寫「勿一律套用 30 mL/kg」。2026 版仍保留至少 30 mL/kg 的
> 建議，只是要求個別化，因此該段已改寫為「仍建議至少 30 mL/kg，但需個別化並頻繁再評估」。

---

## ADA2024 — 成人高血糖急症共識

> Hyperglycemic Crises in Adults With Diabetes: A Consensus Report (ADA / EASD /
> AACE / DTS / JBDS). *Diabetes Care* / *Diabetologia*, 2024.
> <https://pubmed.ncbi.nlm.nih.gov/38907161/>

對本專案影響最大的一份，因為它改動了 DKA 的**診斷邏輯**：

| 項目 | 2024 版內容 |
|---|---|
| 診斷（三項齊備） | **D**：血糖 ≥200 mg/dL **或已知糖尿病**　**K**：BHB ≥3.0 mmol/L 或尿酮 ≥2+　**A**：pH <7.3 或 HCO₃ <18 |
| 陰離子隙 | **不再列為第一線診斷標準**；僅在無法測酮體時具參考價值 |
| eDKA | 由「已知糖尿病」這一條涵蓋，不受血糖正常影響 |
| 起始胰島素的鉀門檻 | **K <3.5 mmol/L 先以 10 mmol/hr 補鉀並暫緩胰島素**（舊版為 3.3） |
| 胰島素 | 固定速率 0.1 U/kg/hr |
| Dextrose | 血糖 <250 mg/dL 即加 D5–D10 併行 |
| 緩解 | BHB <3.0 mmol/L、pH >7.3、HCO₃ >15 mmol/L 且臨床穩定 |
| 嚴重度 | 輕：BHB ≤6、pH >7.25、HCO₃ ≥15；重：BHB >6、pH <7.0、HCO₃ <10（需 ICU） |

---

## EXTRIP 系列

EXTRIP（EXtracorporeal TReatments In Poisoning）為跨國腎臟科、毒物科、重症與藥理學
專家組成，以改良式 Delphi 法產生共識，逾 30 個專業學會支持。
建議強度採 1（建議）／2（建議考慮），證據等級 A–D。

### E-MET — metformin（*Crit Care Med*, 2015）

<https://www.extrip-workgroup.org/metformin>

- 建議體外清除（1D）：lactate **>20 mmol/L** 或 **pH ≤7.0**
- 建議考慮（2D）：lactate **>15 mmol/L** 或 **pH ≤7.1**
- 下修門檻之共病：休克、腎功能受損（1D）；肝衰竭、意識下降（2D）
- 首選**含碳酸氫鹽透析液之間歇性 HD**（1D）；HD 不可得時可考慮 CRRT（2D）
- 停止門檻：lactate <3 mmol/L **且** pH >7.35（1D）

### E-MeOH — 甲醇（*Crit Care Med*, 2015）

<https://www.extrip-workgroup.org/methanol>

- 濃度門檻：併用 fomepizole **>700 mg/L**、併用 ethanol **>600 mg/L**、
  無 ADH 阻斷劑 **>500 mg/L**
- 臨床門檻：昏迷、癲癇、新發視覺缺損、**pH ≤7.15**、**AG >24 mmol/L**、
  解毒與支持治療下酸中毒仍持續
- 無法測濃度時，osm gap 可提供參考
- 停止門檻：<200 mg/L 且臨床改善。**透析期間 ADH 阻斷劑與 folate 不可停**

### E-EG — 乙二醇（*Critical Care*, 2023）

<https://pubmed.ncbi.nlm.nih.gov/36765419/>

EXTRIP 系列中**最新的一份改版**（前一版為 2015）。分析 226 篇文獻、446 名病人，
整體死亡率 18.7%。

- 不以攝入劑量單獨決定是否體外清除
- 併用 fomepizole：濃度 >50 mmol/L 或 **osm gap >50**
- 併用 ethanol：濃度 >50 mmol/L 或 osm gap >50
- **glycolate >12 mmol/L** 或 **AG >27 mmol/L**
- 或出現昏迷、癲癇、急性腎損傷

### E-SAL — 水楊酸（*Ann Emerg Med*, 2015）

<https://pubmed.ncbi.nlm.nih.gov/25986310/>

- 建議體外清除（1D）：**>100 mg/dL（7.2 mmol/L）**；腎功能受損時 **>90 mg/dL**；
  **意識改變**；**新發需氧氣之低血氧**；標準治療失敗
- 建議考慮（2D）：>90 mg/dL；腎功能受損時 >80 mg/dL；**pH ≤7.20**
- 首選間歇性 HD（1D）
- 停止門檻：<19 mg/dL（1.4 mmol/L）且臨床改善；無法測濃度時執行 4–6 小時（2D）

---

## ACMT-SAL — 水楊酸毒性處置要點

> Guidance Document: Management Priorities in Salicylate Toxicity.
> American College of Medical Toxicology, 2013.
> <https://www.acmt.net/wp-content/uploads/2022/06/PRS_130313_Management-Priorities-in-Salicylate-Toxicity.pdf>

遊戲中「插管＝有害處置」判定的原始出處：

- 插管與機械通氣可使水楊酸毒性**急遽惡化並增加死亡率**，除非以過度換氣與碳酸氫鈉
  維持正常或略偏鹼的 pH
- 考慮插管時即應同時呼叫緊急透析
- 若插管無法避免：**先給碳酸氫鈉，插管後比照插管前的呼吸速率／分鐘換氣量**
- 以水楊酸毒性為插管適應症時，**透析應優先於、或至少與通氣支持同時進行**
- 尿液鹼化目標 pH 7.5–8.0，可使排除增加 10 倍以上；低血鉀會使鹼化失效

---

## KDIGO — 急性腎損傷

> KDIGO Clinical Practice Guideline for Acute Kidney Injury.
> *Kidney International Supplements*, 2012. <https://kdigo.org/guidelines/acute-kidney-injury/>
>
> STARRT-AKI Investigators. Timing of Initiation of RRT in AKI. *NEJM* 2020.
> AKIKI Trial. *NEJM* 2016.

- **2012 版仍為現行正式版本。**
- KDIGO 2026 AKI/AKD 指引草案於 2026 年 3 月公開徵詢、5 月 11 日截止，
  截至本次查證日（2026-09-20）**尚未正式發表**。該版將把定義擴及 AKD、
  納入結構性生物標記、風險預測模型與電子警示，正式發表後需重新核對本文件。
- RRT 啟動時機：無危及生命指徵時，延後啟動不劣於早期啟動；依高鉀、容積過載、
  難治性酸血症、尿毒症狀決定，不以單一 pH 數值啟動。

---

## 維護方式

1. 每次核對指引後，更新本檔頂端與 `app.py` 中 `EVIDENCE_REVIEWED`、
   `nightshift3.html` 中 `EVIDENCE_REVIEWED` 三處日期。
2. 建議文字若引用新來源，於 `app.py` 的 `REFS` 與本檔同步新增條目，
   並在建議字串末尾加上 `[代號]`。
3. 待追蹤：KDIGO 2026 AKI/AKD 正式發表；EXTRIP 甲醇與水楊酸若比照乙二醇改版。

---

> ⚠️ 本專案為教學與決策輔助用途，不取代臨床判斷。所有劑量以院內藥典與毒物中心為準。
> 內容由臨床醫師負責核對，程式作者不對臨床結果負責。
