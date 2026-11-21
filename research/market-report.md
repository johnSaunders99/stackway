# 從第一個程式到第一份工作：先交付，再選專長

**全端的第一個投遞門檻，是能把一條使用流程從畫面帶到資料庫，再證明它壞了能修；不是先把所有框架學完。AI 基礎設施的門檻不同：會呼叫模型不等於會經營服務。** 本次 35 筆全端職缺有 26 筆提到 API，19 筆提到測試；33 筆 AI 基礎設施職缺有 28 筆提到 GPU、26 筆提到推論或模型部署、22 筆提到可觀測性。以作品驗收決定何時試投，以職缺正文決定下一塊該學什麼。例子：[SpruceID 新人職缺](https://www.ycombinator.com/companies/spruceid/jobs/xscY5WF-full-stack-software-engineer-new-grad-remote)、[趨勢科技 ML 平台職缺](https://tw.linkedin.com/jobs/view/staff-sr-ml-infrastructure-platform-engineer-at-trendai-4471279783)。

## 樣本怎麼來、數字怎麼讀

查核日 **2026-11-20**；納入期為 2025-06 至 2026-11 查核日。這是按地區及工作類型刻意抽取的 **68 筆個別職缺**，不是隨機抽樣或各地開缺量。以組織、職務、地點和工作內容檢視重複刊登；同企業不同職責可納入，例如可靠性與後端推論平台分開算。美國限境內遠端優先歸美國；另外設「遠端」比較明示跨國或特定境外遠端的條件。每筆只在一個市場計數。

| 市場 | 全端 | AI 基礎設施 | 解讀限制 |
|---|---:|---:|---|
| 台灣 | 6 | 4 | 以可公開讀全文的平台為主，跨國與科技業比重偏高。 |
| 香港 | 6 | 6 | 混有仲介案，雇主欄保留刊登單位，不把未具名客戶當另一職缺。 |
| 中國大陸 | 6 | 7 | 此組全部取自校園招聘，不能外推社會招聘的年資分布。 |
| 新加坡 | 5 | 7 | 有培訓名額，也有平台主管；不可由職稱假定工作資格。 |
| 美國 | 7 | 8 | 明確地區或工作權限制的遠端亦屬本組。 |
| 遠端比較組 | 5 | 1 | 既有全球招募也有限西班牙、加拿大者；僅一筆 AI，不足比較占比。 |

可重算的原始資料是 [jobs.csv](jobs.csv)；[job-evidence.csv](job-evidence.csv) 逐筆記錄時間依據及技能分類。時間依據按來源分為明示投遞起日、頁面所示刊登距今時間、或查核時可讀到職務正文及應徵入口（沒有代替求職者送件）。`date_seen` **不是**發布日，也不保證職缺此刻仍收件。已在期間內刊登但已截止者可採，例如[閱文的校招時段](https://www.nowcoder.com/jobs/detail/470178?urlSource=sitemap)；太舊且已關閉、僅有搜尋摘要、無職務正文、被導回公司首頁者不算。市場名採履職地點，中文職稱轉為繁體並保留辨識碼；不保存招募聯絡人資料。

每職缺每標籤至多一票。**主要／必備欄**包括雇主寫明的工作、基本條件與可擇一的技術例子；**僅加分欄**表示只在 preferred、加分或同義描述中看見。兩欄互斥，並非宣稱每個候選人都得會列出的每一種語言。同一項兼在兩欄算主要；混合句按可辨認的子句編碼。這是受控詞彙，不含職缺提及的每項技術，也不以框架暗推語言：例如 React 不自動算 JavaScript。SQL 標籤含明示的關聯式資料庫；API 含 RESTful、GraphQL、gRPC 等；網路含 RDMA 等互連。全端查詢常帶 React、AI 查詢常帶 GPU 或推論，會拉高這些詞；未列出不等於不重要。英文以明示能力為準，不因公告用英文就算要求。百分比四捨五入；課程技能權重用未四捨五入的比例：超過一半＝3，至少五分之一＝2，其餘＝1。不把少見工具當全體入場券。

### 全端開發（分母 35）

| 技能標籤 | 主要職責／基本條件 | 僅加分 | 不重複職缺 | 占本組 |
|---|---:|---:|---:|---:|
| `collaboration` | 27 | 0 | 27 | 77% |
| `react` | 25 | 2 | 27 | 77% |
| `api` | 25 | 1 | 26 | 74% |
| `typescript` | 19 | 1 | 20 | 57% |
| `testing` | 19 | 0 | 19 | 54% |
| `cloud` | 13 | 5 | 18 | 51% |
| `sql` | 17 | 1 | 18 | 51% |
| `cicd` | 12 | 5 | 17 | 49% |
| `nodejs` | 14 | 0 | 14 | 40% |
| `python` | 13 | 0 | 13 | 37% |
| `security` | 13 | 0 | 13 | 37% |
| `java` | 12 | 0 | 12 | 34% |
| `javascript` | 12 | 0 | 12 | 34% |
| `ai-assisted` | 11 | 0 | 11 | 31% |
| `docker` | 7 | 2 | 9 | 26% |
| `git` | 9 | 0 | 9 | 26% |
| `english` | 7 | 1 | 8 | 23% |
| `observability` | 8 | 0 | 8 | 23% |
| `vue` | 8 | 0 | 8 | 23% |
| `go` | 7 | 0 | 7 | 20% |
| `html-css` | 7 | 0 | 7 | 20% |
| `kubernetes` | 5 | 2 | 7 | 20% |
| `dsa` | 6 | 0 | 6 | 17% |
| `rag` | 2 | 3 | 5 | 14% |
| `nextjs` | 3 | 1 | 4 | 11% |
| `spring` | 4 | 0 | 4 | 11% |
| `distributed` | 3 | 0 | 3 | 9% |
| `networking` | 3 | 0 | 3 | 9% |
| `oncall` | 3 | 0 | 3 | 9% |
| `cpp` | 1 | 0 | 1 | 3% |
| `profiling` | 1 | 0 | 1 | 3% |

### AI 基礎設施（分母 33）

| 技能標籤 | 主要職責／基本條件 | 僅加分 | 不重複職缺 | 占本組 |
|---|---:|---:|---:|---:|
| `gpu` | 26 | 2 | 28 | 85% |
| `collaboration` | 25 | 1 | 26 | 79% |
| `model-serving` | 26 | 0 | 26 | 79% |
| `python` | 24 | 1 | 25 | 76% |
| `distributed` | 22 | 1 | 23 | 70% |
| `observability` | 22 | 0 | 22 | 67% |
| `cloud` | 19 | 2 | 21 | 64% |
| `kubernetes` | 18 | 2 | 20 | 61% |
| `networking` | 18 | 1 | 19 | 58% |
| `cuda` | 10 | 6 | 16 | 48% |
| `linux` | 15 | 0 | 15 | 45% |
| `pytorch` | 11 | 2 | 13 | 39% |
| `cpp` | 11 | 1 | 12 | 36% |
| `vllm` | 9 | 3 | 12 | 36% |
| `cicd` | 10 | 1 | 11 | 33% |
| `go` | 9 | 2 | 11 | 33% |
| `sglang` | 7 | 4 | 11 | 33% |
| `testing` | 10 | 0 | 10 | 30% |
| `docker` | 7 | 2 | 9 | 27% |
| `ml-pipelines` | 8 | 1 | 9 | 27% |
| `nccl` | 7 | 2 | 9 | 27% |
| `security` | 9 | 0 | 9 | 27% |
| `api` | 5 | 2 | 7 | 21% |
| `benchmarking` | 6 | 0 | 6 | 18% |
| `profiling` | 4 | 2 | 6 | 18% |
| `terraform` | 4 | 2 | 6 | 18% |
| `dsa` | 5 | 0 | 5 | 15% |
| `java` | 5 | 0 | 5 | 15% |
| `mlflow` | 3 | 2 | 5 | 15% |
| `english` | 3 | 1 | 4 | 12% |
| `oncall` | 3 | 0 | 3 | 9% |
| `slurm` | 1 | 2 | 3 | 9% |
| `sql` | 2 | 1 | 3 | 9% |
| `ai-assisted` | 1 | 0 | 1 | 3% |
| `rag` | 1 | 0 | 1 | 3% |
| `typescript` | 1 | 0 | 1 | 3% |

### 同一個連結，兩種查核

68 筆都透過研究瀏覽器開過個別職缺、讀到正文。另以一般 HTTP GET 重查：59 筆回傳 200，4 筆 JobsDB 對程式請求回傳 403 挑戰頁，5 筆 LinkedIn 回傳 429 流量限制。後九筆取材自公開可讀的職缺頁，不取自挑戰頁，也不宣稱程式重查成功；逐筆結果在證據檔。Cake 索引逾時、104 搜尋結果頁及僅顯示外框的 MyCareersFuture 頁面未計數；分別以公開的雇主貼文、JobsDB、SmartRecruiters 與公司職涯頁補足。此限制不影響課內資源：v1 的 265 處引用涵蓋 125 個不同網址；v2 的 505 處引用涵蓋 280 個。沿用原查核並打開新增頁面核對標題或正文，資源均有 HTTP 200 紀錄，詳見 [resource-checks.csv](resource-checks.csv)。

## 各地要調整的是哪一塊

- **台灣：** 全端六筆中 React 四筆，但同一種畫面背後可以是 [BizLink 的 Python／Django](https://tw.linkedin.com/jobs/view/%E5%85%A8%E7%AB%AF-%E5%BE%8C%E7%AB%AF%E9%96%8B%E7%99%BC%E5%B7%A5%E7%A8%8B%E5%B8%AB-at-bizlink-group-4480757705) 或 [Flexii 的 Java／Spring Boot](https://tw.linkedin.com/jobs/view/full-stack-engineer-react-%2B-spring-boot-at-flexii-4486340413)。後者明列工作英語、華語加分，不能反推所有台灣職缺都要用英語面試。AI 四筆中四筆提到監控；[鴻騰精密的 GPU 叢集管理](https://tw.linkedin.com/jobs/view/gpu-cluster-administrator-kubernetes-mlops-at-%E9%B4%BB%E9%A8%B0%E7%B2%BE%E5%AF%86-fit-foxconn-interconnect-technology-ltd-asia-4324084334)按學歷列不同年資，[TAO 的 MLOps](https://tw.linkedin.com/jobs/view/machine-learning-operations-engineer-at-tao-digital-solutions-4424303031)即使平台標初階，正文仍要求實際工具經驗。
- **香港：** 全端六筆全部提到 React，三筆提到 Java；[宏利的 Associate](https://hk.linkedin.com/jobs/view/associate-full-stack-software-engineer-at-manulife-4482919619)接受應屆生，也談雲端、API、SQL，不是純切版。[PERSOL 的專案職缺](https://hk.jobsdb.com/job/95821446?origin=cardTitle&ref=search-standalone&type=standard)明列英語溝通與粵語；[Pinpoint Asia 的 MLOps 職缺](https://hk.linkedin.com/jobs/view/mlops-llmops-engineer-agentic-ai-program-j12529-at-pinpoint-asia-4492129187)則以專業英語為條件、粵語或華語加分。AI 需求從[機房與硬體基礎設施](https://hk.linkedin.com/jobs/view/ai-infrastructure-engineer-at-china-mobile-international-limited-4313751089)到[推論最佳化](https://hk.linkedin.com/jobs/view/llm-inference-optimization-engineer-at-xircuit-ai-limited-4428038390)，不能用同一份聊天機器人作品回應兩者。
- **中國大陸：** 全端六筆中 Java 四、Vue 三、Go 二；[滿幫](https://www.nowcoder.com/jobs/detail/463148?urlSource=sitemap)把 Java／Spring 的業務服務與前端交付放在同一職務，[攜程](https://www.nowcoder.com/jobs/detail/463589)則列多種可擇一方向，也要能驗收 AI 輔助產出。七筆 AI 校招全提分散式；[上海人工智慧實驗室](https://www.nowcoder.com/jobs/detail/424734)即使招畢業生也列出 PyTorch、通訊與實作。中文公告與中文技術答辯練習相符，但公告語言不是明文的語言檢定；還要逐一查畢業屆別與科系。
- **新加坡：** [Vertis 的培訓職缺](https://sg.linkedin.com/jobs/view/full-stack-developer-junior-at-vertis-4461911429)有身分資格限定；[Vitol](https://jobs.smartrecruiters.com/Vitol/744000115852957-full-stack-desk-developer?trid=7d1dcdfa-96a8-4e55-bb9c-0db211f5a9b3)偏好能與業務團隊釐清需求並做出完整工具的人。七筆 AI 職缺均提到 Python 與推論或模型部署；[Airwallex](https://careers.airwallex.com/job/89fccb81-c8cc-4769-be0c-9ed078e1a03b/senior-software-engineer-machine-learning-platform/)同時明列五年以上軟體、其中三年以上相關模型基礎設施經驗。準備英文 README、架構說明與當面釐清問題；這是準備策略，不代表每家公司要求相同的語言證明。
- **美國：** 同是「全端」也有[接受課程／個人作品的新鮮人職缺](https://www.ycombinator.com/companies/spruceid/jobs/xscY5WF-full-stack-software-engineer-new-grad-remote)和[標 Engineer II 卻要求 5–8 年的職缺](https://job-boards.greenhouse.io/divergent/jobs/5237979008?gh_src=zh1pczsv8us)。[DRW 的推論平台](https://job-boards.greenhouse.io/drweng/jobs/8230509)要處理快取、延遲、吞吐與品質；[Lightning AI 平台支援](https://job-boards.greenhouse.io/lightningai/jobs/7746583003)的橋接點是 Linux、Kubernetes 和協助使用者排錯，而不是免經驗的客服。英文實作說明與行為例子值得練；工作權以當筆條件為準。
- **遠端：** [Utility Profit](https://job-boards.greenhouse.io/utilityprofit/jobs/4412541009?gh_src=remotehunt.app)明示全球但偏好墨西哥／美國的時區重疊；[Affirm 的國際組](https://job-boards.greenhouse.io/affirm/jobs/8202548003)仍限在西班牙，[StackAdapt](https://ca.linkedin.com/jobs/view/full-stack-engineer-at-stackadapt-4482140258)限加拿大。[Canonical 的全球 MLOps Field Engineer](https://canonical.com/careers/6783943)要英文簡報、客戶溝通及出差，工作本質偏方案交付。看到 remote 先讀可居住地、重疊工時與出差要求，再決定是否準備作業。

## 招聘方看的是能接什麼工作

**初階全端：** 拿一項需求，釐清、做出可操作的畫面，經 API 寫進資料庫，能處理錯誤、保留輸入、說明測試與部署。最有用的展示不是頁數，而是「兩個人搶最後一席時，為何剛好一人成功？」新人不一定要主導架構；能區分自己的修改與框架替你做的事很重要。[Julius 的新人職缺](https://www.ycombinator.com/companies/julius/jobs/mJvspKN-software-engineer-product-new-grad)要求可看的作品或產品及出貨經驗，[Pandvil 的 Web Developer](https://job-boards.greenhouse.io/pandvil/jobs/5281353008?gh_src=r8etxcxx8us)明索上線作品、連結與個人角色。模板改色、純截圖、測試資料寫死卻說能上線，無法回答這些問題。

**第一份 AI 基礎設施工作：** 三種日常要分開：模型平台重視資料、版本與可靠發布；推論服務重視排隊、記憶體與可重現量測；GPU／HPC 叢集重視節點、網路與排程。許多職缺是資深或需要正式環境經驗；校招組不是反例，它有學位、畢業屆別、研究或實作門檻。優先選一座橋：① 已會 API，找後端／服務可靠性工作，開始負責發布與事件；② 擅長 Linux，找平台、SRE、DevOps 或技術支援，累積監控、還原與容量經驗；③ 已做過 ML，從模型發布與資料管線切入。不要將這些橋接職務全部買單成「零經驗 AI 工程師」。一篇近期的[DevOps 轉 MLOps 第一人稱面試經驗](https://www.reddit.com/r/mlops/comments/1qiqcl6/coming_from_devopsinfra_to_mlops_heres_what_i/)描述：同一個職稱，有的組談叢集，有的組談資料分布。這是個人觀察；[推論後端](https://job-boards.greenhouse.io/togetherai/jobs/4835763007?gh_src=fbe3b70a7us)與[模型平台](https://careers.airwallex.com/job/89fccb81-c8cc-4769-be0c-9ed078e1a03b/senior-software-engineer-machine-learning-platform/)的職責才是投遞時的比對依據。

## 面試與作品：準備一個能追問的失敗案例

| 工作方向 | 有來源的流程範例 | 棧道的演練與驗收 |
|---|---|---|
| 全端／產品 | [Deliveroo 工程面試](https://careers.deliveroo.co.uk/our-interview-guide-backend-engineering/)列出在家作業、程式題、架構與行為題；部分面談會延伸先前提交的解答。[Angible](https://tw.linkedin.com/jobs/view/full-stack-engineer-at-angible-4474124204)則有技術初談、實作或審查與協作面談。 | 限時用熟悉語言交出正確基準解；以鍵盤完成一次使用流程；白板解釋交易與失敗回應。說清一個曾縮小範圍的決定。 |
| ML 平台／ML 系統 | [Meta 的 ML 工程面試指南](https://d3no4ktch0fdq4.cloudfront.net/public/course/files/Meta_ML_onsite_interview_prep.pdf)區分程式題、ML 系統設計與行為面談；是公司流程範例，不代表每間公司都有這一輪。 | 對「模型上線後變差」先界定指標，再查資料版本、訓練與服務差異；說明怎麼回復，不能只選模型名稱。 |
| 叢集／推論／SRE | [Nebius 的分職務面試](https://nebius.com/engineering-interviews)把 Linux、網路、Kubernetes 的實際排錯與資深架構討論分開；ML 路線另有 Python、ML 實作或專項。 | 拿一個 Pending 工作或尾端延遲案例，先講第一個讀取的訊號，再講什麼結果會推翻猜測。比較固定輸入的首字延遲、吞吐與失敗數。 |

帶回作業不是必經關卡；先確認時間預算、交付範圍與能否用工具。[Julius](https://www.ycombinator.com/companies/julius/jobs/mJvspKN-software-engineer-product-new-grad)公開的是短期**付費**實作，與在家做題不是同一種安排。[Holloway 的面試形式指南](https://www.holloway.com/g/technical-recruiting-hiring/sections/technical-interview-formats)可用來對照不同形式測得到什麼；[Atlassian 的工程面試指南](https://www.atlassian.com/company/careers/resources/interviewing/engineering)有助準備設計與合作題。回答行為題時，用真實的練習事件也可以：說出自己做了什麼、怎麼驗證、誰能重跑，不捏造使用者數。

**作品取捨：** 全端先做預約服務，放可體驗部署、測試帳號的產生方式、資料模型圖、權限與並行案例、回復手冊。AI 先做 CPU 模型發布，再選「推論基準」或「可觀察的小型平台」當主件：保留原始數據、單位、版本、負載分布及負面結果。若無 GPU，量 CPU 的成功率與服務流程，硬體專屬行為列待驗證；不要把 CPU 數字外推成多卡效能。職缺只寫一種引擎時，能說清同一工作負載的取捨，比在履歷列四個引擎更能驗收。[DRW 的量測與品質要求](https://job-boards.greenhouse.io/drweng/jobs/8230509)、[ITA GROUPE 要求說明作品與貢獻](https://www.itagroupe.com/careers/mid-level-full-stack-developer)。

## 從零到可投遞：用里程碑，不用倒數保證

以下為**課程設計估算，不是追蹤求職者得到的錄取時間**。一個月以 30 天算，每天確實投入 1 或 2 小時；若每週只學六天，日曆期約再乘 7/6。時數是從零開始的累計範圍，後一列含前面可重用的能力，不可逐列相加。使用者若卡在某個驗收門檻，就以證據而非月份為準。

| 何時做什麼 | 累計投入 | 每天 1 小時 | 每天 2 小時 | 放行條件 |
|---|---:|---:|---:|---|
| 第一次交付小工具 | 45–75 小時 | 1.5–2.5 個月 | 0.8–1.3 個月 | 從空資料夾重跑，有一個壞輸入案例與清楚的說明。 |
| **開始試投初階全端** | **約 385–535 小時** | **約 12.8–17.8 個月** | **約 6.4–8.9 個月** | 已部署一項完整服務，能重現權限／並行失敗，通過單元與整合檢查；無提示說明一個設計取捨、解一題並測邊界。仍可邊投邊補。 |
| 試投後端／平台橋接職務 | 450–750 小時 | 15–25 個月 | 7.5–12.5 個月 | 有部署、回復、值班手冊；能區分 DNS、應用程式、資料層故障，並說明一次曾猜錯的原因。 |
| 試投與作品專長相符的初階 ML 平台／推論職缺 | 750–1,200 小時 | 25–40 個月 | 12.5–20 個月 | 模型發布可追溯；在固定品質與負載下報出延遲、吞吐與成本；能回答容量或回復問題。高階叢集職缺仍可能硬性要求數年實務。 |

**為什麼不能只看地圖的時數？** 以 v2 的全端部署（`fs-production`）及五個求職模組為終點，沿直接先修回推、共用模組只算一次：31 個模組共 123 小時 15 分。摘要器、閱讀清單、預約服務另外估 80 小時。再給獨立改需求與除錯 100–165 小時、間隔複習／口述／重做 55–100 小時、投遞材料與模擬 26–66 小時，總計約 385–535 小時（取到約五小時）。這是準備較完整的一條情境；已能達到驗收門檻就可先試投，不必等所有求職課。這些是規劃假設，最不確定的是不用範例能否獨立完成。AI 路線還要增加值班或平台交付、模型與系統的觀測實驗；作品不會自動換算成年資。應用程式的地圖只估剩餘課內內容，**不可顯示為錄取日期**。

課程順序與四條[全端](https://roadmap.sh/full-stack)、[後端](https://roadmap.sh/backend)、[DevOps](https://roadmap.sh/devops)、[MLOps](https://roadmap.sh/mlops)公開路線交叉檢視；它們用來查漏，不算雇主票數。模組圖、先修原因與授課取捨見 [curriculum.md](curriculum.md)。
