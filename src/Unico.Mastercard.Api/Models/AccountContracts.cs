namespace Unico.Mastercard.Api.Models;

/// <summary>Response for GET /clients/{clientId}/account-contracts.</summary>
public sealed record AccountContractsResponse(
    int Count,
    int Limit,
    int Offset,
    int Total,
    IReadOnlyList<AccountContract> ClientAccountContracts);

public sealed record AccountContract(
    long AccountContractId,
    string? AccountContractName,
    string? AccountContractNumber,
    string? AccountContractLevel,
    long BillingAccountContractId,
    string? BillingAccountContractNumber,
    long TopAccountContractId,
    string? TopAccountContractNumber,
    string? Currency,
    string? ProductCode,
    string? ProductName,
    string? DateOpen,
    string? DateClose,
    AccountContractStatus? AccountContractStatusData,
    AccountContractBalances? AccountContractBalances,
    AccountContractOwner? AccountContractOwner);

public sealed record AccountContractStatus(
    string? StatusCode,
    string? StatusName,
    string? ExternalStatusCode,
    string? ExternalStatusName);

public sealed record AccountContractBalances(
    decimal? Available,
    decimal? Balance,
    decimal? BlockedAmount,
    decimal? CreditLimit,
    decimal? AdditionalLimit,
    decimal? PastDue,
    decimal? TotalDue);

public sealed record AccountContractOwner(
    long? AccountContractOwnerId,
    string? AccountContractOwnerNumber,
    string? AccountContractOwnerName);
