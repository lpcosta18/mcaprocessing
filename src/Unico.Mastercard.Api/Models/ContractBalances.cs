namespace Unico.Mastercard.Api.Models;

/// <summary>Response for GET /contracts/{contractId}/balances.</summary>
public sealed record ContractBalancesResponse(IReadOnlyList<ContractBalance> ContractBalances);

public sealed record ContractBalance(
    string? BalanceCode,
    string? BalanceCurrency,
    long BalanceId,
    decimal BalanceValue);
