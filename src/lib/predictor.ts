// ============================================================
// Takwira Predictor Engine
// Uses Poisson distribution + weighted form + H2H analysis
// ============================================================

interface TeamStats {
  goalsFor: number;
  goalsAgainst: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
}

interface PredictionResult {
  homeWin: number;   // probability 0-1
  draw: number;
  awayWin: number;
  predictedScore: { home: number; away: number };
  confidence: "high" | "medium" | "low";
  insights: string[];
}

function poissonProbability(lambda: number, k: number): number {
  // P(X=k) = e^(-λ) * λ^k / k!
  let logProb = -lambda + k * Math.log(lambda);
  for (let i = 1; i <= k; i++) logProb -= Math.log(i);
  return Math.exp(logProb);
}

function predictScoreProbabilities(
  homeLambda: number,
  awayLambda: number,
  maxGoals = 7
): { home: number; draw: number; away: number; scoreMatrix: number[][] } {
  const matrix: number[][] = [];
  let homeWin = 0, draw = 0, awayWin = 0;

  for (let h = 0; h <= maxGoals; h++) {
    matrix[h] = [];
    for (let a = 0; a <= maxGoals; a++) {
      const p = poissonProbability(homeLambda, h) * poissonProbability(awayLambda, a);
      matrix[h][a] = p;
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
    }
  }

  return { home: homeWin, draw, away: awayWin, scoreMatrix: matrix };
}

function getMostLikelyScore(matrix: number[][]): { home: number; away: number } {
  let maxProb = 0;
  let bestH = 0, bestA = 0;
  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      if (matrix[h][a] > maxProb) {
        maxProb = matrix[h][a];
        bestH = h;
        bestA = a;
      }
    }
  }
  return { home: bestH, away: bestA };
}

export function predict(
  homeStats: TeamStats,
  awayStats: TeamStats,
  h2hMatches: Array<{ homeGoals: number; awayGoals: number; homeTeamId: number }>,
  homeTeamId: number,
  leagueAvgGoals = 2.6
): PredictionResult {
  const insights: string[] = [];

  // Base attack/defense strength
  const homeAttack = homeStats.played > 0 ? homeStats.goalsFor / homeStats.played : 1.2;
  const homeDefense = homeStats.played > 0 ? homeStats.goalsAgainst / homeStats.played : 1.2;
  const awayAttack = awayStats.played > 0 ? awayStats.goalsFor / awayStats.played : 1.0;
  const awayDefense = awayStats.played > 0 ? awayStats.goalsAgainst / awayStats.played : 1.0;

  // Home advantage factor (~1.3x historically in football)
  const HOME_ADVANTAGE = 1.2;

  // Expected goals (Poisson lambda)
  let homeLambda = (homeAttack / leagueAvgGoals) * (awayDefense / leagueAvgGoals) * leagueAvgGoals * HOME_ADVANTAGE;
  let awayLambda = (awayAttack / leagueAvgGoals) * (homeDefense / leagueAvgGoals) * leagueAvgGoals;

  // H2H adjustment (weight: 20%)
  if (h2hMatches.length > 0) {
    let h2hHomeGoals = 0, h2hAwayGoals = 0;
    h2hMatches.forEach((m) => {
      if (m.homeTeamId === homeTeamId) {
        h2hHomeGoals += m.homeGoals;
        h2hAwayGoals += m.awayGoals;
      } else {
        h2hHomeGoals += m.awayGoals;
        h2hAwayGoals += m.homeGoals;
      }
    });
    const h2hHomeLambda = h2hHomeGoals / h2hMatches.length;
    const h2hAwayLambda = h2hAwayGoals / h2hMatches.length;
    homeLambda = homeLambda * 0.8 + h2hHomeLambda * 0.2;
    awayLambda = awayLambda * 0.8 + h2hAwayLambda * 0.2;
    insights.push(`H2H: based on last ${h2hMatches.length} meetings`);
  }

  // Clamp lambdas to reasonable range
  homeLambda = Math.max(0.3, Math.min(4.5, homeLambda));
  awayLambda = Math.max(0.3, Math.min(4.5, awayLambda));

  const { home: homeWin, draw, away: awayWin, scoreMatrix } = predictScoreProbabilities(homeLambda, awayLambda);
  const predictedScore = getMostLikelyScore(scoreMatrix);

  // Confidence: high if one outcome > 55%, medium if > 40%, low otherwise
  const maxProb = Math.max(homeWin, draw, awayWin);
  const confidence: "high" | "medium" | "low" = maxProb > 0.55 ? "high" : maxProb > 0.40 ? "medium" : "low";

  // Form insights
  if (homeStats.played > 0) {
    const homeForm = homeStats.wins / homeStats.played;
    if (homeForm > 0.6) insights.push("Home team in strong form");
    else if (homeForm < 0.3) insights.push("Home team struggling recently");
  }
  if (awayStats.played > 0) {
    const awayForm = awayStats.wins / awayStats.played;
    if (awayForm > 0.6) insights.push("Away team in strong form");
    else if (awayForm < 0.3) insights.push("Away team struggling recently");
  }

  return {
    homeWin: Math.round(homeWin * 1000) / 1000,
    draw: Math.round(draw * 1000) / 1000,
    awayWin: Math.round(awayWin * 1000) / 1000,
    predictedScore,
    confidence,
    insights,
  };
}
