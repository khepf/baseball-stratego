# MLB Random Teams API

A C# ASP.NET Core Web API that fetches random MLB team data from the official MLB Stats API.

## Features

- Fetches 66 random MLB teams from random years (1950-2023)
- Returns team name, year, and win percentage for each team
- Built with ASP.NET Core 8.0
- Includes Swagger documentation
- CORS enabled for frontend integration

## API Endpoints

### GET /api/teams/random

Fetches random MLB teams with their statistics.

**Query Parameters:**

- `count` (optional): Number of teams to return (default: 66, max: 100)

**Example Request:**

```
GET /api/teams/random?count=10
```

**Example Response:**

```json
[
  {
    "teamName": "Cincinnati Reds",
    "year": 1990,
    "winPercentage": 0.636,
    "wins": 91,
    "losses": 71
  },
  {
    "teamName": "New York Yankees",
    "year": 1998,
    "winPercentage": 0.704,
    "wins": 114,
    "losses": 48
  }
]
```

### GET /api/teams/health

Simple health check endpoint.

## Running the API

1. Make sure you have .NET 8.0 SDK installed
2. Navigate to the api directory:
   ```
   cd api
   ```
3. Restore packages:
   ```
   dotnet restore
   ```
4. Run the application:
   ```
   dotnet run
   ```
5. The API will start at `https://localhost:5001`
6. Visit `https://localhost:5001/swagger` to see the interactive API documentation

## Project Structure

```
api/
├── Controllers/
│   └── TeamsController.cs     # API endpoints
├── Models/
│   └── TeamModels.cs         # Data models
├── Services/
│   ├── IMlbStatsService.cs   # Service interface
│   └── MlbStatsService.cs    # MLB API integration
├── Program.cs                # Application startup
├── MLBApi.csproj            # Project file
└── appsettings.json         # Configuration
```

## Data Source

This API uses the official MLB Stats API (statsapi.mlb.com) to fetch team statistics and information. The API focuses on years 1950 onwards for better data reliability.

## Error Handling

The API includes comprehensive error handling and logging. If fewer teams are returned than requested, it's typically because:

- Some team/year combinations don't have complete statistical data
- Network issues with the MLB Stats API
- Teams that didn't exist in certain years

The API will return as many valid team records as it can find up to the requested count.
