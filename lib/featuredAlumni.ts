import { loadAlumni } from "@/lib/loadAlumni";
import { getRecentUpdates } from "@/lib/getRecentUpdates";

export const vipList = [
  "alexis-floyd", "natalie-benally", "wolframio-sinue", "lucia-siposova",
  "mathilde-prosen-oldani", "naira-agvani-zakaryan", "javier-spivey",
  "peter-petkovsek", "antonia-lache", "sarah-grace-sanders", "candis-c-jones",
  "giulia-martinelli", "vanessa-frank", "tsebiyah-mishael", "karina-sindicich",
  "gareth-tidball", "daryl-paris-bright", "annie-hartkemeyer", "amna-mehmood",
  "alex-wanebo", "nick-lehane", "barbara-herucova", "jonathan-david",
  "igor-hudak", "cori-dioquino", "godfrey-betetse", "sian-youngerman",
  "sean-devare", "ryan-whinnem", "rachel-padell", "meghan-cashel",
  "lizzie-harless", "joseph-dale-harris", "john-kish", "jillian-ferry",
  "hailey-moran", "danya-taymor", "anthony-johnson", "tom-costello",
  "laura-riveros", "michael-axelrod", "lacy-allen", "janice-amaya",
  "ivano-pulito", "gabriel-kadian", "claudio-silva", "claire-edmonds",
  "anna-deblassio", "anna-cherkezishvili", "dominika-siroka", "elisha-lawson",
  "carmen-cabrera", "carlo-alban", "jaime-carillo", "masha-mendieta",
  "november-christine", "dionne-audain", "david-d-mitchell", "katarina-hughes",
  "natalie-hirsch", "lauren-ullrich", "jnelle-bobb-semple", "jamie-blanek",
  "heather-ichihashi", "hanniel-sindelar", "garrett-bales", "bryant-vance",
  "alena-acker", "adam-griffith", "zoe-reiniger", "tzena-nicole",
  "nemuna-ceesay", "michael-rau", "kathy-yamamoto", "katey-parker",
  "kara-wang", "josimar-tulloch", "jon-kevin-lazarus", "jim-knipple",
  "jeanne-lauren-smith", "jamil-mangan", "heather-massie",
  "eugene-michael-santiago", "blaine-patagoc", "amy-e-witting",
  "amanda-cortinas", "gustavo-redin", "jason-williamson", "christen-madrazo",
  "lydia-perez-feldman", "kathleen-amshoff", "lisa-bearpark"
];

// ✅ Weighted random selection
function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return items[i];
  }
  return items[items.length - 1];
}

export async function getFeaturedAlumni() {
  const alumni = await loadAlumni();
  const recentUpdates = getRecentUpdates(alumni, 50);

  const vipPool = alumni.filter((a) => vipList.includes(a.slug));
  const recentPool = alumni.filter((a) =>
    recentUpdates.some((u) => u.slug === a.slug)
  );

  // ✅ Build weighted pool
  const weightedPool: { item: any; weight: number }[] = [];
  alumni.forEach((a) => {
    let weight = 1; // Base
    if (vipPool.some((v) => v.slug === a.slug)) weight += 2;
    if (recentPool.some((r) => r.slug === a.slug)) weight += 1.5;
    weightedPool.push({ item: a, weight });
  });

  const highlights: any[] = [];
  const selected = new Set<string>();

  // ✅ Pick 4 unique alumni
  while (highlights.length < 4 && highlights.length < weightedPool.length) {
    const items = weightedPool.filter((p) => !selected.has(p.item.slug));
    const poolItems = items.map((p) => p.item);
    const poolWeights = items.map((p) => p.weight);
    const pick = weightedRandom(poolItems, poolWeights);

    if (pick) {
      highlights.push(pick);
      selected.add(pick.slug);
    }
  }

  return {
    highlights: highlights.map((a) => ({
      name: a.name || "Unknown",
      roles: a.roles || [],
      slug: a.slug,
      headshotUrl: a.headshotUrl ?? "/images/default-headshot.png",
    })),
    recentUpdates: recentUpdates.slice(0, 5),
  };
}
