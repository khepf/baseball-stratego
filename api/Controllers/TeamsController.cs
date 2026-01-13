using Microsoft.AspNetCore.Mvc;
using MLBApi.Models;
using MLBApi.Services;

namespace MLBApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamsController : ControllerBase
{
    private readonly IMlbStatsService _mlbStatsService;
    private readonly ILogger<TeamsController> _logger;

    public TeamsController(IMlbStatsService mlbStatsService, ILogger<TeamsController> logger)
    {
        _mlbStatsService = mlbStatsService;
        _logger = logger;
    }

    /// <summary>
    /// Gets random MLB teams from random years with their win percentage
    /// </summary>
    /// <param name="count">Number of random teams to return (default: 66, max: 100)</param>
    /// <returns>List of team data including name, year, and win percentage</returns>
    [HttpGet("random")]
    public async Task<ActionResult<List<TeamData>>> GetRandomTeams([FromQuery] int count = 66)
    {
        try
        {
            // Validate count parameter
            if (count <= 0)
            {
                return BadRequest("Count must be greater than 0");
            }
            
            if (count > 100)
            {
                return BadRequest("Count cannot exceed 100");
            }

            _logger.LogInformation("Fetching {Count} random MLB teams", count);
            
            var teams = await _mlbStatsService.GetRandomTeamsAsync(count);
            
            if (!teams.Any())
            {
                _logger.LogWarning("No teams were returned from the service");
                return Ok(new List<TeamData>());
            }

            _logger.LogInformation("Successfully returned {ActualCount} random MLB teams", teams.Count);
            
            return Ok(teams);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching random teams");
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    /// <returns>Simple status message</returns>
    [HttpGet("health")]
    public ActionResult GetHealth()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }
}