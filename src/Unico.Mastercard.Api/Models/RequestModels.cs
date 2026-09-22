namespace Unico.Mastercard.Api.Models;

// Typed request-body models extracted from the Mastercard Processing Core OpenAPI spec (oas_core.yaml)
// so that Swagger UI renders real, fillable schemas instead of opaque JSON bodies.

// --- Client ---

/// <summary>Request body for POST /clients.</summary>
public sealed record ClientCreationRequest(
    string ClientNumber,
    string ClientType,
    string? OrderDepartment,
    string? ServiceGroupCode,
    IReadOnlyList<CustomDataTag>? ClientCustomData,
    string? AdditionalDate01,
    string? AdditionalDate02,
    string? ClientExpiryDate,
    ClientBaseAddressData? ClientBaseAddressData,
    ClientCompanyData? ClientCompanyData,
    ClientContactData? ClientContactData,
    ClientIdentificationData? ClientIdentificationData,
    ClientPersonalData? ClientPersonalData,
    EmbossedData? EmbossedData);

/// <summary>Request body for PATCH /clients/{client_id}.</summary>
public sealed record ClientModificationRequest(
    IReadOnlyList<CustomDataTag>? ClientCustomData,
    string? AdditionalDate01,
    string? AdditionalDate02,
    string? ClientExpiryDate,
    ClientBaseAddressData? ClientBaseAddressData,
    ClientCompanyData? ClientCompanyData,
    ClientContactData? ClientContactData,
    ClientIdentificationData? ClientIdentificationData,
    ClientPersonalData? ClientPersonalData,
    EmbossedData? EmbossedData);

public sealed record ClientBaseAddressData(
    string? AddressLine1,
    string? AddressLine2,
    string? AddressLine3,
    string? AddressLine4,
    string? City,
    string? Country,
    string? PostalCode,
    string? State);

public sealed record ClientCompanyData(
    string? CompanyDepartment,
    string? CompanyName,
    string? CompanyTradeName,
    string? Position);

public sealed record ClientContactData(
    string? Email,
    string? Fax,
    string? FaxHome,
    string? PhoneNumberHome,
    string? PhoneNumberMobile,
    string? PhoneNumberWork);

/// <summary>Client identification data (document type/number, social/taxpayer identifiers).</summary>
public sealed record ClientIdentificationData(
    string? IdentificationDocumentNumber,
    string? IdentificationDocumentType,
    string? SocialNumber,
    string? TaxpayerIdentifier);

/// <summary>Client personal data (name, birth date, gender, etc.).</summary>
public sealed record ClientPersonalData(
    string? FirstName,
    string? LastName,
    string? MiddleName,
    string? DateOfBirth,
    string? Gender,
    string? Nationality);

public sealed record EmbossedData(
    string? CompanyName,
    string? FirstName,
    string? LastName,
    string? Title);

public sealed record CustomDataTag(
    bool? RemoveTag,
    string TagContainer,
    string TagName,
    string? TagValue);

/// <summary>Request body for POST /clients/{client_id}/custom-data and POST /contracts/{contract_id}/custom-data.</summary>
public sealed record CustomDataTagsRequest(IReadOnlyList<CustomDataTag> CustomDataTags);

/// <summary>Request body for PUT /accounts/{account_contract_id}/client-identifier and PUT /cards/{card_contract_id}/client-identifier.</summary>
public sealed record ClientIdentifierWithRelinkTypeRequest(long ClientId, string? RelinkType);

/// <summary>Request body for PUT /contracts/{contract_id}/main-contract.</summary>
public sealed record AccountContractIdentifierWithClientIdentifierRequest(long AccountContractId, long? ClientId);

/// <summary>Simple account contract identifier wrapper.</summary>
public sealed record AccountContractIdentifierRequest(long AccountContractId);

// --- Contract / Event ---

/// <summary>Request body for POST /contracts/{contract_id}/events.</summary>
public sealed record EventRequest(
    string EventCode,
    decimal? Amount,
    string? Currency,
    string? ParameterString,
    string? Reason,
    string? StartDate,
    string? EndDate);

/// <summary>Request body for PUT /contracts/{contract_id}/authentication-method.</summary>
public sealed record AuthenticationMethodRequest(
    string AuthenticationTypeCode,
    string? AuthenticationTypeName,
    IReadOnlyList<AuthenticationParameter>? AuthenticationParameters);

public sealed record AuthenticationParameter(string Name, string? Value);

// --- Account contract ---

/// <summary>Request body for POST /accounts.</summary>
public sealed record AccountContractCreationRequest(
    AccountContractData AccountContractData,
    IReadOnlyList<AccountContractClassifierRequest>? AccountContractClassifiers,
    IReadOnlyList<AccountContractParameterRequest>? AccountContractParameters,
    CreditData? CreditData,
    LiabilityContract? LiabilityContract);

public sealed record AccountContractData(
    string AccountContractNumber,
    string ProductCode,
    string? AccountContractName,
    string? AccountContractSubtypeCode,
    string? BranchCode,
    string? CbsNumber,
    long? ClientId,
    string? Currency,
    string? ParentAccountContractId,
    string? ServiceGroupCode,
    IReadOnlyList<CustomDataTag>? CustomData);

public sealed record AccountContractClassifierRequest(string ClassifierCode, string ClassifierValue);

public sealed record AccountContractParameterRequest(string ParameterCode, string? ParameterValue);

public sealed record CreditData(
    string? BillingDay,
    decimal? CreditLimitAmount);

public sealed record LiabilityContract(string LiabilityContractId, string LiabilityCategory);

/// <summary>Request body for PATCH /accounts/{account_contract_id}.</summary>
public sealed record AccountContractModificationRequest(
    string? AccountContractName,
    string? CbsNumber,
    IReadOnlyList<CustomDataTag>? CustomData);

/// <summary>Request body for PUT /accounts/{account_contract_id}/status.</summary>
public sealed record AccountContractStatusWithReasonRequest(string StatusCode, string? Reason);

// --- Card contract ---

/// <summary>Request body for POST /cards.</summary>
public sealed record CardContractCreationRequest(
    long AccountContractId,
    CardContractData CardContract,
    long? ClientId,
    IReadOnlyList<CustomDataTag>? CardContractCustomData);

public sealed record CardContractData(
    string ProductCode,
    string? BranchCode,
    string? CardContractNumber,
    string? CardContractName,
    string? CardSubtypeCode,
    string? CbsNumber,
    string? Currency,
    string? CardExpiryDate,
    string? ProductionCode,
    EmbossedData? EmbossedData);

/// <summary>Request body for PATCH /cards/{card_contract_id}.</summary>
public sealed record CardContractModificationRequest(
    string? CardContractName,
    string? CbsNumber,
    IReadOnlyList<CustomDataTag>? CardContractCustomData,
    EmbossedData? EmbossedData);

/// <summary>Request body for PUT /cards/{card_contract_id}/status.</summary>
public sealed record CardContractStatusWithReasonRequest(string StatusCode, string? Reason);

/// <summary>Request body for POST /cards/{card_contract_id}/plastics (reissue).</summary>
public sealed record CardContractReissueRequest(
    string ReissueType,
    string? NewCardContractNumber,
    string? NewCardExpiryDate,
    string? NewCbsNumber);

/// <summary>Request body for POST /cards/details-verifications.</summary>
public sealed record CardContractDetailsVerificationRequest(
    string CardContractNumber,
    string? CardExpiryDate,
    string? CardVerificationCode);

/// <summary>Request body for POST /cards/{card_contract_id}/card-verification-codes/verifications.</summary>
public sealed record CvcVerificationRequest(string CardExpiryDate, string CardVerificationCode);

/// <summary>Request body for POST /cards/{card_contract_id}/card-verification-codes/searches.</summary>
public sealed record CvcSearchCriteriaRequest(string CardExpiryDate);

/// <summary>Request body for POST /cards/{card_contract_id}/pins/verifications.</summary>
public sealed record PinVerificationRequest(string CardExpiryDate, string? CardSequenceNumber, string PinBlock);

/// <summary>Request body for PUT /cards/{card_contract_id}/pin.</summary>
public sealed record PinCreationRequest(string CardExpiryDate, string? CardSequenceNumber, string NewPinBlock);

/// <summary>Request body for POST /cards/{card_contract_id}/pins/searches.</summary>
public sealed record PinSearchCriteriaRequest(string CardExpiryDate, string? CardSequenceNumber);

/// <summary>Request body for PUT /cards/{card_contract_id}/active.</summary>
public sealed record CardContractActivationRequest(bool Activated);

/// <summary>Request body for PUT /clients/{client_id}/online-pin-attempts-counter and card-level equivalent.</summary>
public sealed record OnlinePinAttemptsClearanceRequest(bool Cleared);

/// <summary>Request body for PUT /clients/{client_id}/online-pin-attempts-counter (client scope).</summary>
public sealed record OnlinePinAttemptsClearanceForClientRequest(bool Cleared);

// --- Address ---

/// <summary>Request body for POST /clients/{client_id}/addresses and POST /contracts/{contract_id}/addresses.</summary>
public sealed record AddressCreationRequest(
    string AddressType,
    string? AddressLine1,
    string? AddressLine2,
    string? AddressLine3,
    string? AddressLine4,
    string? City,
    string? Country,
    string? PostalCode,
    string? State);

/// <summary>Request body for PUT /clients/{client_id}/addresses/{address_type} and contract equivalent.</summary>
public sealed record AddressModificationRequest(
    bool? Enabled,
    string? AddressLine1,
    string? AddressLine2,
    string? AddressLine3,
    string? AddressLine4,
    string? City,
    string? Country,
    string? PostalCode,
    string? State);

// --- Classifier ---

/// <summary>Request body for PUT /clients/{client_id}/classifiers/{classifier_code} and contract equivalent.</summary>
public sealed record ClassifierCreationRequest(string ClassifierValue, string? StartDate, string? EndDate);

// --- Parameter ---

/// <summary>Request body for PUT /contracts/{contract_id}/parameters/{parameter_code}.</summary>
public sealed record ParameterModificationRequest(string ParameterValue);

// --- Transaction ---

/// <summary>Request body for POST /contracts/{contract_id}/debits.</summary>
public sealed record TransactionContractDebitRequest(
    string TransactionTypeCode,
    decimal Amount,
    string Currency,
    string Description,
    string? FeeCode,
    string? PostingDate,
    string? TransactionTypeExtension,
    string? UniqueReferenceNumber,
    IReadOnlyList<TransactionCustomData>? CustomData);

/// <summary>Request body for POST /contracts/{contract_id}/credits.</summary>
public sealed record TransactionContractCreditRequest(
    string TransactionTypeCode,
    decimal Amount,
    string Currency,
    string Description,
    string? FeeCode,
    string? PostingDate,
    string? TransactionTypeExtension,
    string? UniqueReferenceNumber,
    IReadOnlyList<TransactionCustomData>? CustomData);

public sealed record TransactionCustomData(string TagName, string TagValue);

/// <summary>Request body for POST /contracts/{contract_id}/charge-fees.</summary>
public sealed record ChargeFeeRequest(
    string FeeTypeId,
    string UniqueReferenceNumber,
    decimal? Amount,
    string? Currency,
    string? PostingDate);

/// <summary>Request body for PUT /contracts/{contract_id}/transactions/{transaction_id}/releasing-blocked-funds.</summary>
public sealed record BlockedFundsReleaseRequest(string? Reason);

/// <summary>Request body for POST /transactions/{transaction_id}/reversals.</summary>
public sealed record ReverseTransactionReasonRequest(string? Reason);

// --- Usage limit ---

/// <summary>Request body for PUT /contracts/{contract_id}/usage-limits/{usage_limit_code}.</summary>
public sealed record UsageLimitModificationRequest(
    string? ActivityPeriodStartDate,
    string? ActivityPeriodEndDate,
    string? AddInfo,
    string? Currency,
    decimal? MaxAmount,
    long? MaxNumber,
    decimal? MaxPercent,
    decimal? MaxSingleAmount);

/// <summary>Request body for PUT /contracts/{contract_id}/usage-limits/{usage_limit_code}/original-values.</summary>
public sealed record UsageLimitOriginalValueRequest(bool Restore);

/// <summary>Request body for PUT /contracts/{contract_id}/usage-limits/{usage_limit_code}/resetting-counters.</summary>
public sealed record UsageLimitResettingRequest(bool Reset);

/// <summary>Request body for PUT /contracts/{contract_id}/usage-limits/{usage_limit_code}/status.</summary>
public sealed record UsageLimitStatusRequest(string Status);

// --- Tariff ---

/// <summary>Request body for POST /contracts/{contract_id}/service-limit-tariffs.</summary>
public sealed record ServiceLimitTariffRequest(
    string TariffCode,
    string? Currency,
    string? StartDate,
    string? EndDate,
    decimal? FloorLimit,
    decimal? MinTransactionAmount,
    decimal? MaxTransactionAmount);

// --- Search ---

/// <summary>Request body for POST /clients/searches.</summary>
public sealed record ClientIdentifierSearchRequest(string ClientIdentifier, string ClientIdentifierType);

/// <summary>Request body for POST /accounts/searches.</summary>
public sealed record AccountContractIdentifierSearchRequest(string AccountContractIdentifier, string AccountContractIdentifierType);

/// <summary>Request body for POST /cards/searches.</summary>
public sealed record CardContractIdentifierSearchRequest(string CardContractIdentifier, string CardContractIdentifierType);
