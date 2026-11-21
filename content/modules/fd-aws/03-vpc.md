---
id: fd-aws-03-vpc
module: fd-aws
order: 3
title: VPC 子網路與安全群組
subtitle: 哪些服務該接受外部連線
status: ready
minutes: 35
level: 3
prereqs:
  - fd-aws-02-iam
objectives:
  - 畫出 VPC、公私有子網路與路由
  - 為入口、應用與資料庫標出安全群組間允許的方向
tags:
  - aws
  - vpc
resources:
  - title: "Amazon VPC：子網路與路由"
    url: "https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
  - title: "Amazon VPC：安全群組"
    url: "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html"
    kind: "doc"
    lang: "en"
    minutes: 5
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-aws-03-vpc-route"
    prompt: "IPv4 子網路為何被稱為公有子網路？"
    answer: "其路由表有通往網際網路閘道的路由。"
    mcq:
      options:
        - "子網路名字含 public。"
        - "所有執行個體都允許所有連入。"
        - "其路由表有通往網際網路閘道的路由。"
        - "只要和資料庫在不同機房。"
      answer: 2
      explain: "路由提供路徑；公有位址及允許規則等條件仍要分別檢查。"
    interview:
      question: "入口能連應用，是否代表瀏覽器能直連資料庫？"
      points:
        - "區分路由與規則"
        - "逐跳列來源與連接埠"
        - "區分回應與新連線"
      answer: "不能這樣推。我會分別檢查入口到應用、應用到資料庫的路徑和規則，資料庫只接受應用群組的資料庫埠，不因為上一跳允許就把整條鏈公開。"
  - id: "fd-aws-03-vpc-direction"
    prompt: "只讓應用查資料庫，資料庫安全群組應允許哪種傳入？"
    answer: "來源為應用安全群組、目的為資料庫連接埠"
    mcq:
      options:
        - "來源為所有網際網路位址的所有連接埠"
        - "來源為瀏覽器、目的為入口的網頁連接埠"
        - "讓資料庫主動連回任意瀏覽器"
        - "來源為應用安全群組、目的為資料庫連接埠"
      answer: 3
      explain: "規則應對應發起者、接收者與服務埠，不是把整個網段互相信任。"
  - id: "fd-aws-03-vpc-stateful"
    prompt: "安全群組具狀態是什麼意思？"
    answer: "已獲允許連線的回應流量可返回。"
    mcq:
      options:
        - "已獲允許連線的回應流量可返回。"
        - "允許回應就代表可任意發起新連線。"
        - "網路能走就等於有資料庫密碼。"
        - "所有子網路只要一條規則即可。"
      answer: 0
      explain: "回應和新發起的連線不同，驗證身分也不是網路規則的工作。"
  - id: fd-aws-03-vpc-authz
    prompt: "路由、安全群組和資料庫埠都正常，但查表被拒，下一層查什麼？"
    answer: "查應用使用的資料庫身分及該表權限；網路放行只代表能建立連線，不代表能讀資料。"
practice:
  - id: "fd-aws-03-vpc-p1"
    title: "畫出 3 跳網路圖"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 network.py，把三條許可畫入有公私界線的圖"
      - "標出公有入口的預設路由"
      - "補上瀏覽器直連資料庫的拒絕例"
    checks:
      - "每條箭頭有來源、目的和埠"
      - "能指出回應不是額外開放同一埠給全世界"
---

## 為什麼要學：找不到服務，先別打開所有門

頁面需要查書目，不表示瀏覽器需要連到資料庫。中間有入口轉送給應用，再由應用查詢資料。虛擬私有雲（virtual private cloud，VPC）是自己規劃的邏輯網路；子網路（subnet）切分位址範圍，每個子網路位於一個可用區。圖上能放在一起，並不表示每個元件都應讓外部直接連入。

## 核心概念：路怎麼走，門讓不讓過

路由表（route table）依目的位址決定下一跳。以 IPv4 為例，公有子網路有通往網際網路閘道（internet gateway）的路由；私有子網路沒有直接往該閘道的路由。公有子網路內的機器並不自動可以從外部連入，仍需適用的公開位址、規則與正在接聽的服務。私有也不是完全斷線，仍可依設計與同一網路的其他服務互通。

安全群組（security group）套用在資源的網路介面，列出允許的傳入與傳出流量。以資料庫的傳入規則來看，來源可以是應用的安全群組，而不必寫死每台應用主機的位址。只許資料庫使用的連接埠。這是網路層的放行，不會替應用登入資料庫。安全群組具狀態（stateful），已放行連線的回應不用再為它另開一條任意傳入規則。

## 範例：用 3 張通行證畫箭頭

在 `C:\dev\stackway-lab\aws` 存 `network.py`，執行 `py network.py`；macOS／Linux 用 `python3 network.py`。這是紙上架構的傳入許可模型；假設所需路由與傳出許可都已具備。它不操作實際網路，也不是完整封包模擬器。

```python
allows = {("browser","edge",443), ("edge","app",8080), ("app","db",5432)}
for rule in sorted(allows):
    print("allow", *rule)
for attempt in [("browser","db",5432), ("app","db",5432), ("edge","db",5432)]:
    print(attempt, "pass" if attempt in allows else "no matching rule")
```

紙上把入口放公有子網路，標出預設路由到網際網路閘道；應用和資料庫放私有子網路，標記內部位址間的本地路由。瀏覽器向入口送加密網頁請求，應用接到入口轉來的要求才查資料。即使入口是公開的，從入口群組直接連資料庫也不符合第三條規則。

### 從哪個方塊看才不會把方向畫反？

拿一張紙遮住入口和瀏覽器，只留下資料庫。站在它的位置說：「我接收的是應用送來的連線，目的是我正在接聽的資料庫埠。」把這句話翻成規則，就不會誤把連接埠寫成應用接收網頁的埠。再把紙移到應用方塊，分別讀它的傳入和傳出，會發現同一方塊在不同連線裡扮演不同角色。若希望某台私有主機主動下載更新，那是另一條向外的路徑需求，不能因為需要下載就開放所有外部連入。

## 常見錯誤與小結

安全群組規則不會像接力棒一樣往下傳。入口信任瀏覽器、資料庫信任應用，不代表資料庫也信任瀏覽器。除錯時沿每一跳核對目的位址、路由、來源群組、目的埠與服務是否接聽；全部符合，才往資料庫身分與操作權限查，而不是遇到逾時就放寬所有來源。
