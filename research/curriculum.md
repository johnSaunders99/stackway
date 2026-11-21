# 棧道課程 v2：先學會機制，再用情境驗收

從關掉視窗再找到昨天的筆記開始。到能交作品時，問題仍然相似：換一個環境，別人能不能找到輸入、重跑操作、辨認結果？共同起點不等於共同終點：全端要讓使用者做完一件事；AI 基礎設施要讓模型服務或訓練工作可靠完成。

地圖共 **49 個模組、373 堂、194 小時 25 分**。373 堂皆已就緒，每堂都有正文、知識點與練習；這是教材的預估學習時間，不是學習者的實際紀錄。課名顯示可搜尋的主題，副標題保留實際使用情境。例如先在地圖找「冪等性與重複送出」，再用「重新送出不能建 2 張訂單」驗收。

## 選路：看你想交什麼，不用一次走完兩條線

- **全端。** 做出純 HTML 閱讀清單，用 CSS 排好窄畫面，用 JavaScript 接收事件；遇到非同步資料後再用 TypeScript 與 React。後端先以 Node 原生 HTTP 回應，再用 **Express**：只增加路由與中介軟體，能直接拿前一堂的請求比較，不必同時學第二個框架。先寫 SQL 再用 **Prisma**，讓同一位學習者沿用 TypeScript 型別，比對 SQL、遷移與資料約束，不把 ORM 當成理解交易的替代品。部署以可重建的本機環境為底線，AWS 是雲端能力的獨立驗收。
- **AI 基礎設施。** 一邊用 CPU 訓練、評估、還原小模型，一邊建立 Linux、Docker 與發布基礎。接著選模型版本管理、推論量測，或 GPU 叢集與分散式訓練。Go 在市場樣本為 11/33，因此只安排五堂小工具課，另在模型閘道讀一個取消請求的實例；不把它設成 PyTorch 或 Kubernetes 的前置。兩條職涯都不用等 Java／Vue 移植才開始投遞。
- **共同起步與求職。** 今天要學多少，先看「今日」；複習時先蓋住答案，再用反例判斷是否真的會。搜尋先取工具名稱與錯誤關鍵字，確認版本和作業系統；請 AI 先給提示，再查原始文件、關掉對話重做。第一份小工具就能練交接與履歷，不必等到高階課才整理證據。

## 兩輪演算法：可直接採用的四週練習

第一輪在 `fd-algo`：用紙筆推輸入、畫資料結構、說出時間／空間成本。第二輪在 `cr-coding`：補區間、貪婪、拓樸、回溯與一維／二維動態規劃，再把下面四週當作一次不限程式語言的複習。**一週兩次，每次 30 分鐘；週末另留 5 分鐘口述。** 第一回先寫基準解、預測一個反例；至少隔一天，蓋住舊答案重做變形。驗收不是通過幾題，而是能解釋改了哪個條件會讓舊方法失效。

| 週 | 免費練習 | 隔天改一個條件 | 能否說清楚 |
|---|---|---|---|
| 1：陣列與狀態 | [CSES：Increasing Array](https://cses.fi/problemset/task/1094) | 改成空輸入、全相等，再改一個下降位置。 | 一趟掃描時要保留哪兩個量？ |
| 2：區間與貪婪 | [CSES：Movie Festival](https://cses.fi/problemset/task/1629) | 加入一個很早開始、卻很晚結束的場次。 | 為什麼按結束時間選，而不是按開始時間？ |
| 3：圖與相依 | [CSES：Course Schedule](https://cses.fi/problemset/task/1679) | 加一條邊形成環，記下尚未處理的節點。 | 怎麼用入度與處理數判定沒有合法順序？ |
| 4：二維動態規劃 | [CSES：Grid Paths I](https://cses.fi/problemset/task/1638) | 先手算三乘三，再把起點或中間一格封住。 | 每一格存的是什麼？障礙與邊界怎麼初始化？ |

需要補題，從 [CSES 題單](https://cses.fi/problemset/)選同主題的一題；需要從更小的例子開始，到 [USACO Guide](https://usaco.guide/)對應主題看解說。這裡列的是題目入口與自製的變形，不是標準答案。四週重作時間是課外練習，不重複算進那堂 30 分鐘的規劃課。

## 建議順序與先修

以下依 [path.yaml](../content/path.yaml) 排列。先修欄才是硬性解鎖條件；相鄰列不必然相依。模組內每堂以本模組上一堂為先修。階段 0–4 分別是起步、基礎、核心、進階、求職；求職課可以在不同專長交會處插入。模組連到作品是「可拿來做什麼」，不是作品反過來阻擋課程。

| 模組 | 階段 | 直接先修 | 此時要解決的問題 |
|---|---:|---|---|
| [Windows 檔案與工具](../content/modules/fd-computer/module.yaml) | 0 | 無 | 先驗收「關閉後找得回來」，不先考指令或要求安裝。 |
| [自學與資料查證](../content/modules/fd-study/module.yaml) | 0 | 無 | 沒有技術門檻；先建立猜測、核對、重做的習慣。 |
| [命令列與 shell](../content/modules/fd-cli/module.yaml) | 0 | Windows 檔案與工具 | 位置先於動作；看到目前目錄才知道下一個指令作用在哪裡。 |
| [Python 基礎](../content/modules/fd-python/module.yaml) | 1 | 命令列與 shell | 在本機執行一個檔案，從值、輸入與流程走到小型摘要。 |
| [Git 版本控制與協作](../content/modules/fd-git/module.yaml) | 1 | 命令列與 shell | 先用可丟棄的本機資料練提交與差異，再學遠端與審查。 |
| [HTML 與網頁入門](../content/modules/fs-html/module.yaml) | 1 | Windows 檔案與工具 | 第一個頁面只需要檔案；先組出標題、表單、可導航的結構。 |
| [CSS 排版與視覺設計](../content/modules/fs-css/module.yaml) | 1 | HTML 與網頁入門 | 已有真實頁面，才能用兩種寬度驗證排版，而不只背屬性。 |
| [Python 資料集合與模組](../content/modules/fd-python-data/module.yaml) | 1 | Python 基礎 | 會寫迴圈後，才比較切片、推導式、排序鍵和模組重用。 |
| [Python 物件導向與迭代](../content/modules/fd-python-oop/module.yaml) | 1 | Python 資料集合與模組 | 從不同實例的狀態出發，最後才談需要暫停的生成器。 |
| [Python 開發工具與測試](../content/modules/fd-python-tools/module.yaml) | 1 | Python 物件導向與迭代、Git 版本控制與協作 | 錯誤堆疊、中斷點先於套件工具；用測試驗收原本的小程式。 |
| [資料結構與演算法](../content/modules/fd-algo/module.yaml) | 1 | Python 資料集合與模組 | 把熟悉的集合、函式換成可手算的成本與資料結構選擇。 |
| [網路與 HTTP 基礎](../content/modules/fd-network/module.yaml) | 1 | 命令列與 shell | 從網址、DNS 和連線開始，才能分辨應用錯誤與傳輸失敗。 |
| [JavaScript 語言基礎](../content/modules/fs-js/module.yaml) | 1 | Python 基礎、HTML 與網頁入門 | 以 Python 小例子對照動態值、閉包、物件與模組。 |
| [SQL 與關聯式資料庫](../content/modules/fd-sql/module.yaml) | 1 | Python 基礎 | 先寫查詢及手算結果，再談交易、索引與非關聯式選擇。 |
| [作業系統與並行](../content/modules/fd-systems/module.yaml) | 1 | Python 開發工具與測試 | 從會執行程式走向行程、檔案、記憶體與等待。 |
| [瀏覽器與非同步程式](../content/modules/fs-browser/module.yaml) | 2 | JavaScript 語言基礎、網路與 HTTP 基礎 | 先處理單一 DOM 事件，再追蹤非同步工作與取消。 |
| [TypeScript 型別系統](../content/modules/fs-ts/module.yaml) | 2 | JavaScript 語言基礎 | 已有動態物件的具體例子，型別收窄與泛型才有用途。 |
| [Node.js 伺服器入門](../content/modules/fs-node/module.yaml) | 2 | JavaScript 語言基礎、網路與 HTTP 基礎 | 先看一個原生 HTTP 回應，再加入框架、設定和紀錄。 |
| [Git 歷史與復原](../content/modules/fd-git-recovery/module.yaml) | 2 | Git 版本控制與協作 | 有了本機與共用歷史的區別，再選復原方法；不擋初次提交。 |
| [Linux 與 Shell 指令](../content/modules/fd-linux/module.yaml) | 2 | 命令列與 shell、作業系統與並行、網路與 HTTP 基礎 | 已分得清行程和網路，再把同一套觀察帶進 Linux。 |
| [React 元件與狀態](../content/modules/fs-react/module.yaml) | 2 | 瀏覽器與非同步程式、TypeScript 型別系統、CSS 排版與視覺設計 | 把已用瀏覽器、CSS 與型別做過的畫面拆成元件。 |
| [Docker 容器與編排](../content/modules/fd-docker/module.yaml) | 2 | Linux 與 Shell 指令、Git 版本控制與協作 | 理解行程與檔案後才分辨映像、執行中的容器及持久資料。 |
| [REST API 與身分驗證](../content/modules/fs-api/module.yaml) | 2 | Node.js 伺服器入門、TypeScript 型別系統、SQL 與關聯式資料庫 | 先使請求抵達伺服器，再定義資源、錯誤、登入、授權與重送。 |
| [PyTorch 與模型訓練](../content/modules/ai-ml/module.yaml) | 2 | Python 開發工具與測試、資料結構與演算法 | 先用 CPU 做出可核對的訓練迴圈，再選裝置與混合精度。 |
| [資料建模與 Prisma](../content/modules/fs-data/module.yaml) | 2 | REST API 與身分驗證、SQL 與關聯式資料庫 | 用 SQL 對照 ORM，才看得見遷移或競爭造成的資料變化。 |
| [後端快取與非同步服務](../content/modules/fs-services/module.yaml) | 2 | REST API 與身分驗證、資料建模與 Prisma | 已有可用資料來源後才加入快取、佇列與即時通知。 |
| [持續整合與發布](../content/modules/fd-delivery/module.yaml) | 2 | Docker 容器與編排、Python 開發工具與測試 | 先重建同一份測試成品，再讓發布失敗也有退路。 |
| [AWS 雲端入門](../content/modules/fd-aws/module.yaml) | 2 | 持續整合與發布 | 理解要部署的服務後才分配雲端責任；先做預算與清理。 |
| [全端測試與品質](../content/modules/fs-quality/module.yaml) | 2 | React 元件與狀態、REST API 與身分驗證 | 畫面和 API 都已存在，才決定哪項風險要在哪一層測。 |
| [Transformer 架構與解碼](../content/modules/ai-llm/module.yaml) | 2 | PyTorch 與模型訓練 | 從張量和模型往上，走一趟從文字到下一詞元的路。 |
| [GPU 架構與 CUDA](../content/modules/ai-gpu/module.yaml) | 2 | PyTorch 與模型訓練、作業系統與並行 | 張量和行程已有參照物，可以分清搬移、執行與量測。 |
| [Kubernetes 物件與部署](../content/modules/ai-k8s/module.yaml) | 2 | Docker 容器與編排、網路與 HTTP 基礎 | 先讀懂一個 Pod，再認識維護副本、路由、儲存與裝置的物件。 |
| [可觀測性與事件處理](../content/modules/ai-observe/module.yaml) | 2 | Kubernetes 物件與部署、持續整合與發布 | 先有真正的服務與發布事件，再決定要觀察哪些失敗。 |
| [Go 基礎設施小工具](../content/modules/ai-go/module.yaml) | 2 | Linux 與 Shell 指令 | 已有 Linux 小工具可對照，新增一種閱讀與測試基礎設施程式的方式。 |
| [全端部署與維運](../content/modules/fs-production/module.yaml) | 3 | 全端測試與品質、資料建模與 Prisma、持續整合與發布 | 以最小預約流程驗收部署、健康與還原；雲端不是硬門檻。 |
| [作品集與技術履歷](../content/modules/cr-portfolio/module.yaml) | 4 | Git 版本控制與協作、Python 開發工具與測試 | 有可重跑的小工具就能整理證據，無須等整條路學完。 |
| [職缺分析與投遞](../content/modules/cr-search/module.yaml) | 4 | 作品集與技術履歷 | 有作品證據後，才挑值得補的職缺差距。 |
| [系統設計與容量估算](../content/modules/fd-design/module.yaml) | 3 | 作業系統與並行、網路與 HTTP 基礎、SQL 與關聯式資料庫 | 已懂系統、網路與資料，容量與尖峰上的取捨才有依據。 |
| [Terraform 與雲端變更](../content/modules/ai-iac/module.yaml) | 3 | AWS 雲端入門、Kubernetes 物件與部署 | 先認得 AWS 服務與叢集物件，再審查變更和漂移。 |
| [大模型推論服務](../content/modules/ai-serving/module.yaml) | 3 | Transformer 架構與解碼、GPU 架構與 CUDA、可觀測性與事件處理 | 同時具備模型、硬體與量測概念，才比較引擎與延遲。 |
| [模型版本與發布](../content/modules/ai-mlops/module.yaml) | 3 | PyTorch 與模型訓練、持續整合與發布 | 會訓練也會發布程式後，再分辨應用版本和模型版本。 |
| [GPU 叢集與資源排程](../content/modules/ai-cluster/module.yaml) | 3 | Kubernetes 物件與部署、GPU 架構與 CUDA | 能讀單卡與叢集物件後，再比較分享、配額與互連。 |
| [分散式模型訓練](../content/modules/ai-train/module.yaml) | 3 | PyTorch 與模型訓練、GPU 架構與 CUDA、GPU 叢集與資源排程 | 先把單機訓練做對，再拆分工作、通訊與儲存責任。 |
| [模型閘道與檢索服務](../content/modules/ai-gateway/module.yaml) | 3 | Transformer 架構與解碼、系統設計與容量估算、Go 基礎設施小工具 | 在 Go 小工具、模型及服務取捨之上，加入口預算與取消傳遞。 |
| [AI 平台系統設計](../content/modules/ai-design/module.yaml) | 3 | 大模型推論服務、模型版本與發布、Terraform 與雲端變更 | 推論、發布與環境變更都有基準後，再要求容量答辯。 |
| [演算法面試與解題](../content/modules/cr-coding/module.yaml) | 4 | 資料結構與演算法 | 已有基準資料結構後，改練限時解釋、反例與變形題。 |
| [系統設計面試](../content/modules/cr-design/module.yaml) | 4 | 系統設計與容量估算 | 已有容量估算，再練面試現場如何問清需求與收斂。 |
| [行為面試與技術表達](../content/modules/cr-behavior/module.yaml) | 4 | 作品集與技術履歷 | 用已交付作品裡的真實經驗作答，不杜撰年資。 |
| [Java、Spring 與 Vue](../content/modules/fs-market-stack/module.yaml) | 3 | 全端部署與維運 | 已有可用的全端服務，才有同一份契約可比對移植前後。 |

## 作品與估時

課內總數加總各課的分鐘，包含該堂短練習，不含選讀、作品或四週重做；模組顯示值向上取到 0.1 小時，不能直接相加反推精確總時數。下表 **228 小時**是 8 個作品另外獨立完成的規劃值，不是兩條職涯人人都要繳的時數。

| 作品 | 獨立投入 | 最小可交付證據 |
|---|---:|---|
| [01 練習紀錄摘要器](../content/projects/proj-01-logbook.yaml) | 9 小時 | 別的目錄可依說明執行；輸入檔內容沒有被修改。 |
| [02 只用鍵盤也能操作的閱讀清單](../content/projects/proj-02-desk.yaml) | 15 小時 | 不使用滑鼠也能完成核心操作；窄畫面仍讀得到提示。 |
| [03 最後一席：可部署的預約服務](../content/projects/proj-03-reserve.yaml) | 56 小時 | 提供公開唯讀示範或可重建的本機部署；測試從乾淨資料執行；還原後比對預約筆數。 |
| [04 可交接的服務值班手冊](../content/projects/proj-04-ops.yaml) | 18 小時 | 用已知良好設定回復；從乾淨的練習環境照手冊重做，核對版本與測試回應。 |
| [05 可追溯的 CPU 模型發布](../content/projects/proj-05-model.yaml) | 22 小時 | 乾淨環境能載入指定版本；回復後固定輸入得到預期輸出。 |
| [06 可觀察的小型 Kubernetes 平台](../content/projects/proj-06-platform.yaml) | 32 小時 | 只在測試命名空間演練；用同一組請求確認回復。 |
| [07 首個詞元要等多久：推論服務基準](../content/projects/proj-07-inference.yaml) | 40 小時 | 交付可重算的原始資料與單位；無 GPU 的結果不宣稱測到 CUDA 或叢集擴展。 |
| [08 多租戶推論平台的容量答辯](../content/projects/proj-08-platform-design.yaml) | 36 小時 | 記錄配額不足時的處理順序；留下上線前仍需驗證的條件。 |

沒有雲端帳號，可以畫 VPC 架構、讀示意帳單、寫清理清單，並在本機部署全端服務。沒有 GPU，可以實測 CPU 的載入與服務流程，手算分片與快取容量；不要把這些數字標成 CUDA 或多機實測。模型效能報告要區分量到的數字、推估與未執行的部分。投遞看作品能否重現與職缺實際門檻，不用地圖完成率推算錄取日期。依據與樣本限制見[市場報告](market-report.md)。
