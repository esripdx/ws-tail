var autoScroll = true;

$(function(){
  $(".full-height").css({
    height: ''+($(window).height() - $(".navbar-static-top").height() - parseInt($(".navbar-static-top").css('margin-bottom')) - 24)+'px'
  });

  $("#auto-scroll").click(function(){
    $(this).toggleClass('btn-primary');
    if($(this).hasClass("btn-primary")) {
      autoScroll = true;
    }else{
      autoScroll = false;
    }
  });
});

$(function(){
  var primus = new Primus('/');

  function filenameToID(fn) {
    return "file_"+fn.replace(/[^a-z0-9-_]/g, '_');
  }

  primus.on('open', function() {
    $("#log-status").text('is connected');

    primus.write({
      action: "list"
    });

    primus.on('data', function(data){

      if(data.type == 'files') {
        $("#logfile-list").empty();
        for(var i in data.files) {
          $("#logfile-list").append('<a class="list-group-item" href="#">'+data.files[i]+'</a>');
        }
        $("#logfile-list a").click(function(){
          $("#logfile-list a").removeClass('active');
          $(this).addClass('active');
          $("#tail").empty();
          primus.write({
            action: "subscribe",
            file: $(this).text()
          })
        });

      } else if(data.type == 'line') {
        $("#tail").append('<li>'+data.line+'</li>');
        if(autoScroll) {
          $("#tail").scrollTop($("#tail li").length * 100);
        }
      }
    })

  });

});
