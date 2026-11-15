export type Category = 'daily' | 'work' | 'exam';

export type Pair = { en: string; zh: string };

export type Scenario = {
  id: string;
  category: Category;
  icon: string;
  title: string;
  titleEn: string;
  aiRole: string;
  userRole: string;
  setting: string;
  goal: string;
  goalZh: string;
  opener: Pair;
  openerHint: Pair;
  phrases: Pair[];
  examiner?: boolean;
};

export const CATEGORY_LABEL: Record<Category, string> = {
  daily: '日常生活',
  work: 'AI 工作',
  exam: '考試口說',
};

export const SCENARIOS: Scenario[] = [
  // ───────────── 日常 ─────────────
  {
    id: 'cafe',
    category: 'daily',
    icon: 'coffee',
    title: '咖啡店點餐',
    titleEn: 'Ordering at a café',
    aiRole: 'a friendly barista at a coffee shop',
    userRole: 'a customer',
    setting: 'A busy coffee shop in the morning.',
    goal: 'The customer orders a drink (size, hot or iced, for here or to go) and pays.',
    goalZh: '點一杯飲料（大小、冰熱、內用外帶），然後結帳',
    opener: { en: 'Hi there! What can I get for you today?', zh: '嗨！今天想喝點什麼？' },
    openerHint: { en: 'Can I get a large iced latte, please?', zh: '請給我一杯大杯冰拿鐵。' },
    phrases: [
      { en: 'Can I get a …, please?', zh: '請給我一杯／一個……' },
      { en: 'For here, please. / To go, please.', zh: '內用。／外帶。' },
      { en: 'Less ice, please.', zh: '少冰，謝謝。' },
      { en: 'Can I pay by card?', zh: '可以刷卡嗎？' },
    ],
  },
  {
    id: 'directions',
    category: 'daily',
    icon: 'map-signs',
    title: '問路',
    titleEn: 'Asking for directions',
    aiRole: 'a helpful local person on the street',
    userRole: 'a tourist who wants to find the train station',
    setting: 'A street corner in a city the learner is visiting.',
    goal: 'The tourist finds out how to get to the train station and how long it takes.',
    goalZh: '問到怎麼去火車站、要走多久',
    opener: { en: 'Hi! You look a little lost. Can I help you?', zh: '嗨！你好像有點迷路，需要幫忙嗎？' },
    openerHint: { en: 'Yes, please. How do I get to the train station?', zh: '好，麻煩你。請問火車站怎麼走？' },
    phrases: [
      { en: 'How do I get to …?', zh: '請問……怎麼去？' },
      { en: 'Is it far from here?', zh: '離這裡遠嗎？' },
      { en: 'Should I turn left or right?', zh: '我該左轉還是右轉？' },
      { en: 'Could you say that again, please?', zh: '可以請你再說一次嗎？' },
    ],
  },
  {
    id: 'hotel',
    category: 'daily',
    icon: 'bed',
    title: '飯店入住',
    titleEn: 'Checking in at a hotel',
    aiRole: 'a front desk clerk at a hotel',
    userRole: 'a guest who has a reservation',
    setting: 'The front desk of a hotel in the evening.',
    goal: 'The guest checks in, asks about breakfast time and Wi-Fi, and gets the room key.',
    goalZh: '辦好入住，問早餐時間和 Wi-Fi，拿到房卡',
    opener: { en: 'Good evening! Welcome to the Harbor Hotel. Are you checking in?', zh: '晚安！歡迎來到港灣飯店。您要辦理入住嗎？' },
    openerHint: { en: 'Yes, I have a reservation under the name Fan.', zh: '對，我有用 Fan 這個名字訂房。' },
    phrases: [
      { en: 'I have a reservation under …', zh: '我用……的名字訂了房' },
      { en: 'What time is breakfast?', zh: '早餐幾點？' },
      { en: "What's the Wi-Fi password?", zh: 'Wi-Fi 密碼是什麼？' },
      { en: 'What time is check-out?', zh: '幾點要退房？' },
    ],
  },
  {
    id: 'smalltalk',
    category: 'daily',
    icon: 'smile-o',
    title: '認識新朋友',
    titleEn: 'Meeting someone new',
    aiRole: 'Alex, a friendly person at a meetup event',
    userRole: 'a person meeting Alex for the first time',
    setting: 'A casual meetup event. Light small talk about names, jobs, hobbies and weekends.',
    goal: 'Both people introduce themselves and talk about work and hobbies a little.',
    goalZh: '互相自我介紹，聊一點工作和興趣',
    opener: { en: "Hi, I'm Alex. Nice to meet you! What's your name?", zh: '嗨，我是 Alex，很高興認識你！你叫什麼名字？' },
    openerHint: { en: "Hi Alex, I'm Fan. Nice to meet you too.", zh: '嗨 Alex，我是 Fan，我也很高興認識你。' },
    phrases: [
      { en: 'Nice to meet you too.', zh: '我也很高興認識你。' },
      { en: 'What do you do?', zh: '你是做什麼工作的？' },
      { en: 'In my free time, I like to …', zh: '我有空的時候喜歡……' },
      { en: 'How about you?', zh: '那你呢？' },
    ],
  },
  {
    id: 'restaurant',
    category: 'daily',
    icon: 'cutlery',
    title: '餐廳點餐',
    titleEn: 'Ordering at a restaurant',
    aiRole: 'a waiter at a casual restaurant',
    userRole: 'a customer having dinner',
    setting: 'A casual restaurant at dinner time.',
    goal: 'The customer asks for a recommendation, orders a main dish and a drink, and asks for the bill.',
    goalZh: '請服務生推薦、點主餐和飲料，最後請他結帳',
    opener: { en: 'Good evening! Are you ready to order, or do you need a few more minutes?', zh: '晚安！您準備好點餐了嗎？還是需要再看一下？' },
    openerHint: { en: 'What do you recommend?', zh: '你推薦什麼？' },
    phrases: [
      { en: 'What do you recommend?', zh: '你推薦什麼？' },
      { en: "I'll have the …", zh: '我要……' },
      { en: 'Is it spicy?', zh: '這會辣嗎？' },
      { en: 'Can I have the bill, please?', zh: '麻煩幫我結帳。' },
    ],
  },
  {
    id: 'shopping',
    category: 'daily',
    icon: 'shopping-bag',
    title: '買衣服',
    titleEn: 'Shopping for clothes',
    aiRole: 'a shop assistant in a clothing store',
    userRole: 'a customer looking for a jacket',
    setting: 'A clothing store.',
    goal: 'The customer asks about size, color and price, tries something on, and decides to buy or not.',
    goalZh: '問尺寸、顏色、價格，試穿後決定買不買',
    opener: { en: 'Hi, welcome in! Are you looking for anything special today?', zh: '嗨，歡迎光臨！今天有特別在找什麼嗎？' },
    openerHint: { en: "I'm looking for a jacket in a medium size.", zh: '我在找一件 M 號的外套。' },
    phrases: [
      { en: "I'm looking for …", zh: '我在找……' },
      { en: 'Do you have this in black?', zh: '這件有黑色的嗎？' },
      { en: 'Can I try it on?', zh: '我可以試穿嗎？' },
      { en: "I'll take it.", zh: '我要買這件。' },
    ],
  },

  // ───────────── AI 工作 ─────────────
  {
    id: 'intro-work',
    category: 'work',
    icon: 'id-badge',
    title: '介紹你的工作',
    titleEn: 'Talking about your job',
    aiRole: 'a researcher from Europe at an international medical AI conference',
    userRole: 'a medical AI engineer from a hospital in Taiwan',
    setting: 'A coffee break at an international conference about AI in healthcare.',
    goal: 'The learner explains what they do, what their team works on, and asks the other person about their work.',
    goalZh: '說明自己做什麼、團隊在做什麼，也問對方的工作',
    opener: { en: 'Hi, I saw your poster earlier. What do you work on?', zh: '嗨，我剛剛有看到你的海報。你是做什麼研究的？' },
    openerHint: { en: 'I work on medical AI at a hospital in Taiwan.', zh: '我在台灣一家醫院做醫療 AI。' },
    phrases: [
      { en: 'I work on medical AI at a hospital.', zh: '我在醫院做醫療 AI。' },
      { en: 'My team helps doctors use AI tools.', zh: '我的團隊協助醫師使用 AI 工具。' },
      { en: "I'm in charge of …", zh: '我負責……' },
      { en: 'What about your research?', zh: '那你的研究呢？' },
    ],
  },
  {
    id: 'explain-project',
    category: 'work',
    icon: 'lightbulb-o',
    title: '解釋你的 AI 專案',
    titleEn: 'Explaining your AI project',
    aiRole: 'a curious doctor visiting from a hospital in the United States',
    userRole: 'the engineer who built a medical AI tool',
    setting: "A hospital visit. The doctor wants to understand the learner's AI tool in simple words.",
    goal: 'The learner explains what the tool does, what data it uses, how accurate it is, and how doctors use it.',
    goalZh: '說明工具做什麼、用什麼資料、準確度、醫師怎麼用',
    opener: { en: 'So I heard your team built an AI tool. What does it do?', zh: '聽說你們團隊做了一個 AI 工具，它是做什麼的？' },
    openerHint: { en: 'It helps doctors find problems in ultrasound images.', zh: '它幫醫師在超音波影像裡找出問題。' },
    phrases: [
      { en: 'It helps doctors …', zh: '它幫助醫師……' },
      { en: 'We trained the model on … images.', zh: '我們用……張影像訓練模型。' },
      { en: 'The accuracy is about … percent.', zh: '準確率大約是百分之……' },
      { en: 'The doctor still makes the final decision.', zh: '最後還是由醫師做決定。' },
    ],
  },
  {
    id: 'meeting',
    category: 'work',
    icon: 'video-camera',
    title: '線上會議報告進度',
    titleEn: 'Giving an update in a meeting',
    aiRole: 'Jordan, a project manager from a partner company in the US, leading an online meeting',
    userRole: 'a team member giving a progress update',
    setting: 'A weekly online project meeting.',
    goal: 'The learner gives a short update, mentions one problem, and agrees on the next step and deadline.',
    goalZh: '簡短報告進度、提出一個問題、確認下一步和期限',
    opener: { en: 'Hi everyone, thanks for joining. Can you give us a quick update on your part?', zh: '大家好，謝謝參加。可以簡單更新一下你負責的部分嗎？' },
    openerHint: { en: 'Sure. We finished the data cleaning this week.', zh: '好的。我們這週完成了資料清理。' },
    phrases: [
      { en: 'We finished … this week.', zh: '我們這週完成了……' },
      { en: "We're having a problem with …", zh: '我們在……遇到一個問題。' },
      { en: 'Could you send me the file?', zh: '可以把檔案寄給我嗎？' },
      { en: 'We can finish it by Friday.', zh: '我們可以在星期五前完成。' },
    ],
  },
  {
    id: 'vendor',
    category: 'work',
    icon: 'server',
    title: '跟國外廠商談需求',
    titleEn: 'Talking with a vendor',
    aiRole: 'a sales engineer from a company that sells AI servers',
    userRole: 'a hospital engineer who needs a server to run AI models on-site',
    setting: 'A video call with a vendor.',
    goal: 'The learner explains their needs (on-site, number of models, budget, timeline) and asks about price and support.',
    goalZh: '說明需求（院內部署、模型數量、預算、時程），詢問價格和售後支援',
    opener: { en: 'Thanks for meeting with us. What kind of system are you looking for?', zh: '謝謝您跟我們開會。您在找什麼樣的系統？' },
    openerHint: { en: 'We need a server to run AI models inside our hospital.', zh: '我們需要一台在醫院內部跑 AI 模型的伺服器。' },
    phrases: [
      { en: 'We need …', zh: '我們需要……' },
      { en: 'It has to run inside the hospital.', zh: '它必須在醫院內部運作。' },
      { en: "What's the price?", zh: '價格是多少？' },
      { en: 'Do you provide technical support?', zh: '你們有提供技術支援嗎？' },
    ],
  },

  // ───────────── 考試 ─────────────
  {
    id: 'toeic-qa',
    category: 'exam',
    icon: 'pencil-square-o',
    title: '多益口說：回答問題',
    titleEn: 'TOEIC Speaking: Respond to questions',
    aiRole: 'a TOEIC Speaking test examiner',
    userRole: 'a test taker',
    setting:
      'TOEIC Speaking "respond to questions" style. Imagine a friend or a research company asks about everyday topics (free time, shopping, food, travel, work). Ask one short question at a time.',
    goal: 'Ask about 5 related questions on one everyday topic. After each answer, briefly react and ask the next question.',
    goalZh: '針對一個日常主題回答約 5 題',
    opener: {
      en: 'Imagine a friend is asking you about your free time. How often do you exercise, and where do you usually do it?',
      zh: '假設朋友在問你空閒時間的事。你多久運動一次？通常在哪裡運動？',
    },
    openerHint: { en: 'I exercise about twice a week, usually at a park near my home.', zh: '我大約一週運動兩次，通常在我家附近的公園。' },
    phrases: [
      { en: 'I usually … about … times a week.', zh: '我通常一週……大約……次。' },
      { en: 'The main reason is that …', zh: '主要的原因是……' },
      { en: 'For example, …', zh: '舉例來說，……' },
      { en: "That's why I prefer …", zh: '這就是為什麼我比較喜歡……' },
    ],
    examiner: true,
  },
  {
    id: 'ielts-part1',
    category: 'exam',
    icon: 'graduation-cap',
    title: '雅思口說 Part 1',
    titleEn: 'IELTS Speaking Part 1',
    aiRole: 'an IELTS Speaking examiner',
    userRole: 'a test taker',
    setting: 'IELTS Speaking Part 1: short questions about the test taker, their work, hometown, and daily life.',
    goal: 'Ask about 6 short questions: name, work, hometown, and one everyday topic.',
    goalZh: '回答約 6 題：名字、工作、家鄉、一個日常主題',
    opener: { en: 'Good afternoon. Can you tell me your full name, please?', zh: '午安。可以告訴我你的全名嗎？' },
    openerHint: { en: 'My full name is …, but you can call me Fan.', zh: '我的全名是……，你可以叫我 Fan。' },
    phrases: [
      { en: 'I work as … at …', zh: '我在……擔任……' },
      { en: "I'm from … It's a … city.", zh: '我來自……，那是一個……的城市。' },
      { en: 'To be honest, …', zh: '老實說，……' },
      { en: 'I think the main reason is …', zh: '我想主要的原因是……' },
    ],
    examiner: true,
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

/** A free-talk scenario built from a topic the learner types. */
export function freeTalkScenario(topic: string): Scenario {
  return {
    id: 'free',
    category: 'daily',
    icon: 'comments-o',
    title: `自由聊天：${topic}`,
    titleEn: 'Free talk',
    aiRole: 'a friendly English-speaking friend',
    userRole: 'the learner',
    setting: `A relaxed chat between friends. Topic chosen by the learner: "${topic}".`,
    goal: 'Have a relaxed conversation about the topic. Keep it going with simple questions.',
    goalZh: `聊「${topic}」`,
    opener: { en: '', zh: '' },
    openerHint: { en: '', zh: '' },
    phrases: [
      { en: 'I think …', zh: '我覺得……' },
      { en: 'What about you?', zh: '那你呢？' },
      { en: "I'm not sure how to say it in English.", zh: '我不知道英文怎麼說。' },
      { en: 'Could you speak more slowly?', zh: '可以講慢一點嗎？' },
    ],
  };
}
