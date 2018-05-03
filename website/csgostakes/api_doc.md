# Browser URLs

## /slbp/login [Method: GET]
Redirects the user to steam for login.

## /user/logout [Method: GET]
Logout the user in browser and API from browser.

# API URLs
**Requirements**
```json
x-access-token: <access token>
x-user-sid: <registered user id not steam id>
Content-Type: application/json
```

## user/logout [Method: POST]
Logout the user from browser and API from API.

## /user/auth [Method: POST]
Get the user details.

## /user/steam/inventory [Method: GET]
Get the logged in user's steam inventory.
Items < 0.10 and items with safe_price=0 are ignored.

## /user/inventory/onsite [Method: GET]
Get the logged in user's onsite inventory.

## /user/tradeurl [Method: GET]
Get the user trade url.

## /user/tradeurl/save [Method: POST]
Update the user trade url.

**Input parameters:**
```json
{
	"trade_url":"https://steamcommunity.com/tradeoffer/new/?partner=xxxx&token=xxxxx"
}
```

**Output parameters:**
```json
{
    "status": "ok",
    "response": "Trade URL saved."
}
```

## /user/inventory/desposit [Method: POST]
Queue the user steam inventory to be deposited onsite inventory of the csgostakes.

** Input parameters: **
```json
{
    "inventory": [{
            "appid": 730,
            "contextid": "2",
            "assetid": "11725631053",
            "classid": "937252353",
            "market_hash_name": "AWP | Worm God (Factory New)",
            "rarity_color": "4b69ff",
            "rarity_tag_name": "Mil-Spec Grade",
            "icon_url": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopuP1FAR17OORIQJP7c-ikZKSqPv9NLPF2G0EsMN33rGY9tWnjlK18xBqNm2gIISdcwJsMAzQ-wK9xOy705bt7pvXiSw0wcJJWjY"
        }, {
            "appid": 730,
            "contextid": "2",
            "assetid": "11725631053",
            "classid": "937252353",
            "market_hash_name": "AWP | Worm God (Factory New)",
            "rarity_color": "4b69ff",
            "rarity_tag_name": "Mil-Spec Grade",
            "icon_url": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopuP1FAR17OORIQJP7c-ikZKSqPv9NLPF2G0EsMN33rGY9tWnjlK18xBqNm2gIISdcwJsMAzQ-wK9xOy705bt7pvXiSw0wcJJWjY"
        }]
}
```

## /user/inventory/deposit/pending [Method: GET]
Get pending deposits. pending deposits could be queued, offer sent, offer accepted and error states. Settled offers will be available from history API.

```
State, Meaning
0, Error
1, Queued
2, Offer sent
3, Offer Accepted
```

## /user/inventory/withdraw [Method: POST]
Queue the user onsite inventory to be withdrawn to user's steam inventory.

** Input parameters: **
```json
{
    "items": [5,6,7]
}
```
** Result: **
```json
{
    "response": {
        "successItems": {
            "withdrawId": 3,
            "itemIds": [7,8]
        },
        "errorItems": {
            "itemsIds": [5,6]
        },
        "error": "Cannot process some of the items"
    },
    "status": "error"

}
```

## /user/history/deposit [Method: GET]
Get the user deposit history.

** Result: **
```json
{
    "status": "ok",
    "response": [
        {
            "id": 17,
            "user_id": 5,
            "bot_id": 5,
            "items": "[{\"appid\":730,\"contextid\":\"2\",\"assetid\":\"11725631053\",\"classid\":\"937252353\",\"market_hash_name\":\"AWP | Worm God (Factory New)\",\"price\":{\"name\":\"AWP | Worm God (Factory New)\",\"safe_price\":\"1.69\",\"safe_net_price\":\"1.48\",\"ongoing_price_manipulation\":false,\"total_volume\":749238,\"7_days\":{\"median_price\":\"1.69\",\"median_net_price\":\"1.48\",\"average_price\":\"1.68\",\"average_net_price\":\"1.47\",\"lowest_price\":\"0.41\",\"lowest_net_price\":\"0.37\",\"highest_price\":\"7.08\",\"highest_net_price\":\"6.17\",\"mean_absolute_deviation\":\"0.08\",\"deviation_percentage\":0.04534199840634036,\"trend\":0.02982494056624196,\"volume\":5792},\"30_days\":{\"median_price\":\"1.58\",\"median_net_price\":\"1.39\",\"average_price\":\"1.58\",\"average_net_price\":\"1.39\",\"lowest_price\":\"0.09\",\"lowest_net_price\":\"0.07\",\"highest_price\":\"30.54\",\"highest_net_price\":\"26.57\",\"mean_absolute_deviation\":\"0.11\",\"deviation_percentage\":0.07234836701561465,\"trend\":0.20244957851078677,\"volume\":20941},\"all_time\":{\"median_price\":\"1.38\",\"median_net_price\":\"1.20\",\"average_price\":\"1.39\",\"average_net_price\":\"1.21\",\"lowest_price\":\"0.03\",\"lowest_net_price\":\"0.01\",\"highest_price\":\"237.78\",\"highest_net_price\":\"206.78\",\"mean_absolute_deviation\":\"0.16\",\"deviation_percentage\":0.1150612920766517,\"trend\":0.046206145619166875,\"volume\":749238},\"first_seen\":1444206381}}]",
            "offer_id": "2463598029",
            "offer_state": 7,
            "offer_response": "Declined",
            "received_items": null,
            "state": 5009,
            "created_at": "2017-09-04T06:55:02.000Z",
            "updated_at": null
        }
    ]
}
```

** OFFER STATES **
```json
{
	"Invalid": 1,
	"Active": 2,            // This trade offer has been sent, neither party has acted on it yet.
	"Accepted": 3,          // The trade offer was accepted by the recipient and items were exchanged.
	"Countered": 4,         // The recipient made a counter offer
	"Expired": 5,           // The trade offer was not accepted before the expiration date
	"Canceled": 6,          // The sender cancelled the offer
	"Declined": 7,          // The recipient declined the offer
	"InvalidItems": 8,      // Some of the items in the offer are no longer available (indicated by the missing flag in the output)
	"CreatedNeedsConfirmation": 9, // The offer hasn't been sent yet and is awaiting further confirmation
	"CanceledBySecondFactor": 10, // Either party canceled the offer via email/mobile confirmation
	"InEscrow": 11,          // The trade has been placed on hold

	"1": "Invalid",
	"2": "Active",
	"3": "Accepted",
	"4": "Countered",
	"5": "Expired",
	"6": "Canceled",
	"7": "Declined",
	"8": "InvalidItems",
	"9": "CreatedNeedsConfirmation",
	"10": "CanceledBySecondFactor",
	"11": "InEscrow",
};
```

** STATE **
```json
{
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
    "5013": "No withdraw items found."
}
```

** TRADE LINK **

```https://steamcommunity.com/tradeoffer/<offer_id>/```

## /user/history/withdraw [Method: GET]
Get the user withdraw history.

** Result: **
```json
{
    "status": "ok",
    "response": [
        {
            "id": 1,
            "user_id": 5,
            "parent_id": null,
            "offer_id": "2454710158",
            "offer_state": 7,
            "offer_response": "Declined",
            "state": 5009,
            "created_at": "2017-09-01T08:25:26.000Z",
            "updated_at": null,
            "items": "{\"id\": 5, \"image\": \"-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAZx7PLfYQJW-9W4kb-HnvD8J_XXzzwH65EgiLHHrNutjAa28xdtYG7wINCUdlA4ZFDW81m8lebqjMC9ot2XnlThvpXE/\", \"mhash\": \"AWP | Worm God (Factory New)\", \"asset_id\": \"11593225757\"},{\"id\": 6, \"image\": \"-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopujwezhh3szdYz9D4uO6nYeDg7mmNe3UkD8GsMEo3erDp9St31K3_0JsZTqlLI-SdA5oZwuDqQW2lLrpm9bi6_KhRAkC/\", \"mhash\": \"P250 | Metallic DDPAT (Factory New)\", \"asset_id\": \"11594295962\"}"
        }
    ]
}
```

## /coinflip/create [Method: POST]
To create new coinflip game.

**Input Params:**
```json
{
    "items": [3,5,6], //onsite inventory ids not asset ids
    "expiry_minutes": 5
}
```

## /coinflip/join [Method: POST]
To join coinflip game.

**Input Params:**
```json
{
    "items": [3,5,6], //onsite inventory ids not asset ids
    "game_id": 5
}
```

## /coinflip/games [Method: GET]
Gives coinflip games listing.

## /gaway/active [Method: GET]
Get the currently active giveaway.

**Output Params:**
```json
    {
    "status": "ok",
    "response": {
        "name": "AWP | Worm God (Factory New)",
        "safe_price": "1.74",
        "safe_net_price": "1.52",
        "ongoing_price_manipulation": false,
        "total_volume": 776616,
        "7_days": {
            "median_price": "1.74",
            "median_net_price": "1.52",
            "average_price": "1.73",
            "average_net_price": "1.51",
            "lowest_price": "0.03",
            "lowest_net_price": "0.01",
            "highest_price": "31.05",
            "highest_net_price": "27.00",
            "mean_absolute_deviation": "0.10",
            "deviation_percentage": 0.0551415153306427,
            "trend": 0.05894916702264043,
            "volume": 4739
        },
        "30_days": {
            "median_price": "1.69",
            "median_net_price": "1.48",
            "average_price": "1.68",
            "average_net_price": "1.47",
            "lowest_price": "0.03",
            "lowest_net_price": "0.01",
            "highest_price": "31.05",
            "highest_net_price": "27.00",
            "mean_absolute_deviation": "0.09",
            "deviation_percentage": 0.0529977129294807,
            "trend": 0.08186112297182004,
            "volume": 20069
        },
        "all_time": {
            "median_price": "1.39",
            "median_net_price": "1.21",
            "average_price": "1.40",
            "average_net_price": "1.22",
            "lowest_price": "0.03",
            "lowest_net_price": "0.01",
            "highest_price": "237.78",
            "highest_net_price": "206.78",
            "mean_absolute_deviation": "0.16",
            "deviation_percentage": 0.11782696674417006,
            "trend": 0.10616885196275312,
            "volume": 776616
        },
        "first_seen": 1444206381,
        "created_at": "2017-10-20T11:11:31.000Z",
        "expires_at": "2017-10-20T11:13:31.000Z"
    }
}
```
## /coinflip/history [Method: GET]
Get the last 50 games played.

# Events
Bot and coinflip game notification events

```js
var sock = io('/bn', {
    transportOptions: {
        polling: {
            extraHeaders: {
                'x-access-token': '<user token>',
                'x-user-sid': '<user id>'
            }
        }
    }
});

sock.on('<event>', (data) => {
    //statement
});
```

## offer.glitched
This event will be fired by bot when the deposit/withdraw offer would be glitched.

**Event Data:**
```json
{
    "event": "offer.glitched",
    "to": "notifier",
    "data": {
        "botId": <bot id>,
        "userId": <user id>,
        "offerId": <offer id>,
        "offerType": <offer type>, //type of offer deposit or withdraw
        "depositId": <deposit id>, //set if deposit offer
        "withdrawId": <withdraw id>, //set if withdraw offer
        "securityToken": <security token sent in offer>
    }
}
```

## offer.bad
If trade ID was not set in offer created. Something bad happened at steam side.

**Event Data:**
```json
{
    "event": "offer.bad",
    "to": "notifier",
    "data": {
        "botId": <bot id>,
        "userId": <user id>,
        "offerId": <offer id>,
        "offerType": <offer type>, //type of offer deposit or withdraw
        "depositId": <deposit id>, //set if deposit offer
        "withdrawId": <withdraw id>, //set if withdraw offer
        "securityToken": <security token sent in offer>
    }
}
```

## poll.failed
Offers polling failed. mostly its because of steam down of misbehaving so show message to client about steam bad.

**Event Data:**
```json
{
    "event": "poll.failed",
    "to": "notifier",
    "data": {
        "botId": <bot id>
    }            
}
```

## deposit.accepted
If sent deposit offer was accepted by user.

## deposit.items.assigned
If sent deposit offer was accepted by user and we have assigned the received items to user.

## deposit.error
Some error condition while handling the deposit offer of the user.

## deposit.sent
Offer sent to user.

## deposit.sent.canceled
The deposit offer we sent was canceled or declined due to some reason. Check data for more details.

## deposit.canceled
The deposit offer we sent was canceled or declined.

**Event Data**
```json
{
    "event": "<any of the above event>",
    "data": {
            offerId,
            offerType,
            withdrawId,
            depositId,
            userId,
            securityToken,
            error, //in case of error condition.
            errno //in case of steam error condition.
        }
}
```

## withdraw.accepted
Withdraw offer we sent was accepted by the user.

## withdraw.error
Witherdaw offer in error.

## withdraw.sent
Withdraw offer was sent by us.

## withdraw.sent.canceled
Withdraw offer we sent was canceled or declined.

## withdraw.canceled
Withdraw offer was canceled or declined.

**Event Data**
See event data for deposit events.

## game.created
A new game has been created. You will get the game data.

## game.joined
Someone has joined the game. You will get game data.

## game.winner.calc.error
Error during calculation of the game.

## game.winner
Winner calculated. Show the animation for winning and then show the winner details after its done.

## giveaway.created
Event notification fires when a new giveaway is created.

## game.finalized
Event notification fires when a game is settled with all game data.