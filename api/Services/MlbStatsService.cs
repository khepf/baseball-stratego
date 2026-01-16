using MLBApi.Models;
using System.Text.Json;

namespace MLBApi.Services;

public class MlbStatsService : IMlbStatsService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MlbStatsService> _logger;
    private readonly Random _random;
    
    // MLB has been around since 1876, but modern stats are more reliable from 1900+
    private readonly int _startYear = 1876;
    private readonly int _endYear = DateTime.Now.Year - 1; // Previous season

    public MlbStatsService(HttpClient httpClient, ILogger<MlbStatsService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _random = new Random();
        _httpClient.BaseAddress = new Uri("https://statsapi.mlb.com/api/v1/");
    }

    public async Task<List<TeamData>> GetRandomTeamsAsync(int count = 66)
    {
        var teamDataList = new List<TeamData>();
        var attempts = 0;
        var maxAttempts = count * 3; // Allow multiple attempts to get unique combinations

        try
        {
            // First, get all available teams
            var allTeams = await GetAllTeamsAsync();
            if (!allTeams.Any())
            {
                _logger.LogWarning("No teams found from MLB API");
                return teamDataList;
            }

            while (teamDataList.Count < count && attempts < maxAttempts)
            {
                attempts++;
                
                // Pick a random team and random year
                var randomTeam = allTeams[_random.Next(allTeams.Count)];
                var randomYear = _random.Next(_startYear, _endYear + 1);
                
                // Check if we already have this team/year combination
                if (teamDataList.Any(t => t.TeamName == randomTeam.Name && t.Year == randomYear))
                    continue;

                try
                {
                    var teamStats = await GetTeamStatsForYearAsync(randomTeam.Id, randomYear);
                    if (teamStats != null)
                    {
                        teamDataList.Add(teamStats);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to get stats for team {TeamName} in year {Year}", randomTeam.Name, randomYear);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting random teams");
        }

        // Sort the list by win percentage
        var sortedList = teamDataList.OrderByDescending(t => t.WinPercentage).ToList();
        
        // Assign alternating player numbers and piece ranks based on position
        for (int i = 0; i < sortedList.Count; i++)
        {
            sortedList[i].PlayerNumber = (i % 2 == 0) ? "1" : "2";
            
            // Assign piece rank and number/letter based on position (1-based)
            int rank = i + 1;
            if (rank <= 2)
            {
                sortedList[i].PieceRank = "Marshal";
                sortedList[i].PieceNumberOrLetter = "1";
            }
            else if (rank <= 4)
            {
                sortedList[i].PieceRank = "General";
                sortedList[i].PieceNumberOrLetter = "2";
            }
            else if (rank <= 8)
            {
                sortedList[i].PieceRank = "Colonel";
                sortedList[i].PieceNumberOrLetter = "3";
            }
            else if (rank <= 14)
            {
                sortedList[i].PieceRank = "Major";
                sortedList[i].PieceNumberOrLetter = "4";
            }
            else if (rank <= 22)
            {
                sortedList[i].PieceRank = "Captain";
                sortedList[i].PieceNumberOrLetter = "5";
            }
            else if (rank <= 30)
            {
                sortedList[i].PieceRank = "Lieutenant";
                sortedList[i].PieceNumberOrLetter = "6";
            }
            else if (rank <= 38)
            {
                sortedList[i].PieceRank = "Sergeant";
                sortedList[i].PieceNumberOrLetter = "7";
            }
            else if (rank <= 48)
            {
                sortedList[i].PieceRank = "Miner";
                sortedList[i].PieceNumberOrLetter = "8";
            }
            else if (rank <= 64)
            {
                sortedList[i].PieceRank = "Scout";
                sortedList[i].PieceNumberOrLetter = "9";
            }
            else // rank 65-66
            {
                sortedList[i].PieceRank = "Spy";
                sortedList[i].PieceNumberOrLetter = "S";
            }
        }
        
        // Add 12 Bomb pieces with alternating player numbers
        int initialCount = sortedList.Count;
        for (int i = 0; i < 12; i++)
        {
            sortedList.Add(new TeamData
            {
                PlayerNumber = ((initialCount + i) % 2 == 0) ? "1" : "2",
                PieceRank = "Bomb",
                PieceNumberOrLetter = "B",
                TeamName = string.Empty,
                City = string.Empty,
                Year = 0,
                Wins = 0,
                Losses = 0,
                WinPercentage = 0
            });
        }
        
        // Add 2 Flag pieces (one for each player)
        sortedList.Add(new TeamData
        {
            PlayerNumber = "1",
            PieceRank = "Flag",
            PieceNumberOrLetter = "F",
            TeamName = string.Empty,
            City = string.Empty,
            Year = 0,
            Wins = 0,
            Losses = 0,
            WinPercentage = 0
        });
        
        sortedList.Add(new TeamData
        {
            PlayerNumber = "2",
            PieceRank = "Flag",
            PieceNumberOrLetter = "F",
            TeamName = string.Empty,
            City = string.Empty,
            Year = 0,
            Wins = 0,
            Losses = 0,
            WinPercentage = 0
        });
        
        return sortedList;
    }

    public async Task<List<MlbTeam>> GetAllTeamsAsync()
    {
        try
        {
            var response = await _httpClient.GetStringAsync("teams?sportId=1");
            var teamsResponse = JsonSerializer.Deserialize<MlbTeamResponse>(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            
            return teamsResponse?.Teams ?? new List<MlbTeam>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get teams from MLB API");
            return new List<MlbTeam>();
        }
    }

    private async Task<TeamData?> GetTeamStatsForYearAsync(int teamId, int year)
    {
        try
        {
            // Get team standings for the specific year
            var standingsUrl = $"standings?leagueId=103,104&season={year}&standingsTypes=regularSeason";
            var standingsResponse = await _httpClient.GetStringAsync(standingsUrl);
            
            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
            
            var standings = JsonSerializer.Deserialize<StandingsResponse>(standingsResponse, options);
            
            if (standings?.Records == null)
            {
                return null;
            }
            
            // Find the team in the standings
            foreach (var divisionRecord in standings.Records)
            {
                if (divisionRecord.TeamRecords == null) continue;
                
                var teamRecord = divisionRecord.TeamRecords.FirstOrDefault(tr => tr.Team?.Id == teamId);
                if (teamRecord != null)
                {
                    // Get team details for the specific season to retrieve historical city/location name
                    var teamInfoUrl = $"teams/{teamId}?season={year}";
                    var teamInfoResponse = await _httpClient.GetStringAsync(teamInfoUrl);
                    var teamInfo = JsonSerializer.Deserialize<MlbTeamInfoResponse>(teamInfoResponse, options);
                    var city = teamInfo?.Teams?.FirstOrDefault()?.FranchiseName ?? string.Empty;
                    
                    return new TeamData
                    {
                        TeamName = teamRecord.Team.Name,
                        City = city,
                        Year = year,
                        Wins = teamRecord.Wins,
                        Losses = teamRecord.Losses,
                        WinPercentage = Math.Round(double.Parse(teamRecord.WinningPercentage.TrimStart('.')), 3)
                    };
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Could not get stats for team {TeamId} in year {Year}", teamId, year);
        }
        
        return null;
    }
}

// Additional response models for the stats API
public class MlbTeamStatsResponse
{
    public List<MlbTeamStatGroup> Stats { get; set; } = new();
}

public class MlbTeamStatGroup
{
    public List<MlbTeamStatSplit> Splits { get; set; } = new();
}

public class MlbTeamStatSplit
{
    public MlbTeamStatData Stat { get; set; } = new();
}

public class MlbTeamStatData
{
    public int Wins { get; set; }
    public int Losses { get; set; }
    public string WinPercentage { get; set; } = "0.000";
}

public class MlbTeamInfoResponse
{
    public List<MlbTeam> Teams { get; set; } = new();
}

public class StandingsResponse
{
    public List<DivisionStandingRecord> Records { get; set; } = new();
}

public class DivisionStandingRecord
{
    public List<TeamStandingRecord> TeamRecords { get; set; } = new();
}

public class TeamStandingRecord
{
    public StandingTeam Team { get; set; } = new();
    public int Wins { get; set; }
    public int Losses { get; set; }
    public string WinningPercentage { get; set; } = ".000";
}

public class StandingTeam
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
}