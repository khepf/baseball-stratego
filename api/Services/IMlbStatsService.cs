using MLBApi.Models;

namespace MLBApi.Services;

public interface IMlbStatsService
{
    Task<List<TeamData>> GetRandomTeamsAsync(int count = 40);
    Task<List<MlbTeam>> GetAllTeamsAsync();
}