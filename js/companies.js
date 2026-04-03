var HIRING_COMPANY_POOL = [
  { name: "CRED", email: "careers@cred.club", type: "startup", location: "Bengaluru", focus: "Fintech", role: "Software Development Engineer", sourceUrl: "https://careers.cred.club/", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "Razorpay", email: "careers@razorpay.com", type: "startup", location: "Bengaluru", focus: "Payments", role: "Software Engineer / Backend", sourceUrl: "https://razorpay.com/jobs/", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "Postman", email: "careers@postman.com", type: "startup", location: "Bengaluru", focus: "Developer tools", role: "Software Engineer", sourceUrl: "https://www.postman.com/company/careers/", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "Juspay", email: "careers@juspay.in", type: "startup", location: "Bengaluru", focus: "Payments infra", role: "Software Engineer", sourceUrl: "https://juspay.io/careers/", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "Groww", email: "careers@groww.in", type: "startup", location: "Bengaluru", focus: "Investing platform", role: "Software Development Engineer", sourceUrl: "https://groww.in/careers", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "Cashfree", email: "careers@cashfree.com", type: "startup", location: "Bengaluru", focus: "Payments", role: "SDE / Backend", sourceUrl: "https://www.cashfree.com/careers/", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "Slice", email: "careers@sliceit.com", type: "startup", location: "Bengaluru", focus: "Consumer fintech", role: "Software Engineer", sourceUrl: "https://sliceit.com/careers", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "Jupiter", email: "careers@jupiter.money", type: "startup", location: "Bengaluru", focus: "Consumer fintech", role: "Software Engineer", sourceUrl: "https://jupiter.money/careers/", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "PolicyBazaar", email: "careers@policybazaar.com", type: "startup", location: "Gurugram", focus: "Insurtech", role: "Software Engineer", sourceUrl: "https://www.policybazaar.com/careers/", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "PaisaBazaar", email: "hr@paisabazaar.com", type: "startup", location: "Gurugram", focus: "Consumer finance", role: "Software Engineer", sourceUrl: "https://www.paisabazaar.com/careers/", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "OfBusiness", email: "hr@ofbusiness.in", type: "startup", location: "Gurugram", focus: "B2B commerce", role: "Full Stack Developer", sourceUrl: "https://www.ofbusiness.in/careers", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "Sprinklr", email: "careers@sprinklr.com", type: "startup", location: "Gurugram", focus: "Enterprise SaaS", role: "Software Development Engineer", sourceUrl: "https://www.sprinklr.com/careers/", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "Nagarro", email: "careers@nagarro.com", type: "services", location: "Gurugram", focus: "Product engineering", role: "Associate Staff Engineer", sourceUrl: "https://www.nagarro.com/en/careers", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "GlobalLogic", email: "careers@globallogic.com", type: "services", location: "Noida", focus: "Engineering services", role: "Full Stack Developer", sourceUrl: "https://www.globallogic.com/career-search-page/", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "Coforge", email: "careers@coforge.com", type: "services", location: "Noida", focus: "Enterprise delivery", role: "Full Stack Developer", sourceUrl: "https://careers.coforge.com/", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "Newgen Software", email: "hr@newgensoft.com", type: "services", location: "Noida", focus: "Workflow and BPM", role: "Software Engineer", sourceUrl: "https://newgensoft.com/careers/", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "PhysicsWallah", email: "careers@pw.live", type: "startup", location: "Noida", focus: "Edtech platform", role: "Software Engineer", sourceUrl: "https://www.pw.live/careers", sourceLabel: "Official careers page checked 2026-03-31", selected: true },
  { name: "BrowserStack", email: "careers@browserstack.com", type: "startup", location: "Bengaluru", focus: "Testing infrastructure", role: "Software Engineer", sourceUrl: "https://www.browserstack.com/careers", sourceLabel: "Official careers page checked 2026-03-31", selected: true }
];

var HIRING_BATCH_SIZE = 25;
var DEFAULT_COMPANIES = HIRING_COMPANY_POOL.slice(0, HIRING_BATCH_SIZE);

function getHiringBatch(startIndex, size) {
  var results = [];
  var pool = HIRING_COMPANY_POOL;
  var count = Math.min(size || HIRING_BATCH_SIZE, pool.length);
  var start = ((startIndex || 0) % pool.length + pool.length) % pool.length;

  for (var i = 0; i < count; i++) {
    results.push(pool[(start + i) % pool.length]);
  }

  return JSON.parse(JSON.stringify(results));
}
