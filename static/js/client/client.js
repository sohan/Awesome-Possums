var start_client_game = function() {
    $(document).ready(function() {
        width = 10;
        height = 10;
        tile_size = 50;
        paper = Raphael('board', (width + 1)* tile_size, (height +1)* tile_size);
        path = Object();
        initialize_path();
        api = init_map(width, height, tile_size);
        map = api.map;
        init_path_graphics();
        tiles_group = api.tiles_group;
        game_tick_ms = 100;
        game_sync_ms = 10;
        poke_frequency = 2000;
        last_selected = {x: 0, y: 0};
        lives = 10;
        game_over_text = null;
        poke_ids = Object();

        creeps = Object();
        update_creep_loop();
        now.ready(function() {
            now.fb_user_id = "0"; //initialize this on login probably
            now.fb_poke_ids = Object();
            sync_state_loop();
            sync_pokes_loop();
        });
    });
}

var game = function() {
    var api = Object();
    api['vel'] = 1;
    api['x_start'] = 0;
    api['y_start'] = 2;
    return api;
}

var initialize_path = function()
{
    path['0'] = {x: 0, y: 2};
    path['1'] = {x: 2, y: 2};
    path['2'] = {x: 2, y: 8};
    path['3'] = {x: 6, y: 8};
    path['4'] = {x: 6, y: 2};
    path['5'] = {x: 9, y: 2};
}

var towers = function() {
    var api = Object();
    api['basic_tower'] = Object();
    api['basic_tower']['cost'] = 20;
    return api;
}

var colors = function() {
    var api = Object();
    api['terrain'] = '#569993';
    api['basic_tower'] = '#29FF73';
    api['upgraded_tower'] = '#311011';
    api['selected_terrain'] = '#007167';
    api['creep_color'] = '#FF6C00';
    api['laser_color'] = '#FF0016';
    api['path'] = '#71654C';
    return api;
}

var get_tower_color = function(level){
    var r = 180-20*level;
    var g = 0;
    var b = 0;
    return 'rgb(' + r + ',' + g + ',' + b +')';
}


var create_tile = function(i, j) {
    var tile = paper.rect(i*tile_size, j*tile_size,
       tile_size, tile_size); 
    tile.td = Object();
    tile.td.type = 'terrain';
    if (tile.td.type == 'terrain') {
        tile.attr('fill', colors()['terrain']);
    }
    tile.td.x = i;
    tile.td.y = j;
    tile.td.tower = null;
    return tile;
}

//changes colors along the path
var init_path_graphics = function(){
    var i,j, dir;
    for (i = 0; i < 5; i++){
        var x = path[i]['x'], nx = path[i+1]['x'];
        var y = path[i]['y'], ny = path[i+1]['y'];
        if (x != nx)
        {
            for(j = Math.min(x,nx); j <= Math.max(x,nx); j++)
            {
                map[j][y].td.type = 'path'; 
                map[j][y].attr('fill', colors()['path']);
            }
        }else
        {
            for(j = Math.min(y,ny); j <= Math.max(y,ny); j++)
            {
                map[x][j].td.type = 'path'; 
                map[x][j].attr('fill', colors()['path']);
            }

        }
    }
}

//create a map
var init_map = function(width, height, tile_size) {
    var map = Array();
    var tiles_group = paper.set();
    var api = Object();
    for (var i = 0; i < height ; i++) {
        map[i] = Array();
        for (var j = 0; j < width; j++) {
            var tile = create_tile(i, j);
            tiles_group.push(tile);
            map[i][j] = tile;
        }
    }

    tiles_group.attr().click(select_terrain);
    api.map = map;
    api.tiles_group = tiles_group;

    return api;
}

var update_gold = function(gold) {
    $('#player_gold').html(gold);
}

var update_map_level = function(level) {
    $('#map_level').html(level);
}

var update_lives = function(lives) {
    $('#player_lives').html(lives);
}

var decrement_lives = function() {
    update_lives($('#player_lives').html() - 1);
}

var log = function(msg) {
    $('#log').html(new Date().toLocaleTimeString() + ' ' + msg);
}

var select_terrain = function(e) {
    var tile = this;
    if (tile.td.type != 'terrain') {
        return;
    }
    $('#tower_panel').html('');
    map[last_selected.x][last_selected.y].attr({'fill': colors()['terrain']});
    last_selected = {x: this.td.x, y: this.td.y};
    if (tile.td.tower == null) {
        tile.attr({'fill': colors()['selected_terrain']});
        do_build_tower_menu(tile);
    }else
    {
        tile.attr({'fill': colors()['selected_terrain']});
        do_upgrade_tower_menu(tile);
    }
}

now.client_sync_state = function(server_creeps, lives, gold) {
    sync_state(server_creeps, lives, gold);
}


//used to sync creeps with the information on the server side 
var sync_state = function(server_creeps, lives, gold){
    if (lives <= 0) {
        if (game_over_text == null) {
            game_over_text = paper.text(250, 100, 'GAME_OVER').attr({'font-size':50});
        }
        return;
    }
    for (var id in creeps) {
        destroy_creep(id);
    }
    creeps = Object();
    for (var i in server_creeps) {
        var creep = server_creeps[i];
        if (creep != null) {
            create_creep(creep.id, creep.x, creep.y, creep.pathIndex, creep.image);
        }
    }
    update_gold(gold);
    update_lives(lives);
    update_map_level(now.level);
}

var sync_state_loop = function() {
    var t = setTimeout(function() {
        now.syncState();
        var t = setTimeout(sync_state_loop, game_sync_ms);
    }, game_sync_ms);
}

var sync_pokes = function() {
    //make sure they've logged in first?
    FB.api('/me/pokes',  function(response) {
        var fb_poke_ids = {};
        var fb_user_id = "";
        if (response && response.data != undefined && response.data != null) {
            for(var i=0; i < response.data.length; i++) {
              fb_poke_ids[response.data[i].from.id] = response.data[i].from.name;
              fb_user_id = response.data[i].to.id;
            }
            now.fb_user_id = fb_user_id;
            now.fb_poke_ids = fb_poke_ids;
            poke_ids = fb_poke_ids;
            console.log(now.fb_poke_ids);
            console.log(fb_poke_ids);
        }
      }
    );
    setTimeout(sync_pokes, poke_frequency);
};

var sync_pokes_loop = function() {
    setTimeout(sync_pokes, poke_frequency);
}

now.update_gold_count = function(goldCount) {
    update_gold(goldCount);
}
