window.fbAsyncInit = function() {
    FB.init({
      appId      : '191378074298387', // App ID
      channelUrl : '//sohanjain.com:8080/static/channel.html', // Channel File
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });

// Additional initialization code here
};

//login button
$(document).ready(function(){
    $('#login').click(function() {
       FB.login(function(response) {
       if (response.authResponse) {
         console.log('Welcome!  Fetching your information.... ');
         FB.api('/me', function(response) {
           console.log(response);
           console.log('Good to see you, ' + response.name + '.');
           var profile_pic = 
           'http://graph.facebook.com/' + response.username + '/picture'
           now.joinRoom(response.id, profile_pic, response.first_name);
         });
       } else {
         console.log('User cancelled login or did not fully authorize.');
       }
     }, {scope: 'read_mailbox'});
    });
});

// Load the SDK Asynchronously
(function(d){
     var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement('script'); js.id = id; js.async = true;
     js.src = "//connect.facebook.net/en_US/all.js";
     ref.parentNode.insertBefore(js, ref);
}(document));

now.newPlayer = function(players) {
    var players_div = $('#players');
    players_div.html('<tr><th>Name</th><th>Picture</th><th>Player profile(new window)</th></tr>');
    for (var id in players) {
        var player = players[id];
        if (player.name) {
            var new_player = $('<tr></tr>');
            players_div.append(new_player);
            new_player.append($('<td>' + player.name + '</td>'));
            new_player.append($('<td><img src="' + player.profile_pic + '"></td>'));
            new_player.append($('<td><a href="http://www.facebook.com/' + player.fb_id + '" target="_blank">' + player.name + "'s profile </a></td>"));
        }
    }
}

var init_room = function() {
    $(document).ready(function() {
        $('#start_game').click(function() {
            now.startGameForAll();
        });
    });
}

now.move_from_room_to_game = function() {
    console.log('move_from game to room');
    if (!$('#game_container').hasClass('active')) {
    start_client_game();
    }
    $('#join_game').removeClass('active');
    $('#join_game').addClass('hidden');
    $('#game_container').removeClass('hidden');
    $('#game_container').addClass('active');
}


