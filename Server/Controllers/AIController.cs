using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace NewsHub_New_Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AIController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private const string ModelId = "meta-llama/Meta-Llama-3-8B-Instruct";
        private const string RouterUrl = "https://router.huggingface.co/v1/chat/completions";

        public AIController(IConfiguration configuration)
        {
            _configuration = configuration;
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
        }

        [HttpPost("sentiment")]
        public async Task<IActionResult> AnalyzeSentiment([FromBody] AIRequest request)
        {
            try
            {
                var prompt = $@"Classify the sentiment of the following news text as 'POSITIVE', 'NEGATIVE', or 'NEUTRAL'. 
Return ONLY the JSON object format: {{""label"": ""POSITIVE"", ""score"": 0.99}}. 
Do not include any explanation.

Text: {request.Inputs}";

                var result = await CallLLM(prompt, 50);
                
                // Fallback parsing if LLM is chatty
                var label = "NEUTRAL";
                var score = 0.5;

                if (result.Contains("POSITIVE", StringComparison.OrdinalIgnoreCase)) { label = "POSITIVE"; score = 0.9; }
                else if (result.Contains("NEGATIVE", StringComparison.OrdinalIgnoreCase)) { label = "NEGATIVE"; score = 0.9; }

                // Return format matching what frontend expects (array of objects)
                return Ok(new[] { new { label = label, score = score } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("summary")]
        public async Task<IActionResult> Summarize([FromBody] AIRequest request)
        {
            try
            {
                var prompt = $@"Summarize the following news article in 2 clear sentences. Keep it concise.

Text: {request.Inputs}";

                var summary = await CallLLM(prompt, 150);
                
                // Return format matching what frontend expects
                return Ok(new[] { new { summary_text = summary.Trim() } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        private async Task<string> CallLLM(string prompt, int maxTokens)
        {
            var token = _configuration["HuggingFace:Token"];
            if (string.IsNullOrEmpty(token))
                throw new Exception("AI configuration missing");

            var requestBody = new
            {
                model = ModelId,
                messages = new[]
                {
                    new { role = "user", content = prompt }
                },
                max_tokens = maxTokens,
                temperature = 0.1 // Low temperature for deterministic results
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            _httpClient.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.PostAsync(RouterUrl, content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Hugging Face Error: {responseString}");
            }

            using var doc = JsonDocument.Parse(responseString);
            var choices = doc.RootElement.GetProperty("choices");
            if (choices.GetArrayLength() > 0)
            {
                var messageContent = choices[0].GetProperty("message").GetProperty("content").GetString();
                return messageContent ?? string.Empty;
            }

            return string.Empty;
        }
    }

    public class AIRequest
    {
        public string Inputs { get; set; } = string.Empty;
    }
}
