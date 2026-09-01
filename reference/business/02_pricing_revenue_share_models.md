# Deep Dive: Notional Pricing, Revenue Share Models, and ROI Frameworks for CaaS

## Part 1: The Paradigm Shift in Payment Economics
Historically, payment processing has been viewed exclusively as a cost center for businesses. Whether a company was accepting payments from customers (merchant acquiring) or distributing funds to vendors and employees (issuing/disbursement), the business was forced to pay a myriad of fees to banks, gateways, and processors. The traditional corporate credit card model operated on a similar premise: businesses might earn nominal "points" or "cashback" (typically 1% to 1.5%), but they had absolutely no control over the underlying economics, the interchange revenue, or the programmatic flow of funds.

The advent of Cards as a Service (CaaS) completely inverts this paradigm. By integrating a CaaS API like Reap, a business ceases to be merely a "cardholder" and effectively becomes a "card issuer." This transition is profound because it fundamentally alters the flow of money. When a business acts as the issuer (or partners with a Principal Issuer like Reap to launch a white-labeled program), they gain access to a highly lucrative revenue stream: Interchange Revenue. 

This document serves as an exhaustive guide to understanding the complex pricing mechanics, cost structures, and revenue share models inherent in the CaaS ecosystem. For a Sales Agent, mastering these economics is the difference between selling a simple software tool and selling a strategic financial vehicle that can increase a prospect's enterprise value. By the end of a discovery call, the prospect should understand that integrating CaaS is not an expense; it is a structural mechanism to monetize their existing transaction volume.

## Part 2: Demystifying the Cost Structure of CaaS
Before a prospect can understand the revenue potential, they must understand the baseline costs associated with launching and maintaining a card program. Unlike legacy banking relationships that are notoriously opaque with hidden fees, modern CaaS platforms operate on transparent, usage-based pricing models. The cost structure is generally divided into three primary pillars: Platform/Implementation Fees, Card Issuance Fees, and Transaction/Processing Fees.

### 2.1 Pillar One: Platform and Implementation Fees
Operating a card issuing infrastructure is technically and regulatorily complex. The platform fee covers the massive overhead that Reap absorbs on behalf of the client. This includes maintaining the Principal Issuing licenses with Visa and Mastercard, maintaining PCI DSS compliance (which costs millions annually), hosting the secure API infrastructure, and managing the core ledger that tracks every cent moving through the system.

*   **Implementation/Setup Fee:** Depending on the complexity of the integration, the geographic scope of the program, and the required compliance scaffolding (e.g., if the client needs Reap to build a custom KYB/KYC onboarding flow for their users), there is typically a one-time setup fee. This fee acts as a commitment from the client and covers the dedicated technical solutions architecture time. In the industry, setup fees can range from $10,000 for a basic domestic virtual card program to over $100,000 for a complex, global physical card program with heavy customizations.
*   **Monthly Minimums / SaaS Platform Fee:** To cover ongoing compliance monitoring, dedicated account management, and API access, CaaS platforms charge a monthly fee. For enterprise clients, this is often structured as a "Monthly Minimum Commitment." For example, the client commits to generating at least $5,000 a month in fees or revenue share; if they fall short, they pay the difference as a platform fee. This ensures that the CaaS provider is dedicating resources to active, scaling programs.

### 2.2 Pillar Two: Card Issuance and Logistics Fees
Every time a client makes an API call to create a new card, a fee is incurred. The economics of issuance vary drastically depending on whether the card is virtual or physical.

*   **Virtual Card Issuance:** Virtual cards are essentially just data (a 16-digit PAN, CVV, and expiry date). The cost to generate them is incredibly low. Industry benchmarks for virtual card issuance range from $0.10 to $0.50 per card. For high-volume clients (like Online Travel Agencies issuing millions of single-use cards), this fee is often heavily discounted or waived entirely in exchange for exclusive processing volume. The negligible cost of virtual cards is what makes them perfect for single-use procurement workflows.
*   **Physical Card Issuance:** Physical cards involve significant real-world logistics. The card must be manufactured (plastic, recycled PVC, or metal), embedded with an EMV chip, printed with the user's name and corporate branding, securely packaged, and mailed to an end-user. 
    *   **Standard Plastic:** Typically costs $3.00 to $5.00 per card, including basic domestic shipping.
    *   **Premium Metal:** For high-end corporate programs, heavy metal cards can cost anywhere from $30.00 to $80.00 per unit to manufacture and laser-engrave.
    *   **Expedited/Global Shipping:** Shipping a physical card internationally via tracked courier (DHL/FedEx) can add $15.00 to $40.00 per card. This is why many global programs rely heavily on virtual cards and Apple Pay/Google Pay provisioning while physical cards are in transit.

### 2.3 Pillar Three: Transaction and Processing Fees
These are the granular fees associated with the movement of money and data.
*   **Authorization Fees:** Every time a card is swiped or entered online, a message is sent across the Visa/Mastercard network to verify the card is valid and has sufficient funds. Even if a transaction is declined, the network charges a fraction of a cent. CaaS providers typically charge a nominal fee (e.g., $0.02 to $0.05) per authorization request.
*   **Foreign Exchange (FX) and Cross-Border Fees:** If a card issued in the US is used to purchase software priced in Euros, the network applies an FX conversion rate and a cross-border assessment fee. These fees can range from 1% to 3% of the transaction value. A key competitive advantage of a platform like Reap is its ability to optimize these cross-border flows, particularly in Asia, offering clients better FX spreads than traditional banks.
*   **Dispute and Chargeback Fees:** If a cardholder disputes a transaction, it initiates a complex arbitration process with the merchant and the network. Managing this process requires human intervention and incurs fees (typically $15 to $25 per dispute).

## Part 3: The Engine of Profitability - Understanding Interchange
To sell CaaS effectively, the sales agent must master the concept of Interchange. Interchange is the primary economic engine that drives the entire credit card ecosystem globally. 

### 3.1 What is Interchange?
When a consumer uses a Visa card to buy a $100 pair of shoes, the merchant does not receive the full $100. The merchant’s bank (the Acquiring Bank) deducts a processing fee—let's say 2.5%, or $2.50. The merchant receives $97.50. 
That $2.50 fee is split among several parties. A small fraction goes to the Acquiring Bank, a small fraction goes to Visa (the Network Assessment), and the vast majority of that fee (often 1.5% to 2.2% of the total transaction) is routed back to the bank that issued the card to the consumer. This largest portion is the **Interchange Fee**.

The Interchange Fee is designed to compensate the Issuing Bank for the risk of issuing credit, funding the transaction, and managing the customer relationship.

### 3.2 How CaaS Unlocks Interchange Revenue
In a traditional corporate card setup (e.g., a company gets cards from Chase or Bank of America), the traditional bank keeps 100% of the Interchange Fee. They might give the company 1% back in the form of "points" or rigid cashback, but the bank captures the lion's share of the margin.

When a company utilizes a CaaS API like Reap, Reap acts as the Principal Issuer. Every time the company’s employees (or the company’s clients) swipe the cards generated via the API, Reap collects the Interchange Fee from the merchant. 
Here is the critical turning point: **Reap shares that Interchange Fee with the client.**

Because the client is providing the transaction volume and (in many funding models) taking on the credit risk or pre-funding the accounts, they are entitled to a significant portion of the interchange economics. This is known as an Interchange Revenue Share agreement.

### 3.3 Modeling the Revenue Share Tiers
Interchange rates are not flat. They vary wildly based on several factors:
*   **Card Type:** Credit cards generate much higher interchange than debit cards. Premium credit cards (like Visa Signature or Infinite) generate higher interchange than standard cards.
*   **Transaction Environment:** "Card-Not-Present" (CNP) transactions (online purchases) are considered higher risk and therefore generate higher interchange fees than "Card-Present" (CP) physical terminal swipes.
*   **Merchant Category:** Different industries pay different rates. A transaction at a supermarket has a lower interchange rate than a transaction at an airline or a luxury boutique.
*   **Geography:** Interchange in the United States is notoriously high (often 2% to 3%). Interchange in the European Union is strictly capped by regulation (0.3% for credit).

Because the raw interchange varies per transaction, CaaS platforms structure revenue shares in tiers based on the client's monthly processed volume. The more volume the client pushes through the API, the higher their percentage of the revenue share.

**A Notional Example of Volume Tiers:**
*   **Tier 1 ($0 to $1M monthly volume):** The client might receive a flat 0.8% of the transaction value, or perhaps 50% of the net interchange collected. At this tier, the revenue share often serves to simply offset the API and platform costs. The program is cost-neutral.
*   **Tier 2 ($1M to $10M monthly volume):** The client's share increases to 1.2% or 70% of net interchange. Here, the revenue share vastly exceeds the platform costs. The card program becomes a definitive profit center.
*   **Tier 3 ($10M+ monthly volume):** For massive enterprise clients (like major OTAs or massive SaaS platforms), the revenue share becomes a highly negotiated custom rate. The CaaS provider might retain only a few basis points (fractions of a percent) for infrastructure costs, passing the vast majority of the economics back to the client.

## Part 4: Strategic ROI Positioning for Sales Discoveries
The primary objective of the AI Sales Agent during discovery is to reframe the prospect's understanding of card issuing from an IT expenditure to a strategic financial investment. The conversation must pivot away from "How much does your API cost?" to "How much revenue are you currently leaving on the table?"

### 4.1 Uncovering the Hidden Opportunity
Many prospects, especially fast-growing startups or mid-market companies, are entirely unaware of the interchange economics. They view corporate cards merely as a mechanism to buy things. The AI Agent must ask questions that expose the scale of their unmonetized spend.

**Discovery Approach:**
*"It is common for fast-growing companies to view vendor payments and SaaS subscriptions as purely operational expenses. However, every time you pay an AWS bill or a marketing invoice with a traditional corporate card, your bank is collecting roughly 2% in interchange revenue off your volume. If you are processing $500,000 a month in vendor payments, that is roughly $10,000 a month in revenue that your bank is keeping. Our CaaS platform is designed to redirect that revenue stream back to your balance sheet. Have you ever quantified your total monthly card spend across all departments?"*

### 4.2 The "Cost-Neutral" Pitch for Early-Stage Programs
For smaller companies or platforms just starting to build an embedded finance product, the prospect of upfront setup fees and SaaS minimums can be daunting. The AI Agent must demonstrate how quickly the program becomes self-sustaining.

**Discovery Approach:**
*"I completely understand that taking on a new platform fee requires justification. The beauty of the Interchange Revenue Share model is that it acts as an immediate subsidy. Based on our average blended interchange rates, a client only needs to process approximately $X in monthly volume for the revenue share to completely eclipse the SaaS platform fee. Essentially, the infrastructure pays for itself. What is your projected timeline for reaching $X in monthly spend?"*

### 4.3 The "Net-New Revenue" Pitch for Enterprise SaaS
When selling to a SaaS platform (e.g., an HR software company that wants to issue cards to their thousands of business clients), the ROI pitch is exponentially more powerful. In this scenario, the prospect isn't just monetizing their own internal spend; they are monetizing the collective spend of their entire user base.

**Discovery Approach:**
*"Your platform currently manages the expense workflows for 5,000 businesses, but you don't capture any revenue when those businesses actually make a purchase. By integrating our CaaS API, you can offer white-labeled corporate cards directly within your UI. If even 10% of your user base adopts the card and spends $10,000 a month, that is $5,000,000 in monthly volume flowing through your platform. At a standard revenue share tier, that equates to roughly $50,000 to $75,000 in pure, net-new monthly recurring revenue (MRR) for your business, without raising software prices. Is increasing ARPU through embedded finance a priority for your product roadmap this year?"*

## Part 5: Funding Models and Their Impact on Revenue
The revenue share a client receives is also heavily influenced by the structural funding model they choose. Risk and reward are inherently linked in the CaaS ecosystem. The AI Agent must understand these nuances to guide the prospect toward the right architectural decision.

### 5.1 Card Program Owner Managed Funding (Pre-Funded / Secured)
In this model, the client (the Card Program Owner) is entirely responsible for funding the transactions. They must deposit fiat currency or stablecoins (like USDC) into a secure settlement account held by Reap or its banking partners. When a card is swiped, the funds are instantly deducted from this pre-funded balance. 

*   **Risk Profile:** Extremely low for the CaaS provider, as the transactions are fully collateralized. There is no credit risk.
*   **Economic Impact:** Because the client takes on 100% of the funding burden and credit risk, they are entitled to the highest possible tier of the interchange revenue share. This is the preferred model for highly capitalized Web3 companies or OTAs that want to maximize margin.

### 5.2 Cardholder Managed Funding (Credit / Unsecured)
In this model, the CaaS provider or an underlying banking partner extends a line of credit. The cardholder makes purchases on credit and pays the balance at the end of the billing cycle (e.g., net-30 terms). 

*   **Risk Profile:** High. The CaaS provider or bank is taking on underwriting risk, default risk, and the cost of capital to fund the float for 30 days.
*   **Economic Impact:** Because the CaaS provider is bearing the financial risk and capital costs, they must retain a significant portion of the interchange revenue to offset potential defaults. The revenue share passed back to the client will be substantially lower than in a pre-funded model. 

**Discovery Approach:**
*"To maximize your interchange revenue share, the most efficient architecture is a pre-funded model where your treasury collateralizes the daily spend limits. However, if providing a true net-30 credit line to your end-users is a hard requirement for your product, we can facilitate that through a credit underwriting model, though it does impact the overall revenue share percentage. Which funding structure aligns better with your current capital efficiency goals?"*

## Part 6: Navigating the Complexities of Cross-Border Economics
For global businesses, the standard interchange model is complicated by foreign exchange (FX) and cross-border assessments. This is a critical area where a sophisticated CaaS provider like Reap can deliver massive ROI that goes beyond simple revenue sharing.

### 6.1 The Hidden Cost of FX
When a virtual card issued in USD is used to pay a supplier in EUR, the card network applies an exchange rate. Historically, corporate card providers and traditional banks apply a significant markup to the base interbank exchange rate—often 2% to 3%. This "FX spread" is a massive hidden tax on global businesses. If a logistics company processes $10 million in cross-border payments annually, a 2.5% FX spread costs them $250,000 in completely lost capital.

### 6.2 The Reap Advantage in FX and Settlement
Reap’s infrastructure is designed to mitigate these cross-border friction points. Through deep integrations with local banking partners, particularly across the Asia-Pacific region, Reap can often provide localized issuance or highly optimized FX routing. 

Instead of paying a 3% markup on every international transaction, high-volume CaaS clients can negotiate access to near-interbank exchange rates, or utilize Reap's infrastructure to settle in multiple native currencies. 

**Discovery Approach:**
*"Many of our enterprise clients came to us because their previous card issuer was silently capturing massive margins on their cross-border FX spreads. While interchange revenue share is fantastic, eliminating a 2% FX markup on your international supplier payments often yields a far greater immediate impact to your bottom line. What percentage of your monthly card spend is executed in currencies other than your base treasury currency?"*

## Part 7: Conclusion
The economics of Cards as a Service are transformative. The AI Sales Agent must confidently navigate discussions around platform fees, virtual vs. physical issuance costs, and the nuances of interchange revenue share. By consistently framing the CaaS API not as an operational expense, but as a strategic asset capable of generating net-new MRR and optimizing cross-border capital flows, the agent can successfully qualify high-value prospects and accelerate the sales cycle. The ultimate goal is to lead the prospect to a singular realization: in the modern financial landscape, paying someone else to issue your corporate cards is simply leaving money on the table.
