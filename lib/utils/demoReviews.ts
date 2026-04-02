const NEPALI_NAMES = [
  "Sita Sharma", "Ramesh Thapa", "Anita Karki", "Bikram Shrestha", "Kamala Adhikari",
  "Suresh Poudel", "Gita Rai", "Nabin Tamang", "Puja Gurung", "Dipesh Koirala",
  "Sabina Magar", "Arun Bista", "Nisha Basnet", "Rohit Dahal", "Priya Sapkota",
  "Binod Khadka", "Sunita Limbu", "Manoj Joshi", "Rekha Bhatt", "Suman Acharya",
  "Laxmi Devi", "Prakash Aryal", "Manisha Ghimire", "Santosh Regmi", "Pooja Yadav",
  "Rajan Chaudhary", "Mina Pandey", "Arjun Bhusal", "Sarita Gautam", "Kiran Raut",
  "Deepak Oli", "Sangita Dhakal", "Rajesh Luitel", "Chanda Bhandari", "Nirmal KC",
  "Bishnu Neupane", "Radha Maharjan", "Ganesh Subedi", "Purnima Sedhai", "Amar Lamsal",
  "Resham Bahadur", "Saraswati Tiwari", "Hari Prasad", "Maya Devkota", "Kishor Upreti",
  "Alisha Silwal", "Raju Ale", "Kopila Tamang", "Sushil Rana", "Yashoda Khatri",
]

const REVIEW_TEXTS: Record<1 | 2 | 3 | 4 | 5, string[]> = {
  5: [
    "Ekdam ramro product! Dhanyabad Goreto.store lai. Very happy with this purchase.",
    "Quality is outstanding. Came exactly as shown in the picture. Will order again!",
    "Ati ramro cha. My friends also liked it very much. Highly recommended!",
    "Super fast delivery and the product quality is top notch. 100% satisfied.",
    "Perfect gift item. The packaging was also very nice. Thank you!",
    "I was worried about online shopping but this really exceeded my expectations.",
    "Genuine product, great value for money. Already bought two of these.",
    "The material quality is very good. Exactly what I needed. Five stars!",
    "Bahut mast cha yaar! Delivery was quick and the item is just as described.",
    "Excellent quality. I've ordered many times from here and never disappointed.",
    "Brilliant product at a brilliant price. Delivery was also on time. Love it!",
    "This is a great product for the price. Would definitely recommend to others.",
  ],
  4: [
    "Good quality product. Delivery took 3 days but worth the wait.",
    "Nice item overall. Small packaging damage but product inside was perfect.",
    "Decent quality for the price. Happy with the purchase, just slightly smaller than expected.",
    "Good product. Matches the description well. Minor color difference in photo vs actual.",
    "Overall satisfied. Product is well-made and sturdy. Will consider buying again.",
    "Ramro cha tara thoda price ko lagi thika cha bhane hunchha. Happy with it!",
    "Nice quality. Courier handled delivery well. Just wished it came faster.",
    "Solid product. Does exactly what it should. Slightly different shade but still great.",
    "Happy with the purchase. Quality is good and price is fair. Recommend!",
    "Good buy! Product looks nice, feels premium. Small scratch on corner but minor.",
  ],
  3: [
    "Average product. Works fine but nothing special. Delivery was okay.",
    "Theekei cha. Khas ramro pani hoina, khas naramro pani hoina.",
    "Product is okay, not exactly as shown. Expected better quality for this price.",
    "Delivery was late but product is acceptable. Not my best purchase.",
    "It works but I expected more based on the photos. Average quality.",
    "Not bad but I've seen better. Product serves the purpose though.",
    "Mediocre quality. Packaging was good but the product could be better.",
  ],
  2: [
    "Quality is below expectation. The photos look much better than the actual product.",
    "Disappointed with the quality. Not worth the price. Expected much better.",
    "The product arrived damaged. Customer service was okay but still not happy.",
    "Too thin material. Will not order this again. Misleading product photos.",
    "Not as described. Returned the product. Hopefully will get refund soon.",
  ],
  1: [
    "Very poor quality. Completely different from the photo. Very disappointed.",
    "Worst purchase ever. Arrived broken and customer service didn't help.",
    "Product is fake. Do not buy. Total waste of money.",
    "Absolutely terrible. Nothing like what was shown. Requesting refund.",
  ],
}

function weightedRating(): 1 | 2 | 3 | 4 | 5 {
  const r = Math.random()
  if (r < 0.60) return 5
  if (r < 0.85) return 4
  if (r < 0.95) return 3
  if (r < 0.98) return 2
  return 1
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomPastDate(maxMonthsAgo = 6): string {
  const now = Date.now()
  const msAgo = Math.random() * maxMonthsAgo * 30 * 24 * 60 * 60 * 1000
  return new Date(now - msAgo).toISOString()
}

export interface DemoReview {
  product_id:    string
  customer_name: string
  rating:        number
  comment:       string
  verified:      boolean
  created_at:    string
}

export function generateDemoReviews(productId: string, count = 8): DemoReview[] {
  const reviews: DemoReview[] = []
  const usedNames = new Set<string>()

  for (let i = 0; i < count; i++) {
    const rating = weightedRating()
    let name: string
    let tries = 0
    do {
      name = pick(NEPALI_NAMES)
      tries++
    } while (usedNames.has(name) && tries < 20)
    usedNames.add(name)

    reviews.push({
      product_id:    productId,
      customer_name: name,
      rating,
      comment:       pick(REVIEW_TEXTS[rating]),
      verified:      false,
      created_at:    randomPastDate(6),
    })
  }

  // Sort by created_at descending (newest first)
  return reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}
