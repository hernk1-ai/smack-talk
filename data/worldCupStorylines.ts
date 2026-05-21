export type StorylineCategory = "Group Stage" | "Title Race" | "Pressure Watch" | "Dark Horse";

export type WorldCupStoryline = {
  id: string;
  slug: string;
  title: string;
  teaser: string;
  body: string;
  category: StorylineCategory;
  relatedTeams: string[];
  relatedGroup?: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
};

export const worldCupStorylines: WorldCupStoryline[] = [
  {
    id: "story-usa-group-d",
    slug: "can-the-united-states-survive-group-d",
    title: "Can the United States survive Group D?",
    teaser: "The talent is there, but Group D looks unforgiving from match one.",
    body:
      "The United States enters Group D with real expectations and real pressure. Paraguay can punish defensive mistakes, Australia brings physical tempo, and Türkiye can control stretches of possession. If the U.S. wants to advance, early composure and game management could matter as much as attacking quality.",
    category: "Group Stage",
    relatedTeams: ["United States", "Paraguay", "Australia", "Türkiye"],
    relatedGroup: "Group D",
    videoUrl: "https://www.youtube.com/watch?v=TB3d0aQVnCQ",
    createdAt: "2026-05-10",
  },
  {
    id: "story-brazil-watch",
    slug: "is-brazil-the-team-everyone-should-watch",
    title: "Is Brazil the team everyone should be watching?",
    teaser: "Brazil has ceiling, depth, and knockout pedigree — but can they stay balanced?",
    body:
      "Brazil’s path always starts with flair, but their tournament hopes usually depend on structure. If they can control midfield transitions and avoid open, end-to-end matches, they become one of the most complete squads in the field. Group-stage consistency could set their knockout tone.",
    category: "Title Race",
    relatedTeams: ["Brazil", "Morocco", "Scotland", "Haiti"],
    relatedGroup: "Group C",
    videoUrl: "https://www.youtube.com/watch?v=fip7y3qPYdI",
    createdAt: "2026-05-11",
  },
  {
    id: "story-england-path",
    slug: "englands-path-looks-friendly-but-is-it-a-trap",
    title: "England’s path looks friendly — but is it a trap?",
    teaser: "The draw looks manageable, but underestimating group chaos has ended runs before.",
    body:
      "England’s group can look straightforward on paper, but tournament momentum can flip quickly. Croatia’s experience, Ghana’s physical edge, and Panama’s discipline can create awkward match scripts. If England starts slowly, pressure will mount instantly.",
    category: "Pressure Watch",
    relatedTeams: ["England", "Croatia", "Ghana", "Panama"],
    relatedGroup: "Group L",
    videoUrl: "https://www.youtube.com/watch?v=GyyWk_DD9Mo",
    createdAt: "2026-05-12",
  },
  {
    id: "story-france-pressure",
    slug: "france-enters-with-pressure-not-comfort",
    title: "France enters with pressure, not comfort.",
    teaser: "France has elite quality, but this group demands intensity from kickoff.",
    body:
      "France rarely lacks talent, but this cycle starts under a microscope. Senegal can stretch games, Norway can punish set-piece lapses, and Iraq can force uncomfortable tempo. For France, the bigger question is mindset: can they control pressure before pressure controls them?",
    category: "Pressure Watch",
    relatedTeams: ["France", "Senegal", "Iraq", "Norway"],
    relatedGroup: "Group I",
    videoUrl: "https://www.youtube.com/watch?v=Cinl_RRAjzc",
    createdAt: "2026-05-13",
  },
  {
    id: "story-mexico-host-pressure",
    slug: "mexico-has-home-field-pressure-from-day-one",
    title: "Mexico has home-field pressure from day one.",
    teaser: "Hosting can be power — or pressure — and Mexico starts with both.",
    body:
      "Mexico opens with home support and major expectations. South Africa can sit deep and counter, South Korea can run games into transition battles, and Czechia can grind results. Mexico’s margin for error may be slimmer than the noise suggests.",
    category: "Dark Horse",
    relatedTeams: ["Mexico", "South Africa", "South Korea", "Czechia"],
    relatedGroup: "Group A",
    videoUrl: "https://www.youtube.com/watch?v=tnsYoYM67AE",
    createdAt: "2026-05-14",
  },
  {
    id: "story-spain-balance",
    slug: "spain-can-they-control-the-tournament-tempo",
    title: "Can Spain control the tournament tempo?",
    teaser: "Spain has control and depth, but can they turn possession into decisive moments?",
    body:
      "Spain’s identity is still built around controlling matches, but tournament success depends on cutting edge in key moments. Their shape can choke transitions, yet knockout football rewards efficiency and composure in thin-margin games. If Spain balances control with direct threat, they can go deep.",
    category: "Title Race",
    relatedTeams: ["Spain", "Uruguay", "Saudi Arabia", "Cabo Verde"],
    relatedGroup: "Group H",
    videoUrl: "https://www.youtube.com/watch?v=yUSWmgt0Uzo",
    createdAt: "2026-05-15",
  },
];

export function getStorylineBySlug(slug: string) {
  return worldCupStorylines.find((storyline) => storyline.slug === slug) ?? null;
}
