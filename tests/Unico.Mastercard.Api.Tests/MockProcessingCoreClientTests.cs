using Unico.Mastercard.Api.Client;

namespace Unico.Mastercard.Api.Tests;

public sealed class MockProcessingCoreClientTests
{
    [Fact]
    public async Task GetAccountContractsAsync_EchoesOffsetAndLimit()
    {
        var client = new MockProcessingCoreClient();

        var result = await client.GetAccountContractsAsync("40000", offset: 5, limit: 10);

        Assert.Equal(5, result.Offset);
        Assert.Equal(10, result.Limit);
        Assert.NotEmpty(result.ClientAccountContracts);
    }

    [Fact]
    public async Task GetContractBalancesAsync_ReturnsOneEntryPerRequestedCode()
    {
        var client = new MockProcessingCoreClient();

        var result = await client.GetContractBalancesAsync("70001", ["AVAILABLE", "BLOCKED", "PENDING"]);

        Assert.Equal(3, result.ContractBalances.Count);
        Assert.Equal(["AVAILABLE", "BLOCKED", "PENDING"], result.ContractBalances.Select(b => b.BalanceCode));
    }
}
