namespace MLBApi.Models;

public class TeamData
{
    public string TeamName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public int Year { get; set; }
    public double WinPercentage { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
    public string PlayerNumber { get; set; } = string.Empty;
    public string PieceRank { get; set; } = string.Empty;
    public string PieceNumberOrLetter { get; set; } = string.Empty;
}

public class MlbTeamResponse
{
    public List<MlbTeam> Teams { get; set; } = new();
}

public class MlbTeam
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public string FranchiseName { get; set; } = string.Empty;
    public TeamSeason? TeamStats { get; set; }
    public TeamRecord? Record { get; set; }
}

public class TeamSeason
{
    public List<TeamSeasonStat> Splits { get; set; } = new();
}

public class TeamSeasonStat
{
    public TeamSeasonStatData Stat { get; set; } = new();
    public Season Season { get; set; } = new();
}

public class TeamSeasonStatData
{
    public int Wins { get; set; }
    public int Losses { get; set; }
    public string WinPercentage { get; set; } = string.Empty;
}

public class Season
{
    public string SeasonId { get; set; } = string.Empty;
}

public class MlbSeasonsResponse
{
    public List<MlbSeason> Seasons { get; set; } = new();
}

public class MlbSeason
{
    public string SeasonId { get; set; } = string.Empty;
}

public class TeamRecord
{
    public List<TeamRecordData> Records { get; set; } = new();
}

public class TeamRecordData
{
    public int Wins { get; set; }
    public int Losses { get; set; }
    public string WinPercentage { get; set; } = "0.000";
}