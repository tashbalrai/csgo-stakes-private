import config from './../../config/config.js';
import Mysql from 'mysql';
import Redis from 'redis';
import crypto from 'crypto';
import Chance from 'chance';
import moment from 'moment';
import winston from 'winston';

export default class Index {
    constructor(req, res) {
        this.request = req;
        this.response = res;
        this.log = new (winston.Logger)({
            transports: [
                new (winston.transports.File)({
                    filename: __dirname + './../../../../logs/coinflip_error.log',
                    maxsize: 1048576
                })
            ]
        });
    }

    create() {
        let rItems = this.request.body.inventory;
        if (!Array.isArray(rItems) || rItems.length <= 0) {
            this
            .response
            .json({
                "status": "error",
                "response": "Items must not be empty."
            });
            return;
        }

        let expiryMins = this.request.body.expiry_minutes;
        if (!isFinite(expiryMins)) {
            this
            .response
            .json({
                "status": "error",
                "response": "Coinflip expiry minutes should be set properly."
            });
            return;
        }

        let totalValue = this.request.body.totalValue;

        let 
            sTicket = 0,
            eTicket = (totalValue * 100) - 1;

        this
        .createHash()
        .then(game => {
            game.totalValue = Number(totalValue);
            this
            .insertGameRecord(game)
            .then(gRecord => {
                game.id = gRecord.insertId;
                game.state = config.coinflip.states.active;
        
                this
                .insertPlayerInventory(rItems, gRecord.insertId)
                .then(iRecord => {
                    game.owner = this.request.user;
                    delete game.owner.token;
                    delete game.owner.sessionId;
                    delete game.owner.role_id;
                    delete game.owner.is_banned;
                    delete game.owner.trade_url;

                    game.owner.items = rItems;
                    this
                    .insertGamePlayer(gRecord.insertId, game.totalValue, sTicket, eTicket)
                    .then(pRecord => {
                        game.owner.totalValue = game.totalValue;
                        game.owner.startTicket = sTicket;
                        game.owner.endTicket = eTicket;
                        game.expiresAt = moment().add(expiryMins, 'minutes').valueOf();

                        let redis = Redis.createClient(config.redis);
                        redis.on('ready', () => {
                            redis.hset(config.coinflip.cacheKey, `coinflip.${game.id}`, JSON.stringify(game), (err, result) => {
                                
                                if (err) {                                    
                                    redis.quit();
                                    console.log(err);
                                    this.log.error(`Coinflip: Cannot cache game (${game.id})`, err);
                                    this.revertGamePlayers(game.id);
                                    this.revertPlayerInventory(rItems, game.id);
                                    this.revertGameRecord(game.id);
                                    return;
                                }

                                // Let's delete the winage from the game before sending it to frontend.
                                delete game.winage;

                                redis.publish('notifier.message', JSON.stringify({
                                    "event": "broadcast",
                                    "subEvent": "game.created",
                                    "data": {game}
                                }), (err, result) => {
                                    redis.quit();

                                    if (err) {
                                        this.log.error(`Coinflip: Cannot send game (${game.id}) create notification.`, err);
                                        console.log(err);
                                    }
                                });

                                // Game successfully created.
                                this
                                .response
                                .json({
                                    "status": "ok",
                                    "response": {game}
                                });
                             });
                        });
                        return;
                    })
                    .catch(err => {
                        this.revertGamePlayers(gRecord.insertId);
                        this.revertPlayerInventory(rItems, gRecord.insertId);
                        this.revertGameRecord(gRecord.insertId);
                        this.log.error(`Coinflip: Error adding player to game (${gRecord.insertId})`, err);
                        console.log(err);
                        this
                        .response
                        .status(500)
                        .json({
                            "status": "error",
                            "response": "Unknown error occurred. Please try again later."
                        });
                        return;
                    });
                })
                .catch(err => {
                    this.revertPlayerInventory(rItems, gRecord.insertId);
                    this.revertGameRecord(gRecord.insertId);
                    console.log(err);
                    this.log.error(`Coinflip: Error adding player inventory to game (${gRecord.insertId})`, err);
                    this
                    .response
                    .status(500)
                    .json({
                        "status": "error",
                        "response": "Unknown error occurred. Please try again later."
                    });
                    return;
                });
            })
            .catch(err => {
                console.log(err);
                this.log.error(`Coinflip: Error adding game.`, err);
                this
                .response
                .status(500)
                .json({
                    "status": "error",
                    "response": "Unknown error occurred. Please try again later."
                });
                return;
            });
        })
        .catch(err => {
            console.log(err);
            this.log.error(`Coinflip: Error adding game.`, err);
            this
            .response
            .status(500)
            .json({
                "status": "error",
                "response": "Unknown error occurred. Please try again later."
            });
            return;
        });        
    }

    insertGameRecord(game) {
        return new Promise((resolve, reject) => {
            //Insert game record.
            let 
                db = Mysql.createConnection(config.mysql),
                SQL = 'INSERT INTO game(game_hash, game_secret, game_winage, game_value, state) VALUES(?, ?, ?, ?, ?)';
        
            db.query(SQL,
            [game.hash, game.secret, game.winage, game.totalValue, config.coinflip.states.active],
            (err, result) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    revertGameRecord(gid) {
        return new Promise((resolve, reject) => {
            if (!gid) {
                reject(new Error('Revert game require game ID.'));
                return;
            }

            //Insert game record.
            let 
                db = Mysql.createConnection(config.mysql),
                SQL = 'DELETE FROM game WHERE id = ? LIMIT 1';
        
            db.query(SQL,
            [gid],
            (err, result) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    insertGamePlayer(gid, totalValue, sTicket, eTicket) {
        return new Promise((resolve, reject) => {
            if (!gid) {
                reject(new Error('Game Id is required to insert player.'));
                return;
            }

            if (!isFinite(sTicket)) {
                reject(new Error('Starting ticket is required to insert player.'));
                return;
            }

            if (!isFinite(eTicket)) {
                reject(new Error('Ending ticket is required to insert player.'));
                return;
            }
            
            //Insert game player.
            let 
                db = Mysql.createConnection(config.mysql),
                SQL = 'INSERT INTO game_player(user_id, game_id, total_value, start_tickets, end_tickets) VALUES(?, ?, ?, ?, ?)';
        
            db.query(SQL,
            [this.request.user.id, gid, totalValue, sTicket, eTicket],
            (err, result) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    revertGamePlayers(gid) {
        return new Promise((resolve, reject) => {
            if (!gid) {
                reject(new Error('Game Id is required to revert player(s).'));
                return;
            }

            //Insert game player.
            let 
                db = Mysql.createConnection(config.mysql),
                SQL = 'DELETE FROM game_player WHERE game_id = ? AND user_id = ?';
        
            db.query(SQL,
            [gid, this.request.user.id],
            (err, result) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    insertPlayerInventory(items, gid) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(items)) {
                reject(new Error('Inventory items must be an array.'));
                return;
            }

            if (!gid) {
                reject(new Error('Game ID must be available before inserting player.'));
                return;
            }

            let 
                db = Mysql.createConnection(config.mysql),
                iRec = [],
                itemIds = [],
                SQL = 'INSERT INTO game_inventory(game_id, inventory_id, user_id) VALUES ?';
            
            for(let i=0; i<items.length; i++) {
                iRec.push([gid, items[i].id, this.request.user.id]);
                itemIds.push(items[i].id);
            }

            db.query(SQL, [iRec], (err, result) => {
                
                if (err) {
                    db.end();
                    reject(err);
                    return;
                }

                db.query('UPDATE inventory SET state = ? WHERE id IN ? AND user_id = ?',
                [config.coinflip.itemStates.inGame, [itemIds], this.request.user.id],
                (err, uResult) => {
                    db.end();

                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(uResult);
                });
            });            
        });
    }

    revertPlayerInventory(items, gid) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(items)) {
                reject(new Error('Inventory items must be an array.'));
                return;
            }

            if (!gid) {
                reject(new Error('Game ID must be available before inserting player.'));
                return;
            }

            let 
                db = Mysql.createConnection(config.mysql),
                iRec = [],
                itemIds = [],
                SQL = 'DELETE FROM game_inventory WHERE game_id = ? AND user_id = ?';
            
            for(let i=0; i<items.length; i++) {
                itemIds.push(items[i].id);
            }

            db.query(SQL, [gid, this.request.user.id], (err, result) => {
                
                if (err) {
                    db.end();
                    reject(err);
                    return;
                }

                db.query('UPDATE inventory SET state = ? WHERE id IN ? AND user_id = ?',
                [config.coinflip.itemStates.active, [itemIds], this.request.user.id],
                (err, uResult) => {
                    db.end();

                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(uResult);
                });
            });            
        });
    }

    updateGameState(gid, totalValue, state, prevState) {
        return new Promise((resolve, reject) => {
            if (!gid) {
                this
                .response
                .json({
                    "status": "error",
                    "response": "Game ID is require to update the game state."
                });
                return;
            }

            if (!state) {
                this
                .response
                .json({
                    "status": "error",
                    "response": "New game state is require to update the game state."
                });
                return;
            }

            if (!prevState) {
                prevState = config.coinflip.states.locked;
            }

            let db = Mysql.createConnection(config.mysql);
            db.query('UPDATE game SET state = ?, game_value = ? WHERE id = ? AND state = ? LIMIT 1', 
            [state, totalValue, gid, prevState],
            (err, result) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);
            });
        });
    }

    join() {
        if (!this.request.body.game) {
            this
            .response
            .status(400)
            .json({
                "status":"error",
                "response": "Game must be set in the request to join game."
            });
            return;
        }

        let
            game = this.request.body.game,
            sTicket = game.owner.endTicket + 1,
            eTicket = ((this.request.body.totalValue * 100) + sTicket) - 1,
            rItems = this.request.body.inventory;
        

        this
        .insertPlayerInventory(rItems, game.id)
        .then(iRecord => {
            game.joinee = this.request.user;
            delete game.joinee.token;
            delete game.joinee.sessionId;
            delete game.joinee.role_id;
            delete game.joinee.is_banned;
            delete game.joinee.trade_url;

            game.joinee.items = rItems;
            game.totalValue += Number(this.request.body.totalValue);
            game.joinee.totalValue = this.request.body.totalValue;
            game.joinee.startTicket = sTicket;
            game.joinee.endTicket = eTicket;

            game.state = config.coinflip.states.joined;
            
            let redis = Redis.createClient(config.redis);
            redis.on('ready', () => {
                let gameCopy = JSON.parse(JSON.stringify(game));
                delete gameCopy.winage;

                redis.publish('notifier.message', JSON.stringify({
                    "event": "broadcast",
                    "subEvent": "game.joined",
                    "data": {
                        "game": gameCopy
                    }
                }), (err, result) => {
                    redis.quit();

                    if (err) {
                        this.log.error(`Coinflip: Cannot send game (${game.id}) joined notification.`, err);
                        console.log(err);
                    }
                });
            });

            this
            .insertGamePlayer(game.id, game.joinee.totalValue, sTicket, eTicket)
            .then(pRecord => {
                this
                .calculateWinner(game)
                .then(game => {
                    game.state = config.coinflip.states.winnerCalculated;
                    game.winTime = moment().valueOf();

                    let redis = Redis.createClient(config.redis);
                    redis.on('ready', () => {
                        redis.hset(config.coinflip.cacheKey, `coinflip.${game.id}`, JSON.stringify(game), (err, result) => {
                            
                            if (err) {
                                redis.quit();
                                console.log(err);
                                this.log.error(`Coinflip-Join: Cannot update game ${game.id} cache.`, err);
                                this.updateGameState(game.id, game.totalValue, config.coinflip.states.active, config.coinflip.states.joined);
                                this.revertGamePlayers(game.id);
                                this.revertPlayerInventory(rItems, game.id);
                                
                                this
                                .response
                                .status(500)
                                .json({
                                    "status": "error",
                                    "response": "Unknown error occurred. Please try again later."
                                });
                                return;
                            }

                            redis.publish('notifier.message', JSON.stringify({
                                "event": "game.winner",
                                "data": {
                                    "userId": game.owner.id,
                                    game
                                }
                            }), (err, result) => {
                                redis.quit();

                                if (err) {
                                    this.log.error(`Coinflip: Cannot send game (${game.id}) winner notification.`, err);
                                    console.log(err);
                                }
                            });

                            this
                            .response
                            .json({
                                "status": "ok",
                                "response": {game}
                            });
                        });
                    });
                })
                .catch(err => {
                    console.log(err);
                    this.log.error(`Coinflip-Join: Cannot calculate winner for game ${game.id}.`, err);
                    this.updateGameState(game.id, config.coinflip.states.active, config.coinflip.states.joined);
                    this.revertGamePlayers(game.id);
                    this.revertPlayerInventory(rItems, game.id);

                    this
                    .response
                    .status(500)
                    .json({
                        "status": "error",
                        "response": "Unknown error occurred. Please try again later."
                    });
                    return;
                });
            })
            .catch(err => {
                this.revertGamePlayers(game.id);
                this.revertPlayerInventory(rItems, game.id);
                
                console.log(err);
                this.log.error(`Coinflip-Join: Cannot add player to game ${game.id}.`, err);
                
                this
                .response
                .status(500)
                .json({
                    "status": "error",
                    "response": "Unknown error occurred. Please try again later."
                });
                return;
            });
        })
        .catch(err => {
            this.revertPlayerInventory(rItems, game.id);
            console.log(err);
            this.log.error(`Coinflip-Join: Cannot add player inventory to game ${game.id}.`, err);
            this
            .response
            .status(500)
            .json({
                "status": "error",
                "response": "Unknown error occurred. Please try again later."
            });
            return;
        });
        
    }

    createHash() {
        return new Promise((resolve, reject) => {
            let secret, winage, hash;
            let chance = new Chance();
            secret = chance.hash({length: 15});
            let sha256 = crypto.createHash('sha256');
            winage = chance.floating({min:0, max:100, fixed:2});
            sha256.update(`${secret}##CSGO${winage}STAKES##${winage}`);
            hash = sha256.digest('hex');
            resolve({secret, winage, hash});
        });
    }

    calculateWinner(game) {
        return new Promise((resolve, reject) => {
            if (!game) {
                reject(new Error('Game is required to calculate winner.'));
                return;
            }

            if (!game.winage || !isFinite(game.winage)) {
                reject(new Error('Game winage is required to calculate winner.'));
                return;
            }

            let winTicket = Math.floor(((game.totalValue * 100) * game.winage) / 100);
            // console.log(`WinTicket: ${winTicket}, Total Value: ${game.totalValue}, Winage: ${game.winage}`);

            game.winTicket = winTicket;
            if (winTicket <= game.owner.endTicket) {
                game.winner = game.owner.id;
            } else {
                game.winner = game.joinee.id;
            }

            let db = Mysql.createConnection(config.mysql);
            db.query('UPDATE game SET game_winner = ?, game_value = ?, state = ? WHERE id = ? AND game_hash = ? LIMIT 1',
            [game.winner, game.totalValue, config.coinflip.states.winnerCalculated, game.id, game.hash],
            (err, result) => {
                db.end();

                if (err) {
                    reject(err);
                    return;
                }

                resolve(game);
            });
        });
    }

    list() {
        let redis = Redis.createClient(config.redis);
        redis.on('ready', () => {
            redis.hgetall(config.coinflip.cacheKey, (err, games) => {
                redis.quit();

                games && Object.keys(games).forEach(key => {
                    let game = JSON.parse(games[key]);
                    delete game.winage;
                    delete game.secret;
                    games[key] = JSON.stringify(game);
                });
                
                if (err) {
                    console.log(err);
                    this.log.error(`Coinflip-List: Cannot get games list from cache.`, err);
                    this
                    .response
                    .status(500)
                    .json({
                        "status": "error",
                        "response": "Unknown error occurred. Please try again later."
                    });
                }

                this
                .response
                .json({
                    "status": "ok",
                    "response": {games}
                });
            });
        });
    } 
}