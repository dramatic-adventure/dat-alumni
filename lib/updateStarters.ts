export const CORE_STARTERS = [
  "I’m working on…",
  "I’m developing…",
  "I’m collaborating with…",
  "I’m exploring…",
  "I’m shaping…",
  "I’m in rehearsal for…",
  "I’m deep in the process of…",
  "I’m in the middle of…",
  "I just wrapped…",
  "I’m beginning work on…",

  "I’m thrilled to…",
  "I’m proud of…",
  "I’m grateful for…",
  "I’m honored to be…",
  "I’m excited to share…",
  "I’m lucky to be part of…",
  "I’m taking a moment to celebrate…",
  "I’m excited to keep building…",
  "I’m proud to stand with…",

  "I’m teaching…",
  "I’m learning alongside…",
  "I’m mentoring…",
  "I’m working with…",
  "I’m supporting…",
  "I’m proud of my students for…",
  "I’m supporting young artists as they…",
  "I’m learning from artists in…",
  "I’m holding space for…",

  "I’m currently in…",
  "I’m arriving in…",
  "I’m returning to…",
  "I’m focusing on…",
  "I’m just beginning…",
  "I’m reflecting on…",
  "I’m inspired by…",
  "I’m settling into…",
  "I’m moving toward…",

  "I’m honored to be welcomed into…",
  "I’m grateful to this community for…",
  "I’m thankful for the artists who…",
  "I’m excited to be part of…",
  "I’m showing up for…",
  "I’m standing in solidarity with…",
  "I’m carrying forward…",
] as const;

export const DAT_GOLD_STARTERS = [
  "Working with DAT taught me to…",
  "Because of DAT, I approach my work now by…",
  "Making theatre with DAT changed how I think about…",
  "There was a moment during my time with DAT when…",
  "DAT gave me permission to…",
  "What stays with me from my Dramatic Adventure experience is…",
] as const;

export const ALL_STARTERS = [...CORE_STARTERS, ...DAT_GOLD_STARTERS] as const;

export function isDatGold(promptUsed: string) {
  return (DAT_GOLD_STARTERS as readonly string[]).includes(promptUsed);
}
