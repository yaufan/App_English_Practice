# 離線模型回覆檢查：qwen3.5-4b
難度：A2。用 llama.cpp 跑和 App 一樣的模型檔、prompt 和 JSON 格式（CI 電腦的速度不代表手機速度）。

## 對話：咖啡店點餐
- **AI**：Hi there! What can I get for you today?
- **我**：i want latte big
  - **AI**：Great choice! Hot or iced for you?　（好選擇！要熱的還是冰的？）〔31702 ms〕
  - 提示：Iced, please.（請給我冰的。）
- **我**：ice. and less sugar
  - **AI**：Okay, will it be for here or to go?　（好，要帶走還是現場喝？）〔17039 ms〕
  - 修正：ice. and less sugar → **less sugar, please.**（請少放糖。）— 「and」在對話中通常省略；「less sugar」更自然。
  - 提示：It's for me to drink here.（我要在這裡喝。）
- **我**：我想要外帶
  - **AI**：Perfect! One large iced latte with less sugar, right?　（很好！一杯大杯冰拿鐵，少糖，對吧？）〔20095 ms〕
  - 修正：我想要外帶 → **I want to take it away.**（我要外帶。）— 用英文說「take it away」或「to go」。
  - 提示：Yes, please. Thank you.（好的，請了。謝謝。）
- **我**：how much
  - **AI**：It is $250 for that drink.　（那杯飲料是 250 元。）〔18138 ms〕
  - 修正：how much → **how much is it?**（它是多少錢？）— 加上 is it 語氣更自然。
  - 提示：Okay, I will pay now.（好的，我現在付錢。）
- **我**：card ok?
  - **AI**：Sure! What card do you want to use?　（沒問題！想用哪張卡？）〔18041 ms〕
  - 修正：card ok? → **is a card okay?**（可以用信用卡嗎？）— 加上 is...okay 語氣更自然。
  - 提示：Yes, my debit card.（好的，我刷我的儲蓄卡。）
- **檢討**〔68847 ms〕：你很清楚表達了想要外帶的需求，做得很好。語句雖然簡短，但對方能完全理解你的意思。
  - 好：你能清楚說出 'ice' 和 'less sugar'。
  - 好：你知道用 'card' 來付錢，很實用。
  - 好：你主動詢問價格，很有禮貌。
  - 改：i want latte big → **I want a big latte.**（我想要一杯大拿鐵。）— 加一點 'a' 和 'big' 放在前面更自然。
  - 改：card ok? → **Is card okay?**（可以用卡片嗎？）— 用 'Is... okay?' 詢問比較客氣。
  - 句：Could I have this to go, please?（請問我可以外帶這杯嗎？）
  - 句：How much is it for the drinks?（飲料要多少錢？）
  - 句：I would like a large iced coffee.（我想要一杯大冰咖啡。）
  - 句：Can I pay with my credit card?（我可以用信用卡付錢嗎？）
  - 句：Just a little less sugar, please.（請少放一點糖。）
  - 下次：試著說 'Could I have...' 來開始你的點餐請求。

## 對話：解釋你的 AI 專案
- **AI**：So I heard your team built an AI tool. What does it do?
- **我**：it find problem in ultrasound picture
  - **AI**：Cool! Does it read the pictures by itself?　（很棒！它會自己看照片嗎？）〔41816 ms〕
  - 修正：it find problem in ultrasound picture → **It finds problems in ultrasound pictures.**（它在超音波圖片中找出問題。）— 用 'finds' 表示一般現在時；'pictures' 比較自然。
  - 提示：Yes, it looks at the images and suggests what might be wrong.（是的，它看影像並建議什麼可能出錯。）
- **我**：we use ten thousand image for train
  - **AI**：Wow! That is a lot of data. How many doctors help with it?　（哇！那是很多資料。有多少位醫師幫忙呢？）〔27037 ms〕
  - 修正：we use ten thousand image for train → **We use 10,000 images to train.**（我們用 10,000 張圖片來訓練。）— 數字要加逗號；用 'train' 作動詞時要加 'to'；'image' 變複數。
  - 提示：Yes, five senior doctors check the results every day.（是的，五位資深醫師每天檢查結果。）
- **我**：accuracy is ninety percent
  - **AI**：That is very good! Do patients know about it?　（那很不錯！病患知道嗎？）〔17641 ms〕
  - 提示：Yes, we tell them it is a helpful tool for doctors.（是的，我們告訴他們這是一項幫助醫師的有用工具。）
- **我**：doctor decide final
  - **AI**：So the AI cannot make the final decision?　（所以 AI 不能做最後決定嗎？）〔21836 ms〕
  - 修正：doctor decide final → **The doctor makes the final decision.**（醫師做最終決定。）— 這裡需要主詞 'The doctor'；'makes' 比 'decide' 更自然。
  - 提示：Correct. The AI suggests, but the doctor says 'yes' or 'no'.（沒錯。AI 建議，但醫師說『是』或『否』。）
- **我**：yes we use in hospital now
  - **AI**：Great! Which hospital uses it today?　（太好了！哪家醫院現在在用？）〔22698 ms〕
  - 修正：yes we use in hospital now → **Yes, we use it in the hospital now.**（是的，我們在醫院現在使用它。）— 需要加代詞 'it' 指代工具；句子結構要完整。
  - 提示：We use it in a big city hospital right now.（我們目前在一家大城市醫院使用。）
- **檢討**〔92536 ms〕：你很清楚說明工具的功能，聽起來很自然。
你的句子有點簡短，但意思都傳達得不錯。
  - 好：你使用了 'ultrasound picture' 來說明檢查型別。
  - 好：你清楚表達了醫生有最終決定權。
  - 好：你用了 'ninety percent' 來說明準確度。
  - 改：it find problem in ultrasound picture → **It finds problems in ultrasound pictures.**（它在超音波圖片中找到問題。）— 'find' 是動詞，這裡需要加 's' 表示第三人稱單數。
  - 改：we use ten thousand image for train → **We use ten thousand images to train it.**（我們用一萬張圖片來訓練它。）— 'image' 是可數名詞，複數要加 's'；'train' 這裡要做成不定詞 'to train'。
  - 改：doctor decide final → **The doctor makes the final decision.**（醫生做最終決定。）— 'decide' 是動詞，這裡需要加助動詞 'makes' 並搭配 'decision'。
  - 改：yes we use in hospital now → **Yes, we use it in the hospital now.**（是的，我們現在在醫院使用它。）— 句子缺了代詞 'it' 指代工具；'hospital' 前通常加定冠詞 'the'。
  - 句：It helps doctors find problems quickly.（它幫助醫生快速找到問題。）
  - 句：The system is very accurate.（這個系統非常準確。）
  - 句：We use it in many hospitals today.（我們今天在許多醫院使用它。）
  - 句：Doctors always make the final decision.（醫生總是做最終決定。）
  - 句：It can read pictures by itself.（它可以自己讀圖片。）
  - 下次：試著把句子說完整，加上 's'、'to' 或 'the' 讓語法更正確。

## 對話：多益口說：回答問題
- **AI**：Imagine a friend is asking you about your free time. How often do you exercise, and where do you usually do it?
- **我**：i exercise two time one week in park
  - **AI**：That sounds great! Do you exercise alone or with friends?　（聽起來不錯！你是獨自運動還是和朋友一起？）〔42327 ms〕
  - 修正：i exercise two time one week in park → **I exercise two times a week at the park.**（我每週在公園運動兩次。）— 需要加 'times' 和介詞 'at'。
  - 提示：I exercise alone because I like quiet time.（我獨自運動，因為我喜歡安靜。）
- **我**：because it near my home and free
  - **AI**：That makes sense! Is it far from your workplace?　（這很有道理！它離你的工作地點遠嗎？）〔22609 ms〕
  - 修正：because it near my home and free → **because it is near my home and free.**（因為它離我家很近而且很自由。）— 缺少動詞 'is' 和連線詞 'and' 後的結構。
  - 提示：Yes, it is quite close to my office.（是的，它離我的辦公室很近。）
- **我**：i like run
  - **AI**：That is fun! Do you prefer running fast or slow?　（這很有趣！你喜歡跑得快還是跑得慢？）〔20393 ms〕
  - 修正：i like run → **I like to run.**（我喜歡跑步。）— 喜歡做動作後面通常要加 'to'。
  - 提示：I like to run slowly because it is relaxing.（我喜歡慢跑，因為很放鬆。）
- **我**：in morning before work
  - **AI**：Good idea! Do you usually run right after you wake up?　（好主意！你通常一醒來就跑嗎？）〔20455 ms〕
  - 修正：in morning before work → **in the morning before work.**（在早上上班之前。）— 通常需要加定冠詞 'the' 表示特指。
  - 提示：Yes, I run first thing in the morning.（是的，我每天早上第一件事就跑。）
- **檢討**〔70068 ms〕：你回答得很清楚，讓對話很流暢。你成功問了幾個問題，表現很好。
  - 好：你用了簡單的句子來說明想法。
  - 好：你很清楚表達自己的日常習慣。
  - 好：你聽懂問題並給出相關回答。
  - 改：i exercise two time one week in park → **I exercise twice a week at the park.**（我每週去公園練兩次。）— 用 'twice' 代替 'two time' 更自然。
  - 改：i like run → **I like to run.**（我喜歡跑步。）— 動詞前需要加 'to' 才正確。
  - 句：How often do you...?（你多久做...一次？）
  - 句：I usually...（我通常...）
  - 句：It is near my home.（它離我家很近。）
  - 句：Why do you like that?（你為什麼喜歡那樣？）
  - 句：That sounds great!（聽起來很棒！）
  - 下次：試著用完整句子回答，例如 'I run every morning.' (我每天早上跑步。)

## 對話：自由聊天：週末去哪裡玩
- **AI**：Hey! Where are you going this weekend?　（嘿！這個週末你要去哪裡？）〔26424 ms〕
- **我**：i go to mountain last weekend
  - **AI**：Oh nice! What did you do there?　（喔！不錯！你在那裡做了什麼？）〔18418 ms〕
  - 修正：i go to mountain last weekend → **I went to the mountain last weekend.**（我上個週末去山上。）— 「go」應該用過去式 went；加定冠詞 the。
  - 提示：I hiked up the hill with my friends.（我和朋友一起爬了山。）
- **我**：it is very beautiful but tired
  - **AI**：That sounds great! Did you take photos?　（聽起來很棒！你拍了照片嗎？）〔20946 ms〕
  - 修正：it is very beautiful but tired → **It was very beautiful, but I was tired.**（那裡很漂亮，但我很累。）— 描述過去的事情要用過去式；「I」是累的主語。
  - 提示：Yes, I took many photos of the flowers.（是的，我拍了很多花的照片。）
- **我**：with my family
  - **AI**：That is wonderful! Did you eat good food?　（那太棒了！你們吃了好吃的東西嗎？）〔14348 ms〕
  - 提示：Yes, we ate dumplings and rice.（是的，我們吃了餃子和飯。）
- **檢討**〔40374 ms〕：你說了很好的句子，讓我們知道你很開心。你的英文聽起來很自然，繼續加油！
  - 好：You used simple words clearly.
  - 好：Your grammar was mostly correct.
  - 好：You answered the questions easily.
  - 改：i go to mountain last weekend → **I went to the mountain last weekend.**（我上週六去了那座山。）— Use past tense 'went' and 'the' for places.
  - 句：I had a great time.（我玩得很開心。）
  - 句：Yes, we took many photos.（是的，我們拍了很多照片。）
  - 句：The food was delicious.（食物很好吃。）
  - 下次：Try to use 'went' instead of 'go' for past actions.

## AI 產生聽力短文（AI 工作／介紹語音辨識系統）
〔104945 ms〕**醫院的語音助手**（The Hospital Voice Assistant）
- Our team works at a hospital.　（我們的團隊在一家醫院工作。）
- We make a special AI system.　（我們開發了一個特殊的系統。）
- Doctors use it for meetings.　（醫生用它在會議中。）
- The system listens to their speech.　（系統聆聽他們說話。）
- It writes notes very fast.　（它很快地寫下筆記。）
- The project saves much time.　（這個專案節省很多時間。）
- We are happy with this work.　（我們對這份工作感到高興。）
- Q1 What does the AI system do?（這個 AI 系統做什麼？）答案：B) It writes notes from speech.
- Q2 Who uses the new system?（誰使用這個新系統？）答案：C) Doctors and the team.
- Q3 Why do they make the system?（為什麼他們要製作這個系統？）答案：A) To save time for doctors.

## 統計
- 產生 4336 個 token，共 799 秒
- 模型原始輸出含簡體字的次數：1（App 會自動轉成繁體）
## 發現的問題
- cafe: 沒有用問句接話：It is $250 for that drink.
- free: 檢討 why_zh 沒有中文
