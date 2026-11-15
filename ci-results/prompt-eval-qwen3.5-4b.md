# 離線模型回覆檢查：qwen3.5-4b
難度：A2。用 llama.cpp 跑和 App 一樣的模型檔、prompt 和 JSON 格式（CI 電腦的速度不代表手機速度）。

## 對話：咖啡店點餐
- **AI**：Hi there! What can I get for you today?
- **我**：i want latte big
  - **AI**：Great choice! Would you like it hot or iced?　（太棒了！你想喝熱的還是冰的？）〔32118 ms〕
  - 提示：Iced, please. Make it cold.（請給我冰的，要冷的。）
- **我**：ice. and less sugar
  - **AI**：Okay! Where would you like to get this?　（好的！你要帶走還是現在喝？）〔17365 ms〕
  - 修正：ice. and less sugar → **Less sugar, please.**（請少放糖。）— 原句語序不自然，通常說 'Less sugar' 或 'I want less sugar'。
  - 提示：Take it to go.（帶走。）
- **我**：我想要外帶
  - **AI**：Okay, I'll put it in a bag. Would you like milk or water with your drink?　（好的，我會把它裝進袋子裡。你想喝牛奶還是水？）〔19850 ms〕
  - 修正：我想要外帶 → **I want to take it away.**（我想帶走。）— 用 'take away' 或 'to go' 更自然。
  - 提示：Milk, please.（請給我牛奶。）
- **我**：how much
  - **AI**：It is 120 New Taiwan dollars. Would you like to pay now?　（這杯是 120 元新臺幣。現在要付錢嗎？）〔19512 ms〕
  - 修正：how much → **How much is it?**（它多少錢？）— 需要加 'is it' 來詢問價格。
  - 提示：Yes, please.（好的，請付款。）
- **我**：card ok?
  - **AI**：Sure! Do you have a card in your wallet?　（沒問題！你的錢包裡有卡嗎？）〔19888 ms〕
  - 修正：card ok? → **Card is okay, please.**（請用卡片。）— 語法不自然，通常說 'Card is okay' 或 'Can I use a card?'。
  - 提示：Yes, here it is.（是的，這是我的卡。）
- **檢討**〔92350 ms〕：你今天的點餐對話很自然，聽起來很流暢！你清楚地表達了想要外帶的需求。
  - 好：你使用了簡單的短句來說明需求。
  - 好：你能清楚說出自己的偏好，比如少糖和外帶。
  - 好：你的語氣很禮貌，讓人感覺很舒服。
  - 改：i want latte big → **I want a big latte.**（我想要一杯大拿鐵。）— 加冠詞 'a' 讓句子更完整，'big' 通常放在飲料名稱後面。
  - 改：ice. and less sugar → **Iced, please. And less sugar.**（要冰的，謝謝。而且少一點糖。）— 把 'ice' 改成 'iced' 才是形容詞，這樣語法才正確。
  - 改：我想要外帶 → **I want to take it away.**（我要外帶。）— 在英文中，我們常用 'take away' 來說外帶。
  - 改：card ok? → **Can I pay by card?**（我可以用卡片支付嗎？）— 用 'Can I...' 詢問比較自然，語氣也更禮貌。
  - 句：I'd like a cup of coffee, please.（我想要一杯咖啡，謝謝。）
  - 句：Can I have this to go?（我可以把這個帶走嗎？）
  - 句：Could you make it without sugar?（你能不加糖做給我喝嗎？）
  - 句：Do you accept credit cards?（你們接受信用卡嗎？）
  - 句：How much is this, please?（這個多少錢，謝謝。）
  - 下次：試著說完整的句子，例如 'I would like...' 或 'Could I...'，這樣會聽起來更專業一點。

## 對話：解釋你的 AI 專案
- **AI**：So I heard your team built an AI tool. What does it do?
- **我**：it find problem in ultrasound picture
  - **AI**：That is very helpful! It looks at pictures to see sickness. What kind of pictures does it use?　（那非常有用！它看圖片來發現疾病。它用什麼樣的圖片？）〔41870 ms〕
  - 修正：it find problem in ultrasound picture → **It finds problems in ultrasound pictures.**（它在超音波圖片裡找出問題。）— 要用動詞 find 的單數形式 is/has，且圖片通常用複數 pictures。
  - 提示：It uses many ultrasound images from patients.（它使用來自病人的許多超音波影像。）
- **我**：we use ten thousand image for train
  - **AI**：Wow, ten thousand! That is a lot. How much time did it take to learn them?　（哇，一萬張！那很多啊。花多少時間來學習它們？）〔26023 ms〕
  - 修正：we use ten thousand image for train → **We used 10,000 images for training.**（我們用了一萬張圖片來訓練。）— 這裡用過動詞 used 表示過去；「訓練」通常用 training，而圖片應用複數 images。
  - 提示：It took two years to collect and check them all.（花兩年時間來收集和檢查所有影像。）
- **我**：accuracy is ninety percent
  - **AI**：Ninety percent is very high! Do you mean it gets it right almost always?　（九十分之九非常高！你指的是它幾乎總是對嗎？）〔24042 ms〕
  - 修正：accuracy is ninety percent → **The accuracy is ninety percent.**（準確率是百分之九十。）— 這裡「準確率」通常用 The accuracy 或 just Accuracy 更自然。
  - 提示：Yes, it is very good. But sometimes it makes mistakes.（是的，它很好。但有時會犯錯。）
- **我**：doctor decide final
  - **AI**：Yes, the doctor always makes the final choice. Does the AI help them see clearly first?　（是的，醫師總是最後做決定。AI 先幫他們看得很清楚嗎？）〔17742 ms〕
  - 提示：Yes, it highlights the problem spots on the screen.（是的，它把問題區域高亮顯示在螢幕上。）
- **我**：yes we use in hospital now
  - **AI**：Great! How many doctors use it every day?　（太棒了！每天有多少位醫師使用它？）〔12994 ms〕
  - 提示：About fifty doctors use it every morning.（大約有五十位醫師每天早上使用。）
- **檢討**〔96008 ms〕：你很清楚地向夥伴介紹了這個 AI 工具。你的回答很簡短，但意思很清楚。
  - 好：你用了簡單的詞來解釋複雜的技術。
  - 好：你直接回答了關於資料和準確率的問題。
  - 好：你保持對話流暢，沒有太多停頓。
  - 改：it find problem in ultrasound picture → **It finds problems in the ultrasound picture.**（它在超音波圖片中尋找問題。）— 句子需要動詞原形加 's' 表示第三人稱單數，並加上冠詞。
  - 改：we use ten thousand image for train → **We use ten thousand images for training.**（我們用一萬張圖片進行訓練。）— 'Image' 是可數名詞，複數形式是 'images'；'train' 這裡應用作動名詞 'training'。
  - 改：accuracy is ninety percent → **The accuracy is ninety percent.**（準確度是百分之九十。）— 通常需要在 'accuracy' 前面加上定冠詞 'The' 來特指這個資料。
  - 改：doctor decide final → **The doctor makes the final decision.**（醫生做出最終決定。）— 'decide' 是動詞，這裡需要 'makes the final decision' 這個固定搭配來表達。
  - 句：It helps doctors see clearly.（它幫助醫生看得更清楚。）
  - 句：We use it in hospitals now.（我們現在在醫院使用它。）
  - 句：The accuracy is ninety percent.（準確度是百分之九十。）
  - 句：It finds problems in pictures.（它在圖片中找到問題。）
  - 句：The doctor makes the final choice.（醫生做出最終選擇。）
  - 下次：試著說完整的句子，例如 'It finds problems in pictures.' 而不是隻說幾個詞。

## 對話：多益口說：回答問題
- **AI**：Imagine a friend is asking you about your free time. How often do you exercise, and where do you usually do it?
- **我**：i exercise two time one week in park
  - **AI**：That is good. Do you play any sports with friends?　（很好喔。你會和朋友一起運動嗎？）〔41199 ms〕
  - 修正：i exercise two time one week in park → **I exercise twice a week in the park.**（我每週在公園運動兩次。）— 「twice」比「two time」更自然；加一點冠詞。
  - 提示：Yes, I play basketball with my friends on weekends.（是的，我週末和朋友打籃球。）
- **我**：because it near my home and free
  - **AI**：That makes sense. What kind of sports do you usually play?　（這很有道理。你通常玩哪種運動？）〔21954 ms〕
  - 修正：because it near my home and free → **Because it is near my home and free.**（因為它離我家近且很自由。）— 需要完整的句子結構，加上 be 動詞 is。
  - 提示：I like playing tennis or jogging in the morning.（我喜歡打網球或早上慢跑。）
- **我**：i like run
  - **AI**：That's great! Do you prefer running alone or with others?　（很好！你喜歡獨自跑步還是和別人一起跑？）〔22214 ms〕
  - 修正：i like run → **I like to run.**（我喜歡跑步。）— 「like」後面通常加「to」或動詞的-ing形式，這裡用「to run」很自然。
  - 提示：I prefer running alone in the morning for quiet time.（我比較喜歡早上獨自跑步，因為很安靜。）
- **我**：in morning before work
  - **AI**：That is a good habit. What time do you usually start running?　（這是很好的習慣。你通常什麼時候開始跑步？）〔22616 ms〕
  - 修正：in morning before work → **I run in the morning before work.**（我在上班前早上跑步。）— 這句話需要一個主詞，比如「I」，讓句子更完整。
  - 提示：I start at 7:00 AM every day to stay energetic.（我每天都七點開始，為了保持精力充沛。）
- **檢討**〔76103 ms〕：你回答得很清楚，對方能聽懂你的意思。我們練習瞭如何自然地問問題，做得很好。
  - 好：You used simple words clearly.
  - 好：You answered all the questions easily.
  - 好：You kept the conversation going well.
  - 改：i exercise two time one week in park → **I exercise twice a week in the park.**（我每週練兩次，在公園裡。）— Use 'twice' for two times. Add 'the' before park.
  - 改：because it near my home and free → **Because it is near my home and free.**（因為它離我家近且免費。）— Add 'is' to make the sentence complete.
  - 改：i like run → **I like running.**（我喜歡跑步。）— After 'like', use the verb form 'running'.
  - 句：How often do you...?（...你多久做一次？）
  - 句：It is near my home.（它離我家很近。）
  - 句：I like doing...（我喜歡做...）
  - 句：When do you usually...?（你通常什麼時候...？）
  - 句：That is a good habit.（那是個好習慣。）
  - 下次：Try to say 'twice' instead of 'two times' next time.

## 對話：自由聊天：週末去哪裡玩
- **AI**：Hi! What are you doing this weekend?　（嗨！週末你在做什麼？）〔28416 ms〕
- **我**：i go to mountain last weekend
  - **AI**：Oh, that sounds great! Did you climb a high mountain?　（喔，聽起來很棒！你爬高山嗎？）〔18499 ms〕
  - 修正：i go to mountain last weekend → **I went to the mountains last weekend.**（我上週末去了山區。）— 過去用 went；加 the 或 the mountains 比較自然。
  - 提示：Yes, it was very beautiful and fresh air.（是的，非常漂亮且空氣清新。）
- **我**：it is very beautiful but tired
  - **AI**：That makes sense. Did you take many photos?　（這很合理。你拍了很多照片嗎？）〔20654 ms〕
  - 修正：it is very beautiful but tired → **It was very beautiful, but I was tired.**（那裡很美，但我累了。）— 過去用 was；tired 是形容人，前面要加 I。
  - 提示：Yes, I took about fifty pictures.（是的，我拍了大約五十張。）
- **我**：with my family
  - **AI**：That's nice. Did you eat together at a restaurant?　（真棒。你們在餐廳一起吃過嗎？）〔14387 ms〕
  - 提示：Yes, we went to a small cafe.（是的，我們去了一家小咖啡廳。）
- **檢討**〔56661 ms〕：你分享了很棒的週末經歷！你的英語聽起來很自然。
  - 好：你用了簡單的問句來繼續對話。
  - 好：你的語氣很放鬆，讓人想聽下去。
  - 好：你清楚地表達了去山上的意思。
  - 改：i go to mountain last weekend → **I went to the mountain last weekend.**（我上週末去了那座山。）— 去過去的事情要用 'went'，而且 'mountain' 前面要加 'the'。
  - 改：it is very beautiful but tired → **It was very beautiful, but I was tired.**（它很美，但我累了。）— 上週末的事情要用過去式 'was' 和 'was'。
  - 句：It was a great trip.（這是一次很棒的路程。）
  - 句：I had a wonderful time.（我過得很開心。）
  - 句：We took many photos together.（我們一起拍了很多照片。）
  - 句：It was delicious.（很好吃。）
  - 句：Did you enjoy the view?（你喜歡那景色嗎？）
  - 下次：下次試著說 'I went' 來表達過去發生的事情。

## AI 產生聽力短文（AI 工作／介紹語音辨識系統）
〔75033 ms〕**醫院的語音助手**（Hospital Voice Assistant）
- Dr. Lee has a new idea.　（李醫生有個新想法。）
- She wants to use voice AI.　（她想用語音人工智慧。）
- The system speaks very fast.　（這個系統說話很快。）
- It helps doctors write notes.　（它幫助醫生寫筆記。）
- Doctors speak clearly to it.　（醫生清楚說話給它聽。）
- The machine understands Chinese well.　（機器很懂中文。）
- Q1 What does the AI help doctors do?（AI 幫助醫生做什麼？）答案：B. Write notes
- Q2 How does the doctor talk to the AI?（醫生跟 AI 怎麼說話？）答案：C. Very clear
- Q3 What language does the system understand?（系統懂什麼語言？）答案：C. Chinese

## 統計
- 產生 4567 個 token，共 817 秒
- 模型原始輸出含簡體字的次數：0（App 會自動轉成繁體）
## 發現的問題
- toeic-qa: 檢討 why_zh 沒有中文
- toeic-qa: 檢討 why_zh 沒有中文
- toeic-qa: 檢討 why_zh 沒有中文
