//############################################################################################
//##
//# Copyright (C) 2018 Nicola Peditto
//##
//# Licensed under the Apache License, Version 2.0 (the "License");
//# you may not use this file except in compliance with the License.
//# You may obtain a copy of the License at
//##
//# http://www.apache.org/licenses/LICENSE-2.0
//##
//# Unless required by applicable law or agreed to in writing, software
//# distributed under the License is distributed on an "AS IS" BASIS,
//# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//# See the License for the specific language governing permissions and
//# limitations under the License.
//##
//############################################################################################


var logger = log4js.getLogger('nodered_utils');
logger.setLevel(loglevel);

var fs = require('fs');

var db_utils = require('./../management/mng_db');
var db = new db_utils;
var board_utility = require('./../management/mng_board');

var session_wamp;

nodered_utils = function (session, rest) {

    session_wamp = session;

    // NODE-RED MANAGEMENTS APIs
    //---------------------------------------------------------------------------------------------------

    //Execute action on board
    /**
     * @swagger
     * /v1/boards/{board}/nodered:
     *   post:
     *     tags:
     *       - Node-Red
     *     description: Perform an action on Node-RED
     *     summary: perform action on Node-RED
     *     parameters:
     *      - in: path
     *        name: board
     *        required: true
     *        schema:
     *        type: string
     *        description: The IoTronic board ID
     *      - name: body
     *        in: body
     *        required: true
     *        schema:
     *              type: object
     *              required:
     *                  - action
     *              properties:
     *                  action:
     *                      type: string
     *                      description: "supported actions: hostname, reboot, restart_lr"
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         $ref: "#/definitions/IoTronicResponse"
     *       403:
     *         description: "Wrong, expired or not specified token in request header."
     *       500:
     *         description: "API specific error message."
     */
    rest.post('/v1/boards/:board/nodered', function (req, res) {

        var board = req.params.board;

        logger.info("[API] - Node-RED board action - " + Object.keys( req.route.methods ) + " - " + req.route.path + " - " + req.IotronicUser);

        board_utility.checkBoardAvailable(board, res, function (available) {

            if (available.result == "SUCCESS") {

                var action = req.body.action; // reboot | etc..
                var parameters = req.body.parameters; // OPTIONAL

                var ApiRequired = {"action":action};

                board_utility.checkRequired(ApiRequired, function (check) {

                    if (check.result == "ERROR") {

                        res.status(500).send(check);

                    } else {

                        execEngineAction(board, action, parameters, res);

                    }

                });


            }else if(available.result == "WARNING") {
                logger.error("[API] --> " + available.message);
                res.status(200).send(available);
            }


        });




    });



    logger.debug("[REST-EXPORT] - Node-RED's APIs exposed!");

    //---------------------------------------------------------------------------------------------------

    // Register RPC methods
    this.exportCommands(session_wamp)


};


var execEngineAction = function (board, action, parameters, res) {

    var response = {
        message: {},
        result: ""
    };

    switch (action) {

        case 'start':

            session_wamp.call('s4t.' + board + '.nodered.start').then(
                function (rpc_response) {

                    if (rpc_response.result == "ERROR") {

                        response.message = rpc_response.message;
                        response.result = "ERROR";
                        res.status(500).send(response);
                        logger.error("[SYSTEM] --> Action result on board '" + board + "': " + response.message);

                    } else {
                        response.message = rpc_response.message;
                        response.result = rpc_response.result;
                        res.status(200).send(response);
                        logger.info("[SYSTEM] --> Action result on board '" + board + "': " + response.message);

                    }

                }

            );

            break;

        case 'stop':

            session_wamp.call('s4t.' + board + '.nodered.stop').then(
                function (rpc_response) {

                    if (rpc_response.result == "ERROR") {

                        response.message = rpc_response.message;
                        response.result = "ERROR";
                        res.status(500).send(response);
                        logger.error("[SYSTEM] --> Action result on board '" + board + "': " + response.message);

                    } else {
                        response.message = rpc_response.message;
                        response.result = rpc_response.result;
                        res.status(200).send(response);
                        logger.info("[SYSTEM] --> Action result on board '" + board + "': " + response.message);

                    }

                }

            );

            break;

        default:

            var response = {
                message: "",
                result: ""
            };
            response.message = "Plugin operation '" + plugin_operation + "' not supported!";
            response.result = 'ERROR';
            logger.error("[PLUGIN] - " + response.message);
            res.status(500).send(response);

            break;

    }

};




nodered_utils.prototype.exportCommands = function (session){

    //Register all the module functions as WAMP RPCs

};



module.exports = nodered_utils;