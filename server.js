var html = require('fs').readFileSync(__dirname+'/static/html/index.html');
var path = require('path');
var http = require('http');
var fs = require('fs');

var express = require('express');
var app = express.createServer();

// routing
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/static/html/index.html');
});

app.use("/static", express.static(__dirname + '/static'));
app.listen(8080);

var nowjs = require("now");
var everyone = nowjs.initialize(app);

var map_height = 20;
var map_width = 20;

var players = {};

var kill_creep_gold = 4;
var starting_gold = 100;
var starting_lives = 5;
var tower_id = 0;
var creep_id = 0;
everyone.now.level = 1;

var game_start = false;

var the_path = [[0,2],[2,2],[2,8],[6,8],[6,2],[9,2]];

nowjs.on('connect', function() {
  if (!(this.user.clientId in players)) {
      players[this.user.clientId] = new User();
  }
});

nowjs.on('disconnect', function() {
  for(var i in players) {
    if(i == this.user.clientId) {
      delete players[i];
      break;
    }
  }
});

function User() {
  this.goldCount = starting_gold;
  this.lives     = starting_lives;
  this.towers = [];
  this.creeps = [];
  this.enemies = [];
  this.fb_id = "";
  this.profile_pic = "";
  this.name = "";
}

function Creep(id, image) {
  this.id = id;
  this.x = 0;
  this.y = 2;
  this.speed = 1 + everyone.now.level/4;
  this.path = the_path;
  this.pathIndex = 0;
  this.health = 3 + 4*everyone.now.level;
  this.xVel = 1;
  this.yVel = 0;
  this.image = image;
}

function Tower(type) {
  this.type = type;
  this.x;
  this.y;
  this.timeSinceShot;
  this.range;
  this.damage;
  this.level;
}

// Synchronous updates
function inRange(creep, tower){
    if( Math.sqrt( Math.pow((creep.x - tower.x),2) + Math.pow((creep.y - tower.y),2) ) < tower.range ){
        return true;
    }
    return false;
}

function updateTower(userid, tower, creeps, delta) {
   tower.timeSinceShot = tower.timeSinceShot + delta;
   if (tower.timeSinceShot > 500){
      for(var i in creeps){
          if( inRange(creeps[i], tower) ){
              // tell them to fire a tower
              nowjs.getClient(userid, function(){
                  this.now.client_tower_fire(tower.x, tower.y, creeps[i].id)
              });
              tower.timeSinceShot = 0;
              creeps[i].health -= tower.damage;
              if(creeps[i].health <=0){
                  var id = creeps[i].id;
                  delete creeps[i];
                  players[userid].goldCount = players[userid].goldCount+5;
                  nowjs.getClient(userid, function(){
                      this.now.client_destroy_creep(id);
                      this.now.update_gold_count(players[userid].goldCount);
                  });
              }
              break;
          }
      }
   }
}

function dist(x1,x2,y1,y2) {
    return Math.sqrt(Math.pow(x1-y1,2) + Math.pow(x2-y2,2));
}

function updateCreep(userid, user, creep, delta) {
   if (creep.pathIndex != creep.path.length - 1) {
      var nextPoint = creep.path[creep.pathIndex + 1];
      creep.x = creep.x + (delta/1000) * creep.speed * creep.xVel;
      creep.y = creep.y + (delta/1000) * creep.speed * creep.yVel;
      var nextX = nextPoint[0];
      var nextY = nextPoint[1];
      if (dist(creep.x,creep.y,nextX,nextY) <= (delta/1000) * creep.speed) {
         // we are close enough to the next point, update
         creep.pathIndex = creep.pathIndex + 1;
         if (creep.pathIndex == creep.path.length - 1) {
             // we have reached the end
             for (var i in user.creeps) {
                 if (user.creeps[i].id == creep.id) {
                    delete user.creeps[i];
                    break;
                 }
             }
             user.lives = user.lives - 1;

             if(user.lives == 0)
             {
                 //delete players[this.user.clientId];
                 //return;
             }

             // tell them a creep reached the end
             nowjs.getClient(userid, function(){
               this.now.client_creep_reached_end(creep.id);
             });
         } else {
             // need to update xVel and yVel
             nextPoint = creep.path[creep.pathIndex + 1];
             nextX = nextPoint[0];
             nextY = nextPoint[1];
             var diffX = nextX - creep.x;
             var diffY = nextY - creep.y;
             var normFactor = Math.sqrt(diffX*diffX + diffY*diffY);
             creep.xVel = diffX / normFactor;
             creep.yVel = diffY / normFactor;
         }
      }
   }
}

function updateGameState(delta){
  for (var i in players){
      for(var j in players[i].towers){
          updateTower(i, players[i].towers[j], players[i].creeps, delta);
      }
  }
  for (var i in players){
      for(var j in players[i].creeps){
          updateCreep(i, players[i], players[i].creeps[j], delta);
      }
  }
}

function spawnUserCreep(userid, user, creep_pic) {
    var creep = new Creep(creep_id++, creep_pic);
    //everyone.now.addCreep(creep.id);
    user.creeps.push(creep);
    nowjs.getClient(userid, function(){
      this.now.client_create_creep(creep.id, creep_pic);
    });
}

function spawnAllCreeps() {
    console.log(players);
    for (var i in players) {
        //for each player, spawn creeps to them based on who's in their poke list
        nowjs.getClient(i, function() {
            //spawnUserCreep(i, players[i]);
            for (var fb_player_id in this.now.fb_poke_ids) {
                console.log('fb player id ' + fb_player_id);
                for (var j in players) {
                    var other_player = players[j];
                    if (!other_player.fb_id) 
                        continue;
                    if (other_player.fb_id == fb_player_id) {
                        spawnUserCreep(i, players[i], other_player.profile_pic);
                    }
                }
            }
        });
    }
}

everyone.now.buildTower = function(x, y, type) {
    var retval = false;
    if(players[this.user.clientId].goldCount > 20){
        retval = true;
        var tid = tower_id++;
        players[this.user.clientId].goldCount = players[this.user.clientId].goldCount - 20;
        players[this.user.clientId].towers[tid] = new Tower("basic");
        players[this.user.clientId].towers[tid].x = x;
        players[this.user.clientId].towers[tid].y = y;
        players[this.user.clientId].towers[tid].timeSinceShot = 0;
        players[this.user.clientId].towers[tid].range = 50;
        players[this.user.clientId].towers[tid].damage = 1;
        players[this.user.clientId].towers[tid].level = 1;
    }
    
    this.now.client_build_tower(retval, x, y, type, players[this.user.clientId].goldCount);
}

everyone.now.joinRoom = function (fb_id, profile_pic, name) {
      if (!(this.user.clientId in players)) {
        players[this.user.clientId] = User();
      }
      players[this.user.clientId].fb_id = fb_id;
      players[this.user.clientId].profile_pic = profile_pic;
      players[this.user.clientId].name = name;
      everyone.now.newPlayer(players);
}

everyone.now.startGameForAll = function() {
    everyone.now.move_from_room_to_game();
    game_start = true;
}

everyone.now.upgradeTower = function(x, y) {
    var retval = false;
    var tower;
    for (var i in players[this.user.clientId].towers) {
        if (players[this.user.clientId].towers[i].x == x &&
            players[this.user.clientId].towers[i].y == y) {
          tower = players[this.user.clientId].towers[i];
          break;
        }
    }

    var upgradeCost = 10 * Math.pow(2,tower.level);

    if (players[this.user.clientId].goldCount > upgradeCost) {
        retval = true;
        players[this.user.clientId].goldCount -= upgradeCost;
        tower.level++;
        tower.damage = tower.damage * 1.5;
    }
    
    this.now.client_upgrade_tower(retval, x, y, tower.level, players[this.user.clientId].goldCount);
}

everyone.now.syncState = function() {
    this.now.client_sync_state( players[this.user.clientId].creeps, players[this.user.clientId].lives, players[this.user.clientId].goldCount );
}


/*
everyone.now.addCreep = function() {
    for (var i in players) {
        if(i != this.user.clientId){
            var creep = new Creep(creep_id++);
            players[i].creeps.push(creep);
            nowjs.getClient(i, function(){
                this.now.client_create_creep(creep.id);
            });
        }
    }
}
*/

everyone.now.gameStart = function() {
    game_start = true;
}

var lastTime = new Date().getTime();
var lastCreepSpawn = lastTime;
var lastLevelChange = 0;
function loop() {
    if(game_start){
        var currentTime = new Date().getTime();
        updateGameState(currentTime - lastTime);
        if (currentTime - lastCreepSpawn >= 1000) {
            lastCreepSpawn = currentTime;
            spawnAllCreeps();
        }
        lastLevelChange += currentTime - lastTime;
        if (lastLevelChange >= 60000) {
            everyone.now.level++;
            lastLevelChange = 0;
        }
        lastTime = currentTime;
    }
    setTimeout(loop,40);
}

loop();
