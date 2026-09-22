using Mastercard.Developer.OAuth1Signer.Core.Signers;

namespace Unico.Mastercard.Api.Client;

/// <summary>Signs outgoing requests with a Mastercard OAuth 1.0a authorization header.</summary>
public sealed class OAuth1SigningHandler : DelegatingHandler
{
    private readonly NetHttpClientSigner _signer;

    public OAuth1SigningHandler(NetHttpClientSigner signer)
    {
        _signer = signer ?? throw new ArgumentNullException(nameof(signer));
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        _signer.Sign(request);
        return base.SendAsync(request, cancellationToken);
    }
}
