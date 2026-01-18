import type { TeamData } from "../types/game";
import mlbTeamsData from "../data/mlb_teams.json";

interface TeamRecord {
  name: string;
  teamLosses: number;
  teamWinPct: number;
  teamWins: number;
  year: number;
}

export const fetchRandomTeamsFromJSON = async (
  count: number = 66,
): Promise<TeamData[]> => {
  try {
    // Get all teams from local JSON file
    const allTeams = Object.values(mlbTeamsData) as TeamRecord[];

    if (allTeams.length === 0) {
      throw new Error("No teams found in data");
    }

    // Randomly select teams
    const selectedTeams = getRandomSubset(allTeams, count);

    // Sort by win percentage (descending)
    selectedTeams.sort((a, b) => b.teamWinPct - a.teamWinPct);

    // Convert to TeamData format and assign piece ranks
    const teamDataList: TeamData[] = [];
    for (let i = 0; i < selectedTeams.length; i++) {
      const team = selectedTeams[i];
      const playerNumber = i % 2 === 0 ? "1" : "2";
      const rank = i + 1;

      let pieceRank: string;
      let pieceNumberOrLetter: string;

      if (rank <= 2) {
        pieceRank = "Marshal";
        pieceNumberOrLetter = "1";
      } else if (rank <= 4) {
        pieceRank = "General";
        pieceNumberOrLetter = "2";
      } else if (rank <= 8) {
        pieceRank = "Colonel";
        pieceNumberOrLetter = "3";
      } else if (rank <= 14) {
        pieceRank = "Major";
        pieceNumberOrLetter = "4";
      } else if (rank <= 22) {
        pieceRank = "Captain";
        pieceNumberOrLetter = "5";
      } else if (rank <= 30) {
        pieceRank = "Lieutenant";
        pieceNumberOrLetter = "6";
      } else if (rank <= 38) {
        pieceRank = "Sergeant";
        pieceNumberOrLetter = "7";
      } else if (rank <= 48) {
        pieceRank = "Miner";
        pieceNumberOrLetter = "8";
      } else if (rank <= 64) {
        pieceRank = "Scout";
        pieceNumberOrLetter = "9";
      } else {
        pieceRank = "Spy";
        pieceNumberOrLetter = "S";
      }

      teamDataList.push({
        playerNumber,
        pieceRank,
        pieceNumberOrLetter,
        teamName: team.name,
        city: "", // Not available in Firebase data
        year: team.year,
        wins: team.teamWins,
        losses: team.teamLosses,
        winPercentage: team.teamWinPct,
      });
    }

    // Add 12 Bomb pieces
    const initialCount = teamDataList.length;
    for (let i = 0; i < 12; i++) {
      teamDataList.push({
        playerNumber: (initialCount + i) % 2 === 0 ? "1" : "2",
        pieceRank: "Bomb",
        pieceNumberOrLetter: "B",
        teamName: "",
        city: "",
        year: 0,
        wins: 0,
        losses: 0,
        winPercentage: 0,
      });
    }

    // Add 2 Flag pieces
    teamDataList.push({
      playerNumber: "1",
      pieceRank: "Flag",
      pieceNumberOrLetter: "F",
      teamName: "",
      city: "",
      year: 0,
      wins: 0,
      losses: 0,
      winPercentage: 0,
    });

    teamDataList.push({
      playerNumber: "2",
      pieceRank: "Flag",
      pieceNumberOrLetter: "F",
      teamName: "",
      city: "",
      year: 0,
      wins: 0,
      losses: 0,
      winPercentage: 0,
    });

    return teamDataList;
  } catch (error) {
    console.error("Error fetching teams:", error);
    throw error;
  }
};

// Fisher-Yates shuffle to randomly select n items from array
function getRandomSubset<T>(array: T[], count: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
