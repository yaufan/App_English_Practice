# 離線模型回覆檢查：qwen3.5-2b
難度：A2。用 llama.cpp 跑和 App 一樣的模型檔、prompt 和 JSON 格式（CI 電腦的速度不代表手機速度）。

## 對話：咖啡店點餐
- **AI**：Hi there! What can I get for you today?
- **我**：i want latte big
  - **AI**：Great! What size do you want?　（好的！你想要什麼大小？）〔7014 ms〕
  - 提示：Large one, please.（大杯的，謝謝。）
- **我**：ice. and less sugar
  - **AI**：Great! What size do you want?　（好的！你想要什麼大小？）〔4648 ms〕
  - 提示：Large one, please.（大杯的，謝謝。）
- **我**：我想要外帶
  - **AI**：Oh, I see! That's fine.　（哦，我知道了。沒關係。）〔5357 ms〕
  - 提示：Okay, let me know when you're ready.（好的，你準備好了再告訴我。）
- **我**：how much
  - **AI**：Just 5 dollars now.　（現在只要五美元。）〔4457 ms〕
  - 提示：Five dollars, okay?（五美元，對嗎？）
- **我**：card ok?
  - **AI**：Yes, card is fine. Thank you!　（是的，卡片沒問題。謝謝！）〔5457 ms〕
  - 提示：Yes, card is fine. Thank you!（是的，卡片沒問題。謝謝！）
- **檢討**〔37715 ms〕：你已經學會了基本問價和點餐方式，但英文表達還不夠自然。下次可以多用 'I would like...' 來點餐。
  - 好：你正確表達了想要的冰量和少糖
  - 好：你已經知道如何詢問外送服務
  - 好：你成功結帳並確認支付方式
  - 改：我想要外帶 → **I'd like to go out.**（我想點外送。）— 在英文中，'go out' 是常用說法，比直譯中文更自然。
  - 改：card ok? → **Do you accept cards?**（你們接受卡片支付嗎？）— 詢問支付方式時，用 'Do you...' 句型更正式且清楚。
  - 改：ice. → **I want ice.**（我想要冰的。）— 單字 'ice' 作為回答不太自然，最好加上主詞 'I want'。
  - 改：5 dollars → **$5.**（$5。）— 美元金額通常用 '$' 符號開頭，不寫 'dollars' 更簡潔。
  - 句：I would like a latte, big and with ice. How much?（我想要一杯大杯冰拿鐵，要多少錢？）
  - 句：Do you accept cards or cash only?（你們只接受卡片或現金嗎？）
  - 句：I'd like to go out, please.（我想點外送，麻煩幫我弄一下。）
  - 下次：下次試著用 'I would like...' 句型完整表達點餐需求，會更流暢。

## 對話：解釋你的 AI 專案
- **AI**：So I heard your team built an AI tool. What does it do?
- **我**：it find problem in ultrasound picture
  - **AI**：That is very helpful. Can you show me the picture?　（那非常有用。你能讓我看看圖嗎？）〔7733 ms〕
  - 提示：Yes, please.（好的，請說。）
- **我**：we use ten thousand image for train
  - **AI**：Oh, that sounds very big! How many pictures do you have?　（哦，那聲音很大！你有多少張圖片？）〔5312 ms〕
  - 提示：How many images?（多少張圖片？）
- **我**：accuracy is ninety percent
  - **AI**：That's a high accuracy! What happens after the AI makes its choice?　（那準確率很高！AI 做出選擇後會發生什麼？）〔6320 ms〕
  - 提示：What does it recommend for me to do?（它會建議我該怎麼做嗎？）
- **我**：doctor decide final
  - **AI**：Yes, the doctor decides. What about after they see the picture?　（是的，醫生決定。看圖之後他們會怎麼做？）〔5765 ms〕
  - 提示：What happens next?（接下來會發生什麼？）
- **我**：yes we use in hospital now
  - **AI**：That is good! How many hospitals use it right now?　（那很好！現在有多少家醫院在用它？）〔4889 ms〕
  - 提示：How many?（多少？）
- **檢討**〔45717 ms〕：你今天的回答很清晰，對 AI 專案的解釋講得很清楚。
  - 好：你準確說明了 AI 如何發現圖片中的問題，這是很好的部分。
  - 好：你提到醫生會做最終決定，這讓對話非常自然。
  - 改：it find problem in ultrasound picture → **it finds problems in ultrasound images**（它能在超聲影像中發現問題）— 原句語法不完整，且 'problems' 是複數，這裡用複數更自然。
  - 改：we use ten thousand image for train → **We use ten thousand images to train it**（我們用一萬張圖片來訓練它）— 原句缺少 'it'，且圖片應用複數，動詞 'train' 需要第三人稱單數形式。
  - 改：accuracy is ninety percent → **The AI has a ninety percent accuracy**（AI 的準確率達到百分之九十）— 原句主語 'accuracy' 是單數，但後面的 'is' 暗示了複數或錯誤的主語。
  - 改：doctor decide final → **The doctor makes the final decision**（醫生做出最終決定）— 原句缺少 'the'，且動詞 'decide' 不能直接跟在名詞後，需要加 'makes'。
  - 句：The AI helps doctors find problems quickly.（AI 能幫助醫生快速發現問題。）
  - 句：Doctors trust the AI for early detection.（醫生信任 AI 用於早期檢測。）
  - 句：We use real patient data to improve accuracy.（我們使用真實的患者資料來提高準確率。）
  - 下次：下次試著把 'problems' 改為複數，並檢查動詞是否需要加 's'。

## 對話：多益口說：回答問題
- **AI**：Imagine a friend is asking you about your free time. How often do you exercise, and where do you usually do it?
- **我**：i exercise two time one week in park
  - **AI**：Great! That sounds good. What sport do you like to play, and why do you choose it?　（太好了！聽起來不錯。你喜歡玩什麼運動？為什麼選擇它？）〔15718 ms〕
  - 修正：i exercise two time one week in park → **I exercise about twice a week in the park.**（我大約一週兩次在公園運動。）— 點餐說 I'd like 比較禮貌；twice 要寫成 twice，one week 要變成 twice a week，in the park 比較自然。
  - 提示：I play football or running, because it's fun.（我踢足球或跑步，因為很有趣。）
- **我**：because it near my home and free
  - **AI**：Good! That makes sense. Is the park open at night?　（好的！聽起來合理。公園晚上開放嗎？）〔6446 ms〕
  - 提示：Yes, it is open for free use all day.（是的，全天免費使用。）
- **我**：i like run
  - **AI**：That's a good reason! Why don't you do it after work today?　（這個理由不錯！你工作後今天做跑步嗎？）〔9426 ms〕
  - 修正：i like run → **I like running.**（我喜歡跑步。）— run 是動詞，需要加上-ing 變成 running。
  - 提示：Try it after your shift, it will be fun.（下班後試試看，會很有趣。）
- **我**：in morning before work
  - **AI**：Great idea! How do you feel when you run in the morning?　（好主意！早上跑步時你感覺如何？）〔6492 ms〕
  - 提示：You can ask how it feels to start your day with exercise.（你可以問開始一天運動感覺怎樣。）
- **檢討**〔49230 ms〕：你已經嘗試了回答問題，但句子結構有點不自然。你的表達很清晰，繼續加油！
  - 好：你能用 'in the park' 和 'near my home' 這兩個地點介詞短語，這很棒！
  - 好：你解釋為什麼選擇運動的原因很直接，這讓對話很流暢。
  - 改：i exercise two time one week in park → **I exercise twice a week in the park.**（我每週去公園兩次運動。）— 因為 'twice' 比 'two time' 更正確，而且 'in the park' 需要冠詞 'the'。
  - 改：because it near my home and free → **Because I like it because it's near my home.**（因為我喜歡它，因為它離我家近。）— 你需要加上主詞 'I'，並使用 'because it is' 來連線兩個原因。
  - 改：Why don't you do it after work today? → **Why don't you run after work today?**（為什麼你今天不跑呢？）— 這裡應該用動詞 'run' 而不是 'do it'，這樣更自然。
  - 改：in morning before work → **I run in the morning before work.**（我早上上班前跑步。）— 因為 'in the morning' 是時間介詞短語，必須加上主詞 'I' 並用 'the'。
  - 句：Where do you usually go for lunch?（你通常午餐去哪裡？）
  - 句：How long does it take to get there?（從這裡到那裡需要多久時間？）
  - 句：What's the most popular activity in your city?（你城市最流行的活動是什麼？）
  - 下次：下次練習時，試著把句子分成兩半說，例如先說地點，再說動作，這樣會更清楚。

## 對話：自由聊天：週末去哪裡玩
- **AI**：Hey! How are you doing today?　（嘿！今天你感覺很好嗎？）〔6453 ms〕
- **我**：i go to mountain last weekend
  - **AI**：Cool! What was the weather like then?　（酷！然後天氣怎樣？）〔4255 ms〕
  - 提示：What about you?（你呢？）
- **我**：it is very beautiful but tired
  - **AI**：Oh no, that's tough! How do you feel today?　（哦不，那很困難！你今天感覺怎樣？）〔5548 ms〕
  - 提示：You should rest and take a break.（你應該休息並休息。）
- **我**：with my family
  - **AI**：Great! Do you have a plan for this weekend then?　（太好了！然後你有這個週末的計劃嗎？）〔5500 ms〕
  - 提示：How about we go out together?（我們一起出去好嗎？）
- **檢討**〔36620 ms〕：你開始用英語說話了，但句子有點長，讀起來比較累。試著把句子變得更短一點會更自然。
  - 好：你提到了'family'這個詞，這是很好的表達，說明你能理解家人的意思。
  - 好：你用了'last weekend'，這個時間表達很準確，老師很高興。
  - 改：i go to mountain last weekend → **I went to the mountains last weekend.**（我上週去山裡了。）— 因為'mountain'通常用複數形式，而且動詞要用過去式 'went'。
  - 改：it is very beautiful but tired → **It was very beautiful, but I felt tired.**（天氣很美，但我感覺很累。）— 因為'tired'是形容人的感覺，不是天氣的形容詞。
  - 句：How was your weekend?（你週末過得怎麼樣？）
  - 句：I felt very tired.（我感覺很累。）
  - 句：Let's have a drink soon.（我們以後能喝杯飲料嗎？）
  - 下次：下次試著把句子拆分成更短的短句，比如用 'I went...' 代替整個長句。

## AI 產生聽力短文（AI 工作／介紹語音辨識系統）
## 統計
- 產生 3921 個 token，共 337 秒
- 模型原始輸出含簡體字的次數：4（App 會自動轉成繁體）
## 發現的問題
- cafe: 沒有用問句接話：Oh, I see! That's fine.
- cafe: 學習者講中文，但沒有給英文說法
- cafe: 沒有用問句接話：Just 5 dollars now.
- cafe: 沒有用問句接話：Yes, card is fine. Thank you!
- 短文：失敗 AI 這次寫的短文不能用（英文句子太少或混了中文），請再產生一次。
