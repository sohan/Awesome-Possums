//Server function wrapppers ------------------------
now.client_create_creep = function(id, pic) {
    create_creep(id, game().x_start, game().y_start, 0, pic);
}

now.client_creep_reached_end = function(creep_id) {
    creep_reached_end(creep_id);
}

now.client_destroy_creep = function(id) {
    destroy_creep(id);
}

//Client functions -------------------
var create_creep = function(id, x, y, cur_index, pic) {
    var creep = paper.image(pic, 
       parseFloat(x) * tile_size, parseFloat(y) * tile_size, 47, 47);
    creep.attr({'fill': colors()['creep_color']});
    var api = Object();
    api['id'] = id;
    api['vel'] = game().vel;
    api['x'] = x;
    api['y'] = y;
    //cur_index is the last location on the path that the creep visited
    api['cur_index'] = cur_index;
    creep.api = api;
    creeps[id] = creep;
}

var update_creep_loop = function() {
    var t = setTimeout(update_all_creeps, game_tick_ms);
}

//update locations of all creeps
//arg: time_step is the delta/change from last update
var update_all_creeps = function() {
    if (lives <= 0)
    {
         return;
    }
    time_step = game_tick_ms; 
    for (var id in creeps) {
        try {
            var creep = creeps[id];
        
            if (creep.api.cur_index == path.length - 1) {
                //we're at the last position, remove the creep
                destroy_creep(id);
                continue;
            }
            var next = path[creep.api.cur_index];
             
            var x_dir, y_dir;
            var creep_x = creep.api.x;
            var creep_y = creep.api.y;
            var x_diff = Math.abs(next.x - creep_x);
            var y_diff = Math.abs(next.y - creep_y);
            var to_next_loc; //distance to next location

            if (x_diff > y_diff) 
            {
                to_next_loc = x_diff;
                if (next.x > creep_x)
                    x_dir = 1+Math.pow(next.x-creep_x, 2.0)/100;
                else
                    x_dir = -(1+Math.pow(next.x-creep_x, 2.0)/100);
                y_dir = 0;
            }else
            {
                to_next_loc = y_diff;
                if (next.y > creep_y)
                    y_dir = 1+ Math.pow(next.y-creep_y, 2.0)/100;
                else
                    y_dir = -(1 + Math.pow(next.y-creep_y, 2.0)/100);
                x_dir = 0;
            }

            // if reached/past next location
            if(to_next_loc < time_step/1000 * creep.api.vel) 
            {
                creep_x = next.x; creep_y = next.y;
                creep.api.cur_index = creep.api.cur_index+1;
            }else // move it closer
            {
                creep_x = creep_x + time_step/1000 * creep.api.vel * x_dir;
                creep_y = creep_y + time_step/1000 * creep.api.vel * y_dir;
            }
            creep.api['x'] = creep_x;
            creep.api['y'] = creep_y;
            creep.x = (creep.api.x+0.0)* tile_size;
            creep.y = (creep.api.y+0.0) * tile_size;
            creep.animate(creep.attr({'cx': (creep.api.x + .5) * tile_size,
                'cy': (creep.api.y + .5) * tile_size}));
            //cur_index is the last location on the path that the creep visited
        } catch (error) {
            //console.log(error);
        }
    }
    var t = setTimeout(update_all_creeps, game_tick_ms);
}

var creep_reached_end = function(creep_id) {
    destroy_creep(creep_id);
    decrement_lives();
}

var destroy_creep = function(id) {
    try {
        if (creeps[id]) {
            var creep = creeps[id]; 
            creep.remove();
            delete creep[id];
        }
    } catch(err){
        
    }
}



