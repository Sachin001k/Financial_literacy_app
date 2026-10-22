import type { AssessmentQuestion, Category, Lesson } from './lesson-types';

export const CATEGORIES: Category[] = [
  { slug: 'money-basics', title: 'Money Basics', icon: '💰', blurb: 'What money is, where it goes and why prices rise.', color: '#22c55e', order: 1 },
  { slug: 'budgeting-saving', title: 'Budgeting & Saving', icon: '🐷', blurb: 'Plan your spending and build a safety net.', color: '#f59e0b', order: 2 },
  { slug: 'banking-payments', title: 'Banking & UPI', icon: '🏦', blurb: 'Bank accounts, UPI and staying safe online.', color: '#0ea5e9', order: 3 },
  { slug: 'investing', title: 'Investing', icon: '📈', blurb: 'Stocks, diversification and compounding.', color: '#6366f1', order: 4 },
  { slug: 'risk-protection', title: 'Risk & Protection', icon: '🛡️', blurb: 'Insurance, loans and spotting scams.', color: '#ef4444', order: 5 },
];

export const LESSONS: Lesson[] = [
  // ───────── Money Basics ─────────
  {
    slug: 'what-is-money',
    category: 'money-basics',
    title: 'What is money, really?',
    summary: 'Money is a tool for swapping value. Learn its three jobs.',
    body: `Before money, people traded goods directly: rice for cloth, a goat for tools. This is called **barter**, and it only works when both people want what the other has.

## The three jobs of money
- **Medium of exchange:** you can swap it for almost anything.
- **Store of value:** you can save it today and spend it later.
- **Unit of account:** it lets you compare prices, like ₹40 tea vs ₹120 coffee.

## Money comes in many forms
Coins and notes are only a small part. Most money today lives as numbers in bank accounts and moves through UPI, cards and net banking. It is still real money, just digital.

## Earning, spending, saving
Every rupee you earn can be **spent**, **saved** or **invested**. Learning to balance these three is the heart of personal finance.`,
    example: {
      title: 'Riya’s first stipend',
      body: 'Riya gets a ₹5,000 internship stipend. She spends ₹3,000 on travel and food, saves ₹1,500 in her bank account, and puts ₹500 in a mutual fund SIP. In one month she used money for all three jobs.',
    },
    readMinutes: 3,
    xpReward: 20,
    practiseGameSlug: 'money-challenges',
    order: 1,
    questions: [
      {
        prompt: 'What is the main problem with barter?',
        options: ['It is illegal', 'Both people must want what the other has', 'It needs a bank account', 'It only works online'],
        correctIndex: 1,
        explanation: 'Barter needs a “double coincidence of wants”. Money solves this because everyone accepts it.',
      },
      {
        prompt: 'Comparing a ₹40 tea with a ₹120 coffee uses money as a…',
        options: ['Store of value', 'Medium of exchange', 'Unit of account', 'Form of credit'],
        correctIndex: 2,
        explanation: 'A unit of account lets you measure and compare the value of different things.',
      },
      {
        prompt: 'Money in your UPI-linked bank account is…',
        options: ['Not real money', 'Real money in digital form', 'Only usable abroad', 'A loan from the bank'],
        correctIndex: 1,
        explanation: 'Most money today is digital. Your bank balance is just as real as cash.',
      },
    ],
  },
  {
    slug: 'needs-vs-wants',
    category: 'money-basics',
    title: 'Needs vs wants',
    summary: 'Tell the difference and your money lasts longer.',
    body: `A **need** is something you must have to live and work: food, shelter, basic clothes, transport to college or work, medicine.

A **want** makes life nicer but you could live without it: a new phone when yours works, eating out, concert tickets, the latest sneakers.

## Why it matters
Money is limited. If wants eat into needs, you end up borrowing for rent or food. Covering needs first keeps you safe.

## The grey zone
Some things are both. You **need** a phone, but you **want** the ₹80,000 flagship. Ask: “What is the cheapest version that does the job?” The rest is a want.

## A simple test
- Would my life or work suffer without it?
- Can I wait 7 days before buying?
- Is there a cheaper option that works?

If you can wait a week, it is probably a want.`,
    example: {
      title: 'The phone upgrade',
      body: 'Arjun’s phone works fine but he wants a ₹35,000 upgrade. Waiting 7 days, he realises he mostly wants the camera. He keeps his phone and saves ₹3,000 a month toward the upgrade instead of buying on EMI.',
    },
    readMinutes: 3,
    xpReward: 20,
    practiseGameSlug: 'life-simulator',
    order: 2,
    questions: [
      {
        prompt: 'Which of these is a need?',
        options: ['Movie tickets', 'Monthly rent', 'A designer bag', 'A gaming console'],
        correctIndex: 1,
        explanation: 'Shelter is a basic need. The others make life fun but are wants.',
      },
      {
        prompt: 'You need a phone for college. The ₹80,000 model is…',
        options: ['Fully a need', 'Partly a need, partly a want', 'Never a good idea', 'A type of investment'],
        correctIndex: 1,
        explanation: 'The need is a working phone. The extra cost above a basic model is a want.',
      },
      {
        prompt: 'A good habit before buying a want is to…',
        options: ['Buy it immediately before the price rises', 'Wait a few days and see if you still want it', 'Take a loan for it', 'Ask a friend to pay'],
        correctIndex: 1,
        explanation: 'A short waiting period cuts impulse buying a lot.',
      },
    ],
  },
  {
    slug: 'inflation-explained',
    category: 'money-basics',
    title: 'Inflation: why prices go up',
    summary: 'The same ₹100 buys less every year. Here’s why.',
    body: `**Inflation** is the general rise in prices over time. In India it has often been around 4–6% a year.

## What it does to your money
If inflation is 6%, something that costs ₹100 today will cost about ₹106 next year. Cash kept under the mattress loses buying power every year.

## Real return
If your savings account pays 3% and inflation is 6%, your **real return** is about −3%. You have more rupees, but they buy less.

## Beating inflation
- Keep only what you need for the short term in a savings account.
- For long-term goals, consider options that historically grew faster than inflation, like diversified equity funds.
- Higher return usually means higher risk, so match the option to your goal and time.`,
    example: {
      title: 'The ₹10 samosa',
      body: 'A samosa that cost ₹10 a decade ago might cost ₹18–20 today. If your ₹1,000 sat in a box all those years, it would now buy far fewer samosas.',
    },
    readMinutes: 4,
    xpReward: 20,
    practiseGameSlug: 'money-challenges',
    order: 3,
    questions: [
      {
        prompt: 'With 6% inflation, something costing ₹100 today will cost about how much in a year?',
        options: ['₹94', '₹100', '₹106', '₹160'],
        correctIndex: 2,
        explanation: '₹100 × 1.06 = ₹106.',
      },
      {
        prompt: 'Your savings earn 3% while inflation is 6%. Your real return is roughly…',
        options: ['+9%', '+3%', '0%', '−3%'],
        correctIndex: 3,
        explanation: 'Real return ≈ interest rate − inflation = 3% − 6% = −3%.',
      },
      {
        prompt: 'What happens to cash kept at home for 10 years?',
        options: ['It grows', 'It loses buying power', 'It stays exactly as valuable', 'It earns interest'],
        correctIndex: 1,
        explanation: 'Prices rise while the cash stays the same, so it buys less.',
      },
    ],
  },

  // ───────── Budgeting & Saving ─────────
  {
    slug: 'the-50-30-20-rule',
    category: 'budgeting-saving',
    title: 'The 50/30/20 budget',
    summary: 'A simple split for every rupee you earn.',
    body: `A **budget** is a plan for your money before you spend it. The 50/30/20 rule is an easy starting point.

## The split
- **50% needs:** rent, food, bills, transport.
- **30% wants:** eating out, shopping, entertainment.
- **20% savings and investing:** emergency fund, goals, SIPs.

## Pay yourself first
Move your 20% to savings the day money arrives, not at the end of the month. What is left is what you can spend.

## Adjust to your life
In expensive cities needs may take 60%. That is fine, but try to keep savings at least 10–20%. The rule is a guide, not a law.

## Track for one month
Write down every expense for 30 days. Most people are surprised by how much small daily spends add up.`,
    example: {
      title: 'Meera’s ₹30,000 salary',
      body: 'Needs ₹15,000 (rent share, groceries, metro). Wants ₹9,000 (food delivery, OTT, outings). Savings ₹6,000, set up as an auto-transfer on salary day: ₹3,000 to an emergency fund and ₹3,000 to a SIP.',
    },
    readMinutes: 4,
    xpReward: 20,
    practiseGameSlug: 'life-simulator',
    order: 1,
    questions: [
      {
        prompt: 'In the 50/30/20 rule, what is the 20% for?',
        options: ['Wants', 'Rent', 'Savings and investing', 'Taxes only'],
        correctIndex: 2,
        explanation: '20% goes to your future: emergency fund, goals and investments.',
      },
      {
        prompt: 'With a ₹20,000 income, how much goes to needs under 50/30/20?',
        options: ['₹4,000', '₹6,000', '₹10,000', '₹15,000'],
        correctIndex: 2,
        explanation: '50% of ₹20,000 is ₹10,000.',
      },
      {
        prompt: '“Pay yourself first” means…',
        options: ['Spend on wants first', 'Save as soon as income arrives', 'Ask for a raise', 'Pay off friends first'],
        correctIndex: 1,
        explanation: 'Saving first means it actually happens, instead of saving whatever is left.',
      },
    ],
  },
  {
    slug: 'emergency-fund',
    category: 'budgeting-saving',
    title: 'Your emergency fund',
    summary: 'Why a cash cushion comes before investing.',
    body: `An **emergency fund** is money set aside only for surprises: a medical bill, a job loss, a broken laptop.

## How much?
Aim for **3 to 6 months of essential expenses**. Students can start with a smaller target like ₹5,000–₹10,000.

## Where to keep it
It must be **safe** and **easy to access**: a savings account, a sweep-in FD, or a liquid fund. Not in stocks, which might be down exactly when you need the money.

## Why it comes first
Without it, any surprise forces you to borrow (often on a credit card at 36%+ a year) or sell investments at a bad time.

## Build it step by step
Start with one month of expenses, then grow it. Refill it after you use it.`,
    example: {
      title: 'The broken laptop',
      body: 'Kabir’s laptop dies a week before exams. Repair costs ₹12,000. Because he kept ₹15,000 aside, he pays cash instead of a credit card EMI with high interest.',
    },
    readMinutes: 3,
    xpReward: 20,
    practiseGameSlug: 'life-simulator',
    order: 2,
    questions: [
      {
        prompt: 'A common target for an emergency fund is…',
        options: ['1 week of expenses', '3–6 months of essential expenses', '5 years of salary', 'Whatever is left at month end'],
        correctIndex: 1,
        explanation: '3–6 months covers most surprises like a job loss or medical bill.',
      },
      {
        prompt: 'Which is the best place for an emergency fund?',
        options: ['A single small-company stock', 'Crypto', 'A savings account or liquid fund', 'Lending it to a friend'],
        correctIndex: 2,
        explanation: 'It should be safe and quickly available. Stocks and crypto can fall when you need the money.',
      },
      {
        prompt: 'Without an emergency fund, a surprise bill often leads to…',
        options: ['Higher savings', 'Expensive borrowing', 'Lower taxes', 'Free insurance'],
        correctIndex: 1,
        explanation: 'People end up on credit cards or loans with high interest.',
      },
    ],
  },
  {
    slug: 'saving-goals',
    category: 'budgeting-saving',
    title: 'Setting saving goals',
    summary: 'Turn “I should save” into a plan with a date.',
    body: `Vague goals rarely work. A **SMART** goal is Specific, Measurable, Achievable, Relevant and Time-bound.

## From vague to SMART
- Vague: “I want to save for a trip.”
- SMART: “I will save ₹18,000 for a Goa trip by December by saving ₹3,000 a month.”

## Short vs long-term goals
- **Short-term (under 1 year):** keep in a savings account or recurring deposit.
- **Medium-term (1–5 years):** RDs, FDs, debt funds.
- **Long-term (5+ years):** diversified equity funds via SIP can make sense.

## Make it automatic
Set up a standing instruction or SIP on payday. Give each goal its own name so you can see progress.`,
    example: {
      title: 'Goa by December',
      body: 'Sana needs ₹18,000 in 6 months. She opens a recurring deposit of ₹3,000 a month on payday. By December she has the money plus a little interest, and no credit card bill after the trip.',
    },
    readMinutes: 3,
    xpReward: 20,
    practiseGameSlug: 'portfolio-builder',
    order: 3,
    questions: [
      {
        prompt: 'Which goal is SMART?',
        options: ['Save more money', 'Be rich someday', 'Save ₹12,000 for a bike service by June at ₹2,000/month', 'Spend less on stuff'],
        correctIndex: 2,
        explanation: 'It has an amount, a deadline and a monthly plan.',
      },
      {
        prompt: 'For a goal 6 months away, a sensible place for the money is…',
        options: ['A recurring deposit', 'A single volatile stock', 'A lottery ticket', 'Cash at home'],
        correctIndex: 0,
        explanation: 'Short-term goals need safety. A recurring deposit is predictable.',
      },
      {
        prompt: 'You need ₹24,000 in 8 months. How much per month?',
        options: ['₹2,000', '₹3,000', '₹4,000', '₹8,000'],
        correctIndex: 1,
        explanation: '₹24,000 ÷ 8 = ₹3,000.',
      },
    ],
  },

  // ───────── Banking & UPI ─────────
  {
    slug: 'bank-accounts-101',
    category: 'banking-payments',
    title: 'Bank accounts 101',
    summary: 'Savings accounts, FDs, RDs and what interest means.',
    body: `A bank keeps your money safe and pays you **interest** for letting it use your deposits.

## Common accounts
- **Savings account:** for everyday money. Low interest (often 2.5–4%), withdraw anytime.
- **Fixed deposit (FD):** lock a lump sum for a fixed time at a higher rate.
- **Recurring deposit (RD):** deposit a fixed amount every month for a fixed time.

## Is my money safe?
In India, deposits in each bank are insured by DICGC up to **₹5 lakh** per depositor per bank, covering principal and interest.

## KYC
To open an account you complete **KYC** (Know Your Customer) with documents like Aadhaar and PAN. Never share these with strangers.

## Read the fine print
Check minimum balance rules and charges. Many banks offer zero-balance accounts for students.`,
    example: {
      title: 'FD vs savings',
      body: 'Priya has ₹50,000 she won’t need for a year. In a savings account at 3% she earns about ₹1,500. In a 1-year FD at 7% she earns about ₹3,500, but breaking it early may cost a penalty.',
    },
    readMinutes: 4,
    xpReward: 20,
    practiseGameSlug: 'money-challenges',
    order: 1,
    questions: [
      {
        prompt: 'Which account lets you deposit a fixed amount every month?',
        options: ['Fixed deposit', 'Recurring deposit', 'Demat account', 'Current account'],
        correctIndex: 1,
        explanation: 'A recurring deposit (RD) takes a fixed monthly amount for a set period.',
      },
      {
        prompt: 'DICGC insures bank deposits up to how much per depositor per bank?',
        options: ['₹50,000', '₹1 lakh', '₹5 lakh', 'Unlimited'],
        correctIndex: 2,
        explanation: 'The cover is ₹5 lakh including interest.',
      },
      {
        prompt: 'Why does an FD usually pay more interest than a savings account?',
        options: ['It is riskier', 'You agree to lock the money for a fixed time', 'It is a government scheme', 'It has no KYC'],
        correctIndex: 1,
        explanation: 'The bank can plan with your money for longer, so it pays more.',
      },
    ],
  },
  {
    slug: 'upi-explained',
    category: 'banking-payments',
    title: 'How UPI works',
    summary: 'Pay requests, collect requests and your UPI PIN.',
    body: `**UPI** (Unified Payments Interface) moves money instantly between bank accounts using a UPI ID or QR code.

## The golden rule
**You enter your UPI PIN only to send money. Never to receive it.** If someone says “enter your PIN to receive ₹5,000”, it is a scam.

## Pay vs collect
- **Pay:** you send money to someone.
- **Collect request:** someone asks you to pay. Approving it sends **your** money to them.

## Good habits
- Check the name that appears before you confirm.
- Scan QR codes only to pay, not to get paid.
- Set daily limits in your app.
- Report wrong transfers to your bank and through the app’s complaint option quickly.`,
    example: {
      title: 'The “refund” request',
      body: 'Rahul sells a chair online. A buyer sends a collect request labelled “Payment ₹2,000” and asks him to approve with his PIN. Rahul declines. Approving would have sent ₹2,000 out of his account.',
    },
    readMinutes: 3,
    xpReward: 20,
    practiseGameSlug: 'scam-or-legit',
    order: 2,
    questions: [
      {
        prompt: 'When do you need to enter your UPI PIN?',
        options: ['To receive money', 'To send money', 'To check offers', 'To open the app every time'],
        correctIndex: 1,
        explanation: 'A UPI PIN authorises money leaving your account. Receiving never needs it.',
      },
      {
        prompt: 'Approving a collect request will…',
        options: ['Credit money to you', 'Send money from your account', 'Block the sender', 'Do nothing'],
        correctIndex: 1,
        explanation: 'A collect request is a request for you to pay.',
      },
      {
        prompt: 'A stranger asks you to scan a QR code to receive prize money. You should…',
        options: ['Scan quickly', 'Scan and enter PIN', 'Refuse: QR codes are for paying', 'Share your OTP instead'],
        correctIndex: 2,
        explanation: 'Scanning a QR and entering your PIN pays the other person.',
      },
    ],
  },
  {
    slug: 'digital-safety',
    category: 'banking-payments',
    title: 'Staying safe with digital money',
    summary: 'OTPs, phishing links and fake support numbers.',
    body: `Most digital money fraud does not “hack” your bank. It tricks **you** into handing over access.

## Never share
- **OTPs**, UPI PIN, card CVV or full card number.
- Screen-sharing access (apps like AnyDesk) with someone you don’t know.

No real bank, RBI official or delivery company will ever ask for your OTP.

## Spot phishing
- Urgency: “Your account will be blocked in 2 hours!”
- Odd links: misspelled bank names, short links.
- Requests to update KYC through a link.

## Fake customer care
Scammers post fake helpline numbers online. Get support numbers only from the official app or website.

## If something goes wrong
Call your bank immediately to block, report on **cybercrime.gov.in** or helpline **1930**, and change passwords.`,
    example: {
      title: 'The KYC SMS',
      body: '“Dear customer, your account will be suspended. Update KYC: bit.ly/xyz.” Neha ignores the link, opens her bank’s official app instead, and sees no KYC alert. It was phishing.',
    },
    readMinutes: 4,
    xpReward: 20,
    practiseGameSlug: 'scam-or-legit',
    order: 3,
    questions: [
      {
        prompt: 'A caller from “your bank” asks for the OTP you just received. You…',
        options: ['Share it, it’s the bank', 'Hang up: banks never ask for OTPs', 'Share half of it', 'Send it by SMS instead'],
        correctIndex: 1,
        explanation: 'An OTP is the key to your account. No genuine bank asks for it.',
      },
      {
        prompt: 'Which is a common sign of phishing?',
        options: ['Message from the official app', 'Urgent threat plus a short link', 'A monthly statement', 'A branch visit'],
        correctIndex: 1,
        explanation: 'Urgency and suspicious links are classic phishing tricks.',
      },
      {
        prompt: 'India’s cybercrime helpline number is…',
        options: ['100', '1930', '112', '1800'],
        correctIndex: 1,
        explanation: 'Call 1930 or use cybercrime.gov.in to report financial fraud quickly.',
      },
      {
        prompt: 'Where should you find a bank’s customer care number?',
        options: ['First search result', 'A social media comment', 'The bank’s official app or website', 'A WhatsApp forward'],
        correctIndex: 2,
        explanation: 'Fake helpline numbers are common online. Use official sources only.',
      },
    ],
  },

  // ───────── Investing ─────────
  {
    slug: 'what-is-a-stock',
    category: 'investing',
    title: 'What is a stock?',
    summary: 'Owning a slice of a company, and why prices move.',
    body: `A **stock** (or share) is a small piece of ownership in a company. If a company has 1 crore shares and you own 100, you own a tiny slice of it.

## How you make (or lose) money
- **Price change:** if the company does well and more people want its shares, the price can rise. It can also fall.
- **Dividends:** some companies share part of their profit with shareholders.

## Where shares trade
In India, shares trade on the **NSE** and **BSE**. You need a **demat** and trading account with a SEBI-registered broker.

## Why prices move
News, company results, interest rates and plain mood. In the short term prices can swing a lot. Over many years they tend to follow how much the business earns.

## Risk
A single company can fail. That is why beginners often start with **index funds**, which hold many companies at once.`,
    example: {
      title: 'A slice of the chai chain',
      body: 'A chai chain has 10,000 shares at ₹100 each. You buy 10 shares for ₹1,000. If the chain grows and the share price rises to ₹130, your 10 shares are worth ₹1,300. If it struggles and falls to ₹70, they’re worth ₹700.',
    },
    readMinutes: 4,
    xpReward: 20,
    practiseGameSlug: 'bull-or-bear',
    order: 1,
    questions: [
      {
        prompt: 'Owning a share means you…',
        options: ['Lent money to the company', 'Own a small part of the company', 'Work for the company', 'Get a fixed interest rate'],
        correctIndex: 1,
        explanation: 'A share is a unit of ownership. Lending would be a bond.',
      },
      {
        prompt: 'Which are the two main stock exchanges in India?',
        options: ['RBI and SEBI', 'NSE and BSE', 'SBI and HDFC', 'NPCI and UPI'],
        correctIndex: 1,
        explanation: 'NSE and BSE are exchanges. SEBI regulates markets; RBI is the central bank.',
      },
      {
        prompt: 'A dividend is…',
        options: ['A fee you pay the broker', 'Part of profit paid to shareholders', 'A type of tax', 'A loan from the exchange'],
        correctIndex: 1,
        explanation: 'Some companies share profits with shareholders as dividends.',
      },
      {
        prompt: 'Why do many beginners start with index funds?',
        options: ['They are guaranteed', 'They spread money across many companies', 'They never fall', 'They pay fixed interest'],
        correctIndex: 1,
        explanation: 'Index funds reduce the risk of one company failing. They can still fall in value.',
      },
    ],
  },
  {
    slug: 'diversification',
    category: 'investing',
    title: 'Diversification',
    summary: 'Don’t put all your eggs in one basket.',
    body: `**Diversification** means spreading money across different investments so one bad outcome doesn’t sink you.

## Across companies
Owning 30 companies instead of 1 means one failure hurts a little, not a lot.

## Across asset classes
- **Equity (stocks):** highest long-term growth, biggest swings.
- **Debt (bonds, FDs):** steadier, lower returns.
- **Gold:** often holds up when stocks fall.
- **Cash:** safe, but loses to inflation.

## Asset allocation
How you split money across these is your **asset allocation**. Younger people with long goals can usually hold more equity. Shorter goals need more debt and cash.

## Rebalancing
Over time, winners grow and your mix drifts. **Rebalancing** means selling a bit of what grew and adding to what shrank to get back to your plan.

Diversification reduces risk; it does not remove it.`,
    example: {
      title: 'Two portfolios in a bad year',
      body: 'Asha puts ₹1,00,000 in one tech stock; it falls 40% to ₹60,000. Vikram splits ₹1,00,000: ₹60,000 in an index fund (−15%), ₹30,000 in debt (+7%), ₹10,000 in gold (+12%). He ends near ₹94,300, a much smaller hit.',
    },
    readMinutes: 4,
    xpReward: 20,
    practiseGameSlug: 'portfolio-builder',
    order: 2,
    questions: [
      {
        prompt: 'Diversification mainly helps to…',
        options: ['Guarantee profits', 'Reduce the impact of one bad investment', 'Avoid all taxes', 'Make prices rise'],
        correctIndex: 1,
        explanation: 'It lowers risk from any single investment but guarantees nothing.',
      },
      {
        prompt: 'Which asset often holds up when stocks fall?',
        options: ['Gold', 'A single tech stock', 'Crypto', 'A credit card'],
        correctIndex: 0,
        explanation: 'Gold has often moved differently from stocks, which helps balance a portfolio.',
      },
      {
        prompt: 'Rebalancing means…',
        options: ['Selling everything when markets fall', 'Bringing your mix back to your planned allocation', 'Only buying winners', 'Checking prices daily'],
        correctIndex: 1,
        explanation: 'You trim what grew and add to what shrank to return to your target mix.',
      },
    ],
  },
  {
    slug: 'power-of-compounding',
    category: 'investing',
    title: 'Compounding and SIPs',
    summary: 'Returns on returns, and why starting early wins.',
    body: `**Compounding** is earning returns on your returns. Over long periods it becomes very powerful.

## A simple picture
₹10,000 growing at 10% a year:
- After 1 year: ₹11,000
- After 10 years: about ₹25,900
- After 20 years: about ₹67,300

The money grows faster later because each year’s growth is bigger.

## The rule of 72
Divide 72 by the yearly return to estimate how long money takes to double. At 12%, about 6 years.

## SIPs
A **Systematic Investment Plan** puts a fixed amount into a mutual fund every month. You buy more units when prices are low and fewer when they are high (**rupee cost averaging**), and you build the habit.

## Time beats timing
Starting 5 years earlier often matters more than picking the perfect moment.`,
    example: {
      title: 'Early bird vs late starter',
      body: 'Ananya invests ₹2,000 a month from age 22 to 32, then stops. Rohan invests ₹2,000 a month from 32 to 60. At an assumed 12% a year, Ananya can end up with a similar or larger amount at 60 despite investing far less, because her money compounds for longer. (Illustration only; returns are not guaranteed.)',
    },
    readMinutes: 4,
    xpReward: 20,
    practiseGameSlug: 'investment-simulator',
    order: 3,
    questions: [
      {
        prompt: 'Compounding means…',
        options: ['Earning returns only on what you put in', 'Earning returns on past returns too', 'Paying extra fees', 'A type of loan'],
        correctIndex: 1,
        explanation: 'Your gains start earning gains of their own.',
      },
      {
        prompt: 'By the rule of 72, money at 8% a year doubles in about…',
        options: ['4 years', '9 years', '15 years', '72 years'],
        correctIndex: 1,
        explanation: '72 ÷ 8 = 9 years.',
      },
      {
        prompt: 'A SIP is…',
        options: ['A one-time lump sum', 'A fixed monthly investment', 'A savings account', 'A type of insurance'],
        correctIndex: 1,
        explanation: 'SIPs invest a fixed amount at regular intervals.',
      },
    ],
  },

  // ───────── Risk & Protection ─────────
  {
    slug: 'insurance-basics',
    category: 'risk-protection',
    title: 'Insurance basics',
    summary: 'Pay a small amount to avoid a huge loss.',
    body: `**Insurance** lets many people pool small payments (**premiums**) so the unlucky few are covered for big losses.

## The two you hear about most
- **Health insurance:** pays hospital bills. Medical costs can wipe out years of savings.
- **Term life insurance:** pays your family if you die during the term. Important once others depend on your income.

## Key words
- **Sum insured / cover:** the maximum the policy pays.
- **Premium:** what you pay each year.
- **Waiting period** and **exclusions:** what is not covered or covered only later.

## Insurance is not an investment
Plans that mix insurance with “guaranteed returns” often give low returns and low cover. Many experts suggest keeping insurance and investing separate: buy term + health cover, invest the rest.`,
    example: {
      title: 'The hospital bill',
      body: 'Karan’s father needs surgery costing ₹3,00,000. Because the family has a ₹5 lakh health policy with a ₹12,000 yearly premium, the insurer pays most of it and their savings stay intact.',
    },
    readMinutes: 4,
    xpReward: 20,
    practiseGameSlug: 'life-simulator',
    order: 1,
    questions: [
      {
        prompt: 'The amount you pay every year for insurance is the…',
        options: ['Claim', 'Premium', 'Dividend', 'EMI'],
        correctIndex: 1,
        explanation: 'The premium is the price of your cover.',
      },
      {
        prompt: 'Term life insurance mainly protects…',
        options: ['Your phone', 'Your family’s income if you die', 'Your stock portfolio', 'Your car'],
        correctIndex: 1,
        explanation: 'It replaces income for dependents.',
      },
      {
        prompt: 'Why is health insurance important?',
        options: ['It earns high returns', 'Medical bills can wipe out savings', 'It is required for UPI', 'It reduces inflation'],
        correctIndex: 1,
        explanation: 'One hospital stay can cost lakhs. Insurance protects your savings.',
      },
    ],
  },
  {
    slug: 'credit-and-emis',
    category: 'risk-protection',
    title: 'Credit cards, loans and EMIs',
    summary: 'Borrowing costs money. Know the real price.',
    body: `When you borrow, you pay back the amount plus **interest**. An **EMI** (Equated Monthly Instalment) is a fixed monthly payment that covers both.

## Credit cards
Pay the **full bill** by the due date and you pay no interest. Pay only the **minimum due** and the rest is charged interest that can exceed **36–42% a year**.

## “No-cost EMI”
Often the interest is hidden as a lost discount or processing fee. Compare the EMI total with the cash price.

## Credit score
Your **CIBIL score** (300–900) shows lenders how reliably you repay. Paying on time and using a small part of your credit limit keeps it healthy.

## Good vs risky borrowing
Borrowing for something that builds value (like education) can make sense. Borrowing for wants you can’t afford usually doesn’t.`,
    example: {
      title: 'The minimum-due trap',
      body: 'Ishaan has a ₹20,000 card bill and pays only the ₹1,000 minimum. Interest of around 3.5% a month on the remaining amount adds up fast; months later he still owes most of it.',
    },
    readMinutes: 4,
    xpReward: 20,
    practiseGameSlug: 'money-challenges',
    order: 2,
    questions: [
      {
        prompt: 'To avoid credit card interest you should…',
        options: ['Pay the minimum due', 'Pay the full bill by the due date', 'Pay after the due date', 'Use two cards'],
        correctIndex: 1,
        explanation: 'Paying the full amount on time means no interest.',
      },
      {
        prompt: 'An EMI includes…',
        options: ['Only interest', 'Only the loan amount', 'Both principal and interest', 'Only fees'],
        correctIndex: 2,
        explanation: 'Each EMI repays part of the loan plus interest.',
      },
      {
        prompt: 'A CIBIL score ranges from…',
        options: ['0–100', '1–10', '300–900', '1,000–10,000'],
        correctIndex: 2,
        explanation: 'Higher is better; 750+ is generally considered good.',
      },
    ],
  },
  {
    slug: 'spotting-scams',
    category: 'risk-protection',
    title: 'Spotting investment scams',
    summary: 'Guaranteed high returns are the biggest red flag.',
    body: `Investment scams promise easy, fast money. They target students and first-time earners on Telegram, WhatsApp and Instagram.

## Red flags
- **Guaranteed** high returns, like “2% a day” or “double in 30 days”.
- Pressure to act **now** before the “offer” ends.
- Paid “tips” groups claiming insider information.
- Earning by **recruiting** others (a pyramid or Ponzi scheme).
- Unregistered advisors. Check SEBI registration on the SEBI website.

## Task scams
“Like videos and earn ₹500!” They pay small amounts first, then ask you to “invest” to unlock bigger earnings. The money disappears.

## The rule
If it sounds too good to be true, it is. Real investments carry risk and never guarantee big returns.`,
    example: {
      title: 'The Telegram tips group',
      body: 'Dev joins a group promising “sure-shot 20% weekly returns”. They show screenshots of profits and ask for ₹10,000 to join the “VIP” plan. Dev checks: no SEBI registration, guaranteed returns, pressure to pay now. He leaves the group.',
    },
    readMinutes: 4,
    xpReward: 20,
    practiseGameSlug: 'scam-or-legit',
    order: 3,
    questions: [
      {
        prompt: 'Which is the biggest red flag?',
        options: ['Returns that vary', 'A SEBI-registered advisor', '“Guaranteed 2% daily returns”', 'An annual report'],
        correctIndex: 2,
        explanation: 'No genuine investment guarantees returns that high.',
      },
      {
        prompt: 'A scheme where you earn mainly by recruiting others is likely…',
        options: ['A mutual fund', 'A pyramid or Ponzi scheme', 'An FD', 'A SIP'],
        correctIndex: 1,
        explanation: 'Returns come from new members’ money, and it collapses.',
      },
      {
        prompt: 'How can you check if an investment advisor is genuine?',
        options: ['Count their followers', 'Check SEBI registration', 'Ask for screenshots', 'Trust the testimonials'],
        correctIndex: 1,
        explanation: 'SEBI keeps a public list of registered advisors.',
      },
    ],
  },
];

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { topic: 'money-basics', prompt: 'If inflation is 6% and your savings earn 4%, your buying power…', options: ['Grows', 'Shrinks', 'Stays the same', 'Doubles'], correctIndex: 1, explanation: 'Prices rise faster than your money grows, so it buys less.' },
  { topic: 'money-basics', prompt: 'Which of these is a want, not a need?', options: ['Groceries', 'Rent', 'A new gaming headset', 'Medicine'], correctIndex: 2, explanation: 'You can live without a headset; the others are essentials.' },
  { topic: 'budgeting-saving', prompt: 'In the 50/30/20 rule, 20% goes to…', options: ['Wants', 'Needs', 'Savings & investing', 'Taxes'], correctIndex: 2, explanation: '20% is for your future.' },
  { topic: 'budgeting-saving', prompt: 'An emergency fund should ideally cover…', options: ['1 week of expenses', '3–6 months of essential expenses', '10 years of salary', 'Only holidays'], correctIndex: 1, explanation: '3–6 months covers most surprises.' },
  { topic: 'banking-payments', prompt: 'To receive money on UPI you need to enter your PIN.', options: ['True', 'False'], correctIndex: 1, explanation: 'Your PIN is only needed to send money.' },
  { topic: 'banking-payments', prompt: 'A caller asks for your OTP to “stop a fraud”. You should…', options: ['Share it', 'Hang up and call the bank’s official number', 'Share it by SMS', 'Ignore your bank forever'], correctIndex: 1, explanation: 'Banks never ask for OTPs.' },
  { topic: 'investing', prompt: 'Buying a share means you…', options: ['Lend money to a company', 'Own a part of a company', 'Get guaranteed returns', 'Open a bank account'], correctIndex: 1, explanation: 'A share is ownership.' },
  { topic: 'investing', prompt: 'At 12% a year, money doubles in roughly…', options: ['2 years', '6 years', '12 years', '24 years'], correctIndex: 1, explanation: 'Rule of 72: 72 ÷ 12 = 6.' },
  { topic: 'risk-protection', prompt: 'Paying only the minimum due on a credit card…', options: ['Is free', 'Leads to high interest on the rest', 'Improves your returns', 'Closes the card'], correctIndex: 1, explanation: 'The unpaid balance attracts very high interest.' },
  { topic: 'risk-protection', prompt: '“Guaranteed 30% monthly returns” is most likely…', options: ['A great deal', 'A scam', 'A government bond', 'A savings account'], correctIndex: 1, explanation: 'Guaranteed high returns are a classic scam sign.' },
];

export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
export const getLesson = (slug: string) => LESSONS.find((l) => l.slug === slug);
export const lessonsIn = (category: string) => LESSONS.filter((l) => l.category === category).sort((a, b) => a.order - b.order);
