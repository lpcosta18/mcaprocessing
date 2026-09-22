namespace Unico.Mastercard.Api.Client;

/// <summary>Thrown when the Mastercard Processing Core API returns a non-success response.</summary>
public sealed class MastercardApiException : Exception
{
    public int StatusCode { get; }
    public string? ResponseBody { get; }

    public MastercardApiException(int statusCode, string? responseBody)
        : base($"Mastercard Processing Core API returned HTTP {statusCode}.")
    {
        StatusCode = statusCode;
        ResponseBody = responseBody;
    }
}
