namespace Unico.Mastercard.Api.Configuration;

/// <summary>
/// Settings for connecting to the Mastercard Processing Core API.
/// </summary>
public sealed class MastercardOptions
{
    public const string SectionName = "Mastercard";

    /// <summary>Base URL of the Processing Core API (sandbox, MTF, or production).</summary>
    public string BaseUrl { get; set; } = "https://sandbox.api.mastercard.com/global-processing/core/";

    /// <summary>Consumer key issued by the Mastercard Developers portal.</summary>
    public string ConsumerKey { get; set; } = string.Empty;

    /// <summary>File path to the PKCS#12 (.p12) private signing key.</summary>
    public string SigningKeyPath { get; set; } = string.Empty;

    /// <summary>Alias of the key entry inside the PKCS#12 keystore.</summary>
    public string SigningKeyAlias { get; set; } = string.Empty;

    /// <summary>Password protecting the PKCS#12 keystore.</summary>
    public string SigningKeyPassword { get; set; } = string.Empty;

    /// <summary>When true, endpoints return canned sandbox-like data instead of calling Mastercard.</summary>
    public bool UseMock { get; set; } = true;

    /// <summary>File path to Mastercard's public JWE encryption certificate (PEM), used to encrypt outgoing sensitive fields.</summary>
    public string EncryptionCertificatePath { get; set; } = string.Empty;

    /// <summary>File path to the PKCS#12 (.p12) keystore holding your JWE decryption private key.</summary>
    public string DecryptionKeyPath { get; set; } = string.Empty;

    /// <summary>Alias of the key entry inside the decryption PKCS#12 keystore.</summary>
    public string DecryptionKeyAlias { get; set; } = string.Empty;

    /// <summary>Password protecting the decryption PKCS#12 keystore.</summary>
    public string DecryptionKeyPassword { get; set; } = string.Empty;

    /// <summary>
    /// JSON pointer mappings describing which request fields must be JWE-encrypted before sending, and where
    /// the resulting encrypted value should be placed (per operations flagged <c>x-mastercard-api-encrypted</c>).
    /// </summary>
    public string EncryptedValueFieldName { get; set; } = string.Empty;

    /// <summary>
    /// JSON pointer mappings describing which response fields hold a JWE-encrypted value that must be decrypted,
    /// and where the resulting plaintext value should be placed.
    /// </summary>
    public List<JwePathMapping> DecryptionPaths { get; set; } = new List<JwePathMapping>();
}

/// <summary>A single "from" JSON pointer / "to" JSON pointer mapping used to configure JWE payload encryption.</summary>
public sealed class JwePathMapping
{
    public string From { get; set; } = string.Empty;

    public string To { get; set; } = string.Empty;
}
