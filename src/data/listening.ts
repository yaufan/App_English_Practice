import type { Category, Pair } from './scenarios';

export type Question = {
  q: string;
  qZh: string;
  options: string[];
  answer: number;
  explainZh: string;
};

export type Passage = {
  id: string;
  category: Category;
  title: string;
  titleEn: string;
  sentences: Pair[];
  questions: Question[];
  vocab: Pair[];
  generated?: boolean;
  createdAt?: number;
};

export const PASSAGES: Passage[] = [
  // ───────────── 日常 ─────────────
  {
    id: 'l-cafe',
    category: 'daily',
    title: '早上的咖啡店',
    titleEn: 'Morning at the café',
    sentences: [
      { en: 'Every morning, Lisa stops at a small café near her office.', zh: '每天早上，Lisa 都會在公司附近一家小咖啡店停一下。' },
      { en: 'She usually orders a medium hot latte.', zh: '她通常點一杯中杯熱拿鐵。' },
      { en: 'Today, the café is very busy, so she waits in line for ten minutes.', zh: '今天咖啡店很多人，所以她排了十分鐘。' },
      { en: 'When it is her turn, she decides to try something new.', zh: '輪到她的時候，她決定試試新的東西。' },
      { en: 'She orders an iced tea with less sugar and a banana muffin.', zh: '她點了一杯少糖冰茶和一個香蕉馬芬。' },
      { en: 'She pays by card and takes her order to go.', zh: '她刷卡付錢，然後外帶。' },
    ],
    questions: [
      { q: 'What does Lisa usually order?', qZh: 'Lisa 通常點什麼？', options: ['An iced tea', 'A medium hot latte', 'A banana muffin', 'A large coffee'], answer: 1, explainZh: '第二句：She usually orders a medium hot latte.' },
      { q: 'Why does she wait for ten minutes?', qZh: '她為什麼等了十分鐘？', options: ['The café is closed.', 'She forgot her card.', 'The café is very busy.', 'Her friend is late.'], answer: 2, explainZh: 'the café is very busy（店裡很忙）所以要排隊。' },
      { q: 'How does she pay?', qZh: '她怎麼付錢？', options: ['By cash', 'By card', 'With her phone', 'Her friend pays.'], answer: 1, explainZh: 'She pays by card（刷卡）。' },
    ],
    vocab: [
      { en: 'wait in line', zh: '排隊' },
      { en: "it is her turn", zh: '輪到她' },
      { en: 'less sugar', zh: '少糖' },
      { en: 'to go', zh: '外帶' },
    ],
  },
  {
    id: 'l-weekend',
    category: 'daily',
    title: '週末計畫',
    titleEn: 'Weekend plans',
    sentences: [
      { en: 'Hi Tom, this is Amy. Do you have any plans this Saturday?', zh: '嗨 Tom，我是 Amy。你這週六有什麼計畫嗎？' },
      { en: 'The weather will be sunny, so I want to go hiking.', zh: '天氣會是晴天，所以我想去爬山。' },
      { en: 'There is a nice trail about thirty minutes from the city.', zh: '離市區大約三十分鐘有一條不錯的步道。' },
      { en: 'We can meet at the train station at eight in the morning.', zh: '我們可以早上八點在火車站碰面。' },
      { en: 'After the hike, we can have lunch at a noodle shop near the trail.', zh: '爬完山，我們可以在步道附近的麵店吃午餐。' },
      { en: 'Please call me back and let me know. Bye!', zh: '請回電給我讓我知道。掰！' },
    ],
    questions: [
      { q: 'What does Amy want to do on Saturday?', qZh: 'Amy 週六想做什麼？', options: ['Go shopping', 'Go hiking', 'Watch a movie', 'Stay home'], answer: 1, explainZh: 'I want to go hiking（我想去爬山）。' },
      { q: 'Where will they meet?', qZh: '他們要在哪裡碰面？', options: ['At a noodle shop', "At Amy's home", 'At the train station', 'At the park'], answer: 2, explainZh: 'We can meet at the train station at eight.' },
      { q: 'What does Amy ask Tom to do?', qZh: 'Amy 請 Tom 做什麼？', options: ['Buy lunch', 'Call her back', 'Bring water', 'Drive a car'], answer: 1, explainZh: '最後一句：Please call me back（請回電）。' },
    ],
    vocab: [
      { en: 'plans', zh: '計畫' },
      { en: 'trail', zh: '步道' },
      { en: 'call me back', zh: '回電給我' },
    ],
  },
  {
    id: 'l-hotel',
    category: 'daily',
    title: '飯店廣播',
    titleEn: 'Hotel information',
    sentences: [
      { en: 'Welcome to the Harbor Hotel.', zh: '歡迎來到港灣飯店。' },
      { en: 'Breakfast is served from 6:30 to 10:00 on the second floor.', zh: '早餐在二樓，供應時間是 6:30 到 10:00。' },
      { en: 'The swimming pool and gym are open until 10 p.m.', zh: '游泳池和健身房開放到晚上十點。' },
      { en: 'Free Wi-Fi is available in all rooms. The password is on your key card holder.', zh: '所有房間都有免費 Wi-Fi，密碼在房卡套上。' },
      { en: 'Check-out time is 11 a.m.', zh: '退房時間是上午十一點。' },
      { en: 'If you need anything, please call the front desk by pressing zero.', zh: '如果需要任何東西，請按 0 打給櫃檯。' },
    ],
    questions: [
      { q: 'Where is breakfast served?', qZh: '早餐在哪裡？', options: ['In the lobby', 'On the second floor', 'Next to the pool', 'In your room'], answer: 1, explainZh: 'Breakfast is served … on the second floor.' },
      { q: 'Where can guests find the Wi-Fi password?', qZh: 'Wi-Fi 密碼在哪裡？', options: ['On the key card holder', 'At the gym', 'On the TV', 'In an email'], answer: 0, explainZh: 'The password is on your key card holder（房卡套上）。' },
      { q: 'How do guests call the front desk?', qZh: '怎麼打給櫃檯？', options: ['Press nine', 'Press one', 'Press zero', 'Use the app'], answer: 2, explainZh: 'by pressing zero（按 0）。' },
    ],
    vocab: [
      { en: 'served', zh: '（餐點）供應' },
      { en: 'available', zh: '可使用的' },
      { en: 'front desk', zh: '櫃檯' },
    ],
  },
  {
    id: 'l-doctor',
    category: 'daily',
    title: '打電話預約看醫生',
    titleEn: 'Making an appointment',
    sentences: [
      { en: "Good morning, City Clinic. How can I help you?", zh: '早安，城市診所，有什麼可以幫您？' },
      { en: "Hi, I'd like to make an appointment. I have a bad cough.", zh: '嗨，我想預約看診，我咳得很厲害。' },
      { en: 'Dr. Chen is available tomorrow at 2 p.m. or on Friday morning.', zh: '陳醫師明天下午兩點或星期五早上有空。' },
      { en: 'Tomorrow at 2 p.m. is good for me.', zh: '明天下午兩點我可以。' },
      { en: "Great. Please bring your health insurance card and come ten minutes early.", zh: '好的，請帶健保卡，並提早十分鐘到。' },
      { en: 'Thank you. See you tomorrow.', zh: '謝謝，明天見。' },
    ],
    questions: [
      { q: 'Why is the man calling?', qZh: '這位男士為什麼打電話？', options: ['To cancel an appointment', 'To make an appointment', 'To ask for directions', 'To buy medicine'], answer: 1, explainZh: "I'd like to make an appointment（我想預約）。" },
      { q: 'When will he see the doctor?', qZh: '他什麼時候看醫生？', options: ['Today', 'Tomorrow at 2 p.m.', 'Friday morning', 'Next week'], answer: 1, explainZh: 'Tomorrow at 2 p.m. is good for me.' },
      { q: 'What should he bring?', qZh: '他要帶什麼？', options: ['His passport', 'Cash only', 'His insurance card', 'A friend'], answer: 2, explainZh: 'bring your health insurance card（帶健保卡）。' },
    ],
    vocab: [
      { en: 'make an appointment', zh: '預約' },
      { en: 'cough', zh: '咳嗽' },
      { en: 'health insurance card', zh: '健保卡' },
    ],
  },

  // ───────────── AI 工作 ─────────────
  {
    id: 'l-ai-tool',
    category: 'work',
    title: '介紹一個醫療 AI 工具',
    titleEn: 'An AI tool for doctors',
    sentences: [
      { en: 'Our team built an AI tool that reads ultrasound images.', zh: '我們團隊做了一個判讀超音波影像的 AI 工具。' },
      { en: 'It helps doctors find possible problems faster.', zh: '它幫助醫師更快找出可能的問題。' },
      { en: 'We trained the model on about ten thousand images from our hospital.', zh: '我們用醫院大約一萬張影像訓練模型。' },
      { en: 'All the images were de-identified before training.', zh: '所有影像在訓練前都已去識別化。' },
      { en: 'In our test, the accuracy was about ninety percent.', zh: '在我們的測試中，準確率大約是百分之九十。' },
      { en: 'However, the doctor always makes the final decision.', zh: '不過，最後一定由醫師做決定。' },
    ],
    questions: [
      { q: 'What does the AI tool read?', qZh: '這個 AI 工具判讀什麼？', options: ['X-ray images', 'Ultrasound images', 'Medical notes', 'Blood tests'], answer: 1, explainZh: 'reads ultrasound images（判讀超音波影像）。' },
      { q: 'What happened to the images before training?', qZh: '訓練前影像做了什麼處理？', options: ['They were printed.', 'They were de-identified.', 'They were deleted.', 'They were sold.'], answer: 1, explainZh: 'de-identified（去識別化）。' },
      { q: 'Who makes the final decision?', qZh: '誰做最後的決定？', options: ['The AI', 'The engineer', 'The patient', 'The doctor'], answer: 3, explainZh: 'the doctor always makes the final decision.' },
    ],
    vocab: [
      { en: 'possible', zh: '可能的' },
      { en: 'de-identified', zh: '去識別化的' },
      { en: 'final decision', zh: '最終決定' },
    ],
  },
  {
    id: 'l-standup',
    category: 'work',
    title: '每週會議的進度報告',
    titleEn: 'A weekly update',
    sentences: [
      { en: "Hi everyone, here is a quick update from the AI team.", zh: '大家好，這是 AI 團隊的簡短進度更新。' },
      { en: 'This week, we finished cleaning the new dataset.', zh: '這週我們完成了新資料集的清理。' },
      { en: 'We also started training the second version of the model.', zh: '我們也開始訓練第二版模型。' },
      { en: 'One problem is that the GPU server is very busy.', zh: '有一個問題是 GPU 伺服器非常忙。' },
      { en: 'Training may take two more days than we planned.', zh: '訓練可能會比計畫多花兩天。' },
      { en: 'We still think we can finish everything by the end of the month.', zh: '我們還是認為可以在月底前全部完成。' },
    ],
    questions: [
      { q: 'What did the team finish this week?', qZh: '團隊這週完成了什麼？', options: ['Training the model', 'Cleaning the dataset', 'Buying a server', 'Writing a paper'], answer: 1, explainZh: 'we finished cleaning the new dataset.' },
      { q: 'What is the problem?', qZh: '問題是什麼？', options: ['The data is lost.', 'A member is sick.', 'The GPU server is very busy.', 'The budget is too small.'], answer: 2, explainZh: 'the GPU server is very busy.' },
      { q: 'When do they expect to finish?', qZh: '他們預計什麼時候完成？', options: ['Tomorrow', 'Next week', 'By the end of the month', 'Next year'], answer: 2, explainZh: 'by the end of the month（月底前）。' },
    ],
    vocab: [
      { en: 'quick update', zh: '簡短更新' },
      { en: 'version', zh: '版本' },
      { en: 'than we planned', zh: '比我們計畫的' },
    ],
  },
  {
    id: 'l-voice',
    category: 'work',
    title: '語音辨識寫病歷',
    titleEn: 'Speech recognition in the clinic',
    sentences: [
      { en: 'Doctors spend a lot of time typing medical notes.', zh: '醫師花很多時間打病歷。' },
      { en: 'With speech recognition, they can speak instead of type.', zh: '有了語音辨識，他們可以用說的取代打字。' },
      { en: 'The system changes their voice into text in real time.', zh: '系統即時把他們的聲音轉成文字。' },
      { en: 'Then an AI model puts the text into a clear format.', zh: '接著 AI 模型把文字整理成清楚的格式。' },
      { en: 'The doctor checks the note and fixes any mistakes.', zh: '醫師檢查紀錄並修正錯誤。' },
      { en: 'Many doctors say it saves them about one hour a day.', zh: '很多醫師說這一天幫他們省下大約一小時。' },
    ],
    questions: [
      { q: 'What do doctors spend a lot of time on?', qZh: '醫師花很多時間在什麼事上？', options: ['Meetings', 'Typing medical notes', 'Driving', 'Reading emails'], answer: 1, explainZh: 'typing medical notes（打病歷）。' },
      { q: 'What does the AI model do?', qZh: 'AI 模型做什麼？', options: ['It sees patients.', 'It puts the text into a clear format.', 'It writes emails.', 'It orders medicine.'], answer: 1, explainZh: 'puts the text into a clear format（整理成清楚的格式）。' },
      { q: 'How much time does it save?', qZh: '它省下多少時間？', options: ['About ten minutes a week', 'About one hour a day', 'About one day a month', 'No time'], answer: 1, explainZh: 'about one hour a day.' },
    ],
    vocab: [
      { en: 'instead of', zh: '取代；而不是' },
      { en: 'in real time', zh: '即時' },
      { en: 'format', zh: '格式' },
    ],
  },
  {
    id: 'l-vendor',
    category: 'work',
    title: '廠商的語音留言',
    titleEn: 'A voicemail from a vendor',
    sentences: [
      { en: "Hello, this is Mark from Nova Systems.", zh: '您好，我是 Nova Systems 的 Mark。' },
      { en: "I'm calling about the AI server you asked about last week.", zh: '我打來是關於您上週詢問的 AI 伺服器。' },
      { en: 'We can deliver it in about six weeks.', zh: '我們大約六週可以交貨。' },
      { en: 'The price includes installation and one year of technical support.', zh: '價格包含安裝和一年的技術支援。' },
      { en: "I'll send you a detailed quote by email this afternoon.", zh: '我今天下午會用電子郵件寄詳細報價給您。' },
      { en: 'If you have any questions, please call me at extension 215.', zh: '如果有任何問題，請打分機 215 給我。' },
    ],
    questions: [
      { q: 'Why is Mark calling?', qZh: 'Mark 為什麼打電話？', options: ['To cancel an order', 'About an AI server', 'To ask for a job', 'To change a meeting'], answer: 1, explainZh: "I'm calling about the AI server …" },
      { q: 'What is included in the price?', qZh: '價格包含什麼？', options: ['Two years of support', 'Free training courses', 'Installation and one year of support', 'Nothing else'], answer: 2, explainZh: 'installation and one year of technical support.' },
      { q: 'How will Mark send the quote?', qZh: 'Mark 會怎麼寄報價？', options: ['By mail', 'By email', 'By fax', 'In person'], answer: 1, explainZh: 'by email this afternoon.' },
    ],
    vocab: [
      { en: 'deliver', zh: '交貨' },
      { en: 'installation', zh: '安裝' },
      { en: 'quote', zh: '報價' },
      { en: 'extension', zh: '分機' },
    ],
  },

  // ───────────── 考試 ─────────────
  {
    id: 'l-toeic-announce',
    category: 'exam',
    title: '多益 Part 4：機場廣播',
    titleEn: 'Airport announcement',
    sentences: [
      { en: 'Attention, passengers on Flight 208 to Tokyo.', zh: '搭乘 208 班機前往東京的旅客請注意。' },
      { en: 'Because of bad weather, the departure time has been changed to 4:30 p.m.', zh: '由於天候不佳，起飛時間改為下午 4:30。' },
      { en: 'The flight will now leave from Gate 12 instead of Gate 7.', zh: '班機改從 12 號登機門出發，而不是 7 號。' },
      { en: 'We are sorry for the delay.', zh: '很抱歉造成延誤。' },
      { en: 'Passengers can get a free meal coupon at the service desk.', zh: '旅客可以到服務台領取免費餐券。' },
      { en: 'Please show your boarding pass to receive it.', zh: '請出示登機證領取。' },
    ],
    questions: [
      { q: 'Why has the departure time changed?', qZh: '起飛時間為什麼改了？', options: ['A technical problem', 'Bad weather', 'A late crew', 'A full flight'], answer: 1, explainZh: 'Because of bad weather.' },
      { q: 'Where will the flight leave from now?', qZh: '現在從哪個登機門出發？', options: ['Gate 7', 'Gate 8', 'Gate 12', 'Gate 21'], answer: 2, explainZh: 'from Gate 12 instead of Gate 7.' },
      { q: 'What must passengers show to get a meal coupon?', qZh: '要出示什麼才能拿餐券？', options: ['A passport', 'A boarding pass', 'A receipt', 'A credit card'], answer: 1, explainZh: 'show your boarding pass.' },
    ],
    vocab: [
      { en: 'attention', zh: '請注意' },
      { en: 'departure time', zh: '起飛時間' },
      { en: 'instead of', zh: '而不是' },
      { en: 'boarding pass', zh: '登機證' },
    ],
  },
  {
    id: 'l-toeic-office',
    category: 'exam',
    title: '多益 Part 3：辦公室對話',
    titleEn: 'A printer problem',
    sentences: [
      { en: 'Hi Kevin, the printer on our floor is not working again.', zh: '嗨 Kevin，我們這層的印表機又壞了。' },
      { en: 'I need to print the sales report for the meeting at ten.', zh: '我需要印十點會議要用的業務報告。' },
      { en: 'Oh no. The repair person can only come tomorrow.', zh: '糟糕，維修人員明天才能來。' },
      { en: 'You can use the printer on the third floor for now.', zh: '你可以先用三樓的印表機。' },
      { en: 'Great idea. Can you tell the manager the meeting might start a few minutes late?', zh: '好主意。你可以跟經理說會議可能會晚幾分鐘開始嗎？' },
      { en: "Sure, I'll send her a message now.", zh: '好，我現在傳訊息給她。' },
    ],
    questions: [
      { q: 'What is the problem?', qZh: '問題是什麼？', options: ['The meeting is canceled.', 'The printer is not working.', 'The report is lost.', 'The manager is sick.'], answer: 1, explainZh: 'the printer … is not working again.' },
      { q: 'What does the man suggest?', qZh: '男士建議什麼？', options: ['Call the manager', 'Buy a new printer', 'Use the printer on the third floor', 'Cancel the meeting'], answer: 2, explainZh: 'use the printer on the third floor for now.' },
      { q: 'What will the man do next?', qZh: '男士接下來會做什麼？', options: ['Fix the printer', 'Send a message to the manager', 'Print the report', 'Go home'], answer: 1, explainZh: "I'll send her a message now." },
    ],
    vocab: [
      { en: 'not working', zh: '故障' },
      { en: 'repair person', zh: '維修人員' },
      { en: 'for now', zh: '暫時；目前' },
    ],
  },
  {
    id: 'l-ielts-hometown',
    category: 'exam',
    title: '雅思 Part 1：家鄉',
    titleEn: 'Talking about my hometown',
    sentences: [
      { en: 'I come from Taoyuan, a city in northern Taiwan.', zh: '我來自桃園，台灣北部的一個城市。' },
      { en: 'It is close to the international airport, so it is very convenient for travel.', zh: '它離國際機場很近，所以出國很方便。' },
      { en: 'In the past, it was mainly an industrial city.', zh: '以前它主要是工業城市。' },
      { en: 'Now there are more parks, shopping malls and new apartments.', zh: '現在有更多公園、購物中心和新公寓。' },
      { en: 'What I like most is the food at the night markets.', zh: '我最喜歡的是夜市的食物。' },
      { en: 'The only problem is that the traffic can be quite bad.', zh: '唯一的問題是交通有時很塞。' },
    ],
    questions: [
      { q: 'Why is Taoyuan convenient for travel?', qZh: '為什麼桃園出國方便？', options: ['It has many hotels.', 'It is close to the airport.', 'It has a big port.', 'It is in the south.'], answer: 1, explainZh: 'close to the international airport.' },
      { q: 'What was Taoyuan like in the past?', qZh: '桃園以前是怎樣的城市？', options: ['A farming town', 'A tourist city', 'An industrial city', 'A university town'], answer: 2, explainZh: 'mainly an industrial city.' },
      { q: 'What problem does the speaker mention?', qZh: '說話者提到什麼問題？', options: ['The weather', 'The traffic', 'The food', 'The noise'], answer: 1, explainZh: 'the traffic can be quite bad.' },
    ],
    vocab: [
      { en: 'convenient', zh: '方便的' },
      { en: 'industrial', zh: '工業的' },
      { en: 'What I like most is …', zh: '我最喜歡的是……' },
    ],
  },
  {
    id: 'l-toeic-job',
    category: 'exam',
    title: '多益 Part 4：徵才廣告',
    titleEn: 'A job advertisement',
    sentences: [
      { en: 'Bright Health is looking for a data engineer to join our team in Taipei.', zh: 'Bright Health 正在徵一位資料工程師，加入我們台北的團隊。' },
      { en: 'Applicants should have at least two years of experience with Python.', zh: '應徵者需要至少兩年 Python 經驗。' },
      { en: 'Experience in healthcare is a plus but not required.', zh: '有醫療產業經驗會加分，但不是必要條件。' },
      { en: 'The position offers flexible working hours and a yearly bonus.', zh: '這個職位提供彈性工時和年終獎金。' },
      { en: 'To apply, please upload your résumé on our website by March 31.', zh: '應徵請在 3 月 31 日前到我們的網站上傳履歷。' },
      { en: 'Only selected applicants will be contacted for an interview.', zh: '只有入選的應徵者會被通知面試。' },
    ],
    questions: [
      { q: 'What position is the company hiring for?', qZh: '公司在徵什麼職位？', options: ['A nurse', 'A data engineer', 'A sales manager', 'A designer'], answer: 1, explainZh: 'looking for a data engineer.' },
      { q: 'What is NOT required?', qZh: '什麼「不是」必要條件？', options: ['Python experience', 'A résumé', 'Experience in healthcare', 'Applying by March 31'], answer: 2, explainZh: 'Experience in healthcare is a plus but not required.' },
      { q: 'What does the job offer?', qZh: '這份工作提供什麼？', options: ['A free car', 'Flexible working hours', 'Free housing', 'Six months of vacation'], answer: 1, explainZh: 'flexible working hours and a yearly bonus.' },
    ],
    vocab: [
      { en: 'applicant', zh: '應徵者' },
      { en: 'a plus', zh: '加分條件' },
      { en: 'flexible working hours', zh: '彈性工時' },
      { en: 'bonus', zh: '獎金' },
    ],
  },
];
