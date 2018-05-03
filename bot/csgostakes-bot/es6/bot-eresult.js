'use strict';

export default {
    "OwnInvLoadFailed": 5000,
    "JSONParseErrorDepItem": 5001,
    "NoDepItems": 5002,
    "NoTradeUrl": 5003,
    "InvalidTradeUrl": 5004,
    "NoEscrowDays": 5005,
    "EscrowDaysHeld": 5006,
    "UnknownTradeError": 5007,
    "TradeSuccessDBError": 5008,
    "TradeOfferCanceled": 5009,
    "GlitchedOffer": 5010,
    "NoTradeID": 5011,
    "ParseErrorWithdrawItems": 5012,
    "NoWithdrawItems": 5013,
    "RetryFailed": 5014,
    "SteamIDMismatch": 5015,
    "ConfirmationError": 5016,

    //Messages
    "5000": "Failed to load bot's own inventory.",
    "5001": "Failed to parse the deposit items JSON data.",
    "5002": "No deposit items found.",
    "5003": "No trade Url set.",
    "5004": "Invalid trade Url",
    "5005": "Unable to get user's escrow days",
    "5006": "Trade will be held due to escrow days",
    "5007": "Unknown trade error occurred.",
    "5008": "Trade success but error at DB.",
    "5009": "Trade offer was either expired, canceled or declined. Check offer response.",
    "5010": "Trade offer was glitched.",
    "5011": "Trade offer have no trade ID.",
    "5012": "Unable to parse the withdrawal items.",
    "5013": "No withdraw items found.",
    "5014": "All retry attempts failed.",
    "5015": "Steam ID mismatch.",
    "5016": "Confirmation error"
};


