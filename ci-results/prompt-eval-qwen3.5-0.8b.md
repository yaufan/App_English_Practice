# 離線模型回覆檢查：qwen3.5-0.8b
難度：A2。用 llama.cpp 跑和 App 一樣的模型檔、prompt 和 JSON 格式（CI 電腦的速度不代表手機速度）。

## 對話：咖啡店點餐
- **AI**：Hi there! What can I get for you today?
- **我**：i want latte big
  - **AI**：Great! A big one, please?　（好的！一大杯，要嗎？）〔5358 ms〕
  - 提示：Can I get a hot coffee, or an iced one?（我想要一杯熱咖啡，或是冰拿鐵？）
- **我**：ice. and less sugar
  - **AI**：Perfect! Just ice and less sugar, please?　（好的！只是冰，少點糖，要嗎？）〔2953 ms〕
  - 提示：A small latte with ice and very little sugar, right?（請給我一杯小杯加冰的，少一點糖的。）
- **我**：我想要外帶
  - **AI**：Ah! A quick order for takeout, please?　（噢！外帶吧，要嗎？）〔3172 ms〕
  - 提示：I'd like a hot coffee or an iced one. How about a small takeaway?（我想要一杯熱咖啡或冰拿鐵。試試看小份的外賣吧。）
- **我**：how much
  - **AI**：One large cup, please?　（一個大杯的嗎？）〔2643 ms〕
  - 提示：Can I get a hot coffee or an iced one?（我想要一杯熱咖啡或冰拿鐵。）
- **我**：card ok?
  - **AI**：Perfect! A large cup, please?　（好的！一大杯，要嗎？）〔2953 ms〕
  - 提示：I'd like a hot coffee or an iced one. How about a takeaway?（我想要一杯熱咖啡或冰拿鐵。試試看外賣吧。）
- **檢討**〔17111 ms〕：今天的咖啡搭配得很棒！
  - 好：你清楚要加冰和少糖
  - 好：對外帶單杯很友善
  - 改：card ok? → **ok?**（好嗎？）— 將 'card' 改為 'okay'，因為對方在問是否接受你的提議
  - 改：Perfect! → **Great!**（太好了！）— 用 'Great' 替代 'Perfect'，表示更積極、更熱情的態度
  - 句：I'd love to have a drink for you.（我很想給你一杯咖啡。）
  - 句：Let's make a quick order for takeout.（讓我們快訂一份外帶單杯吧。）
  - 句：How much does it cost?（多少錢？）
  - 句：Sure, please.（好的，請。）
  - 下次：下次試著直接說 'I'd love to...'，或者用 'Let's make...' 來增加禮貌和熱情。

## 對話：解釋你的 AI 專案
- **AI**：So I heard your team built an AI tool. What does it do?
- **我**：it find problem in ultrasound picture
  - **AI**：Yes, it finds problems in ultrasound images. What kind of problems?　（是，它能找出超音波影像裡的問題。是什麼樣的問題？）〔5803 ms〕
  - 提示：It looks like the AI found a heart problem. Good!（這看起來像是 AI 發現了心臟問題。真好！）
- **我**：we use ten thousand image for train
  - **AI**：We use ten thousand images to teach the AI how to do things well. Do you want to see one?　（是的，我們用一千張圖片來教 AI 做什麼好。想要看一張嗎？）〔3333 ms〕
  - 提示：Ten thousand is a lot of data. Very good!（一千張圖片太多了。很好！）
- **我**：accuracy is ninety percent
  - **AI**：The AI is very accurate, using ten thousand images to learn how to do things well. Do you want to see one?　（AI 非常準確，使用一千張圖片來教它做什麼好。想要看一張嗎？）〔3561 ms〕
  - 提示：Ten thousand sounds like a lot of data. Very good!（一千張圖片太多了。很好！）
- **我**：doctor decide final
  - **AI**：Doctor, this is very accurate and reliable for medical use. What would you do with it?　（醫師，這非常準確且可靠。用於醫療用途的話會怎樣？）〔3354 ms〕
  - 提示：You can see the AI helps doctors find heart problems easily.（你可以看到 AI 幫醫師很容易找出心臟問題。）
- **我**：yes we use in hospital now
  - **AI**：Yes, we are using it at our hospital now. It is very helpful for patients. What would you like to do today?　（是的，現在我們醫院都使用它。非常有用。今天想做什麼？）〔3464 ms〕
  - 提示：It helps doctors find heart problems easily.（你可以看到 AI 幫醫師很容易找出心臟問題。）
- **檢討**〔15885 ms〕：今天我們聊得非常愉快！
  - 好：你提到使用千個影像訓練，語氣很自然且專注。
  - 好：你將準確率說成百分之九十，聽起來很有道理。
  - 句：We can see one of the images to test the AI's accuracy.（我們可以檢視一則影像來測試 AI 的準確度。）
  - 句：Doctors rely on this tool for their daily decisions.（醫生依賴這個工具進行日常決策。）
  - 句：We hope you can use it to help your patients make better choices.（我們希望你可以用它來幫助你的病人做出更好的選擇。）
  - 句：If you want to try it, let me show you how.（如果你想試試看，我可以為你示範一下。）
  - 下次：下次試著解釋一下圖解部分，看看是否容易理解。

## 對話：多益口說：回答問題
- **AI**：Imagine a friend is asking you about your free time. How often do you exercise, and where do you usually do it?
- **我**：i exercise two time one week in park
  - **AI**：Ah, that sounds like a good habit. Does it help you relax more when you come home?　（是啊，那聽起來是個不錯的習慣。回家會讓你更放鬆嗎？）〔6302 ms〕
  - 提示：Yes, exercising helps you feel refreshed when coming home.（是的，運動可以讓你回到家時精神更充沛。）
- **我**：because it near my home and free
  - **AI**：Ah, yes! If you go to the park, you can also get some exercise without spending too much time.　（是啊！如果去公園，可以同時做運動而不需要花太多時間。）〔3737 ms〕
  - 提示：Yes, it's convenient. You can walk or bike around.（是的，很方便。你可以走路或騎車環繞。）
- **我**：i like run
  - **AI**：Ah, you want to run? That sounds fun! Do you enjoy running alone or with friends?　（是啊！你想跑步嗎？這聽起來很有趣！你喜歡獨自跑還是與朋友一起跑？）〔3692 ms〕
  - 提示：Yes, it's great! You can run with friends or just yourself.（是的，很棒！你可以與朋友一起跑步，或者單獨跑步。）
- **我**：in morning before work
  - **AI**：Ah, morning? That sounds like a relaxing start to the day.　（啊，早上？這聽起來像開始一天的輕鬆開始。）〔3445 ms〕
  - 提示：Yes, mornings are great for starting the day. You can eat breakfast or take a walk.（是的，早晨是很好的開始。你可以吃早餐或走散步。）
- **檢討**〔11764 ms〕：今天的練習很有趣，你回答得很快！
  - 好：你提到公園鍛鍊很棒
  - 好：你對跑步的熱愛很自然
  - 句：You can get some exercise without spending too much time.（去公園鍛鍊不需要花太多時間。）
  - 句：It helps you relax more when you come home.（回家後會讓你更放鬆。）
  - 句：Morning is a relaxing start to the day.（上班前的早晨是清晨的開始。）
  - 下次：下次嘗試在公園散步，看看有沒有朋友一起跑。

## 對話：自由聊天：週末去哪裡玩
- **AI**：Hi! What are you looking for today?　（你好！今天你想玩什麼事？）〔5863 ms〕
- **我**：i go to mountain last weekend
  - **AI**：That sounds fun! Did you see any nice views?　（聽起來很有趣！看到了好風景嗎？）〔2581 ms〕
  - 提示：Did you see any interesting places on the mountain?（你看到過山邊有什麼有趣的景點嗎？）
- **我**：it is very beautiful but tired
  - **AI**：That is very common. Do you want to go somewhere else this weekend?　（這確實太常了。你想去哪裡玩這個週末？）〔2643 ms〕
  - 提示：You can suggest other places.（你可以提出其他地點嗎？）
- **我**：with my family
  - **AI**：That sounds like a good idea! Do you have any friends or family?　（這聽起來很好！你有家人還是朋友？）〔2737 ms〕
  - 提示：Do you have any relatives or friends to visit?（你還有家人或朋友嗎？）
- **檢討**〔11368 ms〕：今天的對話很棒，你提到了週末去山和看風景，對方也表達了期待。
  - 好：你提到週末的活動很具體
  - 好：對方詢問朋友家人的情況很有禮貌
  - 好：你沒有使用生僻詞彙
  - 句：Are you looking for a new place to visit?（你想去一個新地方嗎？）
  - 句：Do you have any family members nearby?（你有親戚或家人嗎？）
  - 句：What are your plans for the weekend?（你週末的計劃是什麼？）
  - 下次：下次嘗試用 'feel tired' 來描述身體累，或者把 'beautiful' 換成形容詞 'pretty'。

## AI 產生聽力短文（AI 工作／介紹語音辨識系統）
## 統計
- 產生 3895 個 token，共 152 秒
- 模型原始輸出含簡體字的次數：3（App 會自動轉成繁體）
## 發現的問題
- cafe: 學習者講中文，但沒有給英文說法
- toeic-qa: 句子太長（17 字）：Ah, yes! If you go to the park, you can also get some exercise without spending too much time.
- toeic-qa: 沒有用問句接話：Ah, yes! If you go to the park, you can also get some exercise without spending too much time.
- 短文：失敗 AI 這次寫的短文不能用（英文句子太少或混了中文），請再產生一次。
