//Server function wrappers------------
var server_build_tower = function() {
    now.buildTower(
        this.getAttribute('x'), 
        this.getAttribute('y'),
        this.getAttribute('tower_type')
    );
}

var server_upgrade_tower = function(){
    now.upgradeTower(
        this.getAttribute('x'),
        this.getAttribute('y')
    );
}

now.client_build_tower = function(success, x, y, type, new_gold) {
    build_tower(success, x, y, type, new_gold); 
}

now.client_upgrade_tower = function(success, x, y, level, new_gold) {
    upgrade_tower(success, x, y, level, new_gold);
}

now.client_tower_fire = function(tower_x, tower_y, creep_id) {
    tower_fire(tower_x, tower_y, creep_id);
}

//client functions-----------
var build_tower = function(success, x, y, type, new_gold) {
    if (success) {
        log('Successfully built tower: ' + type);
        draw_tower(1, x, y);
        update_gold(new_gold);
        do_upgrade_tower_menu(map[x][y]);
    } else {
        log('Could not build tower.');
    }
}

var upgrade_tower = function(success, x, y, level, new_gold) {
    if (success) {
        log('Successfully upgraded tower');
        draw_tower(level, x, y);
        update_gold(new_gold);
    } else {
        log('Could not upgrade tower.');
    }
}

var do_build_tower_menu = function(tile) {
    $('#tower_panel').html('');
    var menu = $('#tower_panel').append(
        '<div class="menu"></div>');
    var build_basic_button = $(
        '<button class="btn btn-primary" id="build_basic_tower" type="submit">Build Basic Tower: ' + towers().basic_tower.cost + '</button>');
    menu.append(build_basic_button);
    build_basic_button.attr('tower_type', 'basic');
    build_basic_button.attr('x', tile.td.x);
    build_basic_button.attr('y', tile.td.y);
    build_basic_button.bind('click', server_build_tower);
    //different tower you can place here
    //cost for tower
}

var do_upgrade_tower_menu = function(tile) {
    if (tile.td.tower != null) {
        $('#tower_panel').html('');
        var tower = tile.td.tower;
        var menu = $('#tower_panel').append(
            '<div class="menu"></div>');
        var upgrade_button = $(
            '<button class="btn btn-primary" id="upgrade_basic_tower" type="submit">Upgrade tower (cost: ' + 10*Math.pow(2, tower.level) + ')</button>');
        var tower_level = $(
            '<h3> Tower level: <span id="tower_level">' + 
            tower.level + '</span></h3>'
        );
        menu.append(tower_level);
        menu.append(upgrade_button);
        upgrade_button.attr('tower_type', 'basic');
        upgrade_button.attr('x', tile.td.x);
        upgrade_button.attr('y', tile.td.y);
        upgrade_button.bind('click', server_upgrade_tower);
    }
}

var draw_tower = function(level, x, y) {
    if (map[x][y].td.tower != null) {
        map[x][y].td.tower.remove();
        map[x][y].td.tower = null;
    }
    map[x][y].td.tower = paper.circle(x*tile_size + tile_size/2, y*tile_size + tile_size/2, tile_size/3);
    map[x][y].td.tower.x = x;
    map[x][y].td.tower.y = y;
    map[x][y].td.tower.attr({'fill': get_tower_color(level)}); 
    map[x][y].td.tower.level = level;
    map[x][y].td.tower.click(select_tower);
}

var select_tower = function(e) {
    $('#tower_panel').html('');
    map[last_selected.x][last_selected.y].attr({'fill': colors()['terrain']});
    last_selected = {x: this.x, y: this.y};
    map[this.x][this.y].attr({'fill': colors()['selected_terrain']});
    if (map[this.x][this.y].td.tower != null) {
        do_upgrade_tower_menu(map[this.x][this.y]);
    }
}

var tower_fire = function(tower_x, tower_y, creep_id) {
    try {
        var creep = creeps[creep_id];
        x = ((parseFloat(tower_x) + .5) * tile_size);
        y = ((parseFloat(tower_y) + .5) * tile_size);
        cx = ((parseFloat(creep.api.x)+.5) * tile_size);
        cy = ((parseFloat(creep.api.y)+.5) * tile_size);
        //var laser = draw_laser((tower_x+.5)*tile_size, (tower_y+.5)*tile_size, (creep.api.x+.5)*tile_size, (creep.api.y+.5)*tile_size);
        console.log(x, y, cx, cy);
        var laser = paper.path("M" + x + " " + y + "L" + cx + " " + cy);
        laser.attr({'fill': colors()['laser_color'],
                    'stroke-width': 3});
        setTimeout(function(){laser.remove()}, 200);
    } catch(error) {

    }
}

var draw_laser = function(x, y, cx, cy) {
    console.log(x, y, cx, cy);
    var laser = paper.path("M" + x + " " + y + "L" + cx + " " + cy);
    laser.attr({'fill': colors()['laser_color'],
                'stroke-width': 3});
    return laser;
}
