/* Audio Player */
!function(d){var i='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="30" style="margin-top: -4px;"><path fill="white" stroke="white" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm115.7 272l-176 101c-15.8 8.8-35.7-2.5-35.7-21V152c0-18.4 19.8-29.8 35.7-21l176 107c16.4 9.2 16.4 32.9 0 42z"/></svg>',a='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="30" style="margin-top: -4px;"><path fill="white" stroke="white" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm-16 328c0 8.8-7.2 16-16 16h-48c-8.8 0-16-7.2-16-16V176c0-8.8 7.2-16 16-16h48c8.8 0 16 7.2 16 16v160zm112 0c0 8.8-7.2 16-16 16h-48c-8.8 0-16-7.2-16-16V176c0-8.8 7.2-16 16-16h48c8.8 0 16 7.2 16 16v160z"/></svg>',s=!1;function o(t){d("audio").each(function(){this!=t&&this.pause()}),d(t).data("played_already",1),d(".baudio-play").html(i),t.paused?(d(t).parent().find(".baudio-play").html(a),t.play()):t.pause()}function r(t){if(s){var i=s.offset().left,a=d(s.siblings(".baudio-progress")[0]);t.pageX<i?a.css("width",0):t.pageX>i+s.width()?a.css("width","100%"):a.css("width",t.pageX-i)}}d.fn.fraudio=function(){this.filter("audio").each(function(){$fraudio=d('<div class="baudio-wrap">\t\t\t<audio></audio>\t\t\t<div class="baudio-play-wrap">\t\t\t\t<span class="baudio-play">\t\t\t\t\t<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="30" style="margin-top: -4px;"><path fill="white" stroke="white" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm115.7 272l-176 101c-15.8 8.8-35.7-2.5-35.7-21V152c0-18.4 19.8-29.8 35.7-21l176 107c16.4 9.2 16.4 32.9 0 42z"/></svg>\t\t\t\t</span>\t\t\t</div>\t\t\t<div class="baudio-text">\t\t\t\t<div class="baudio-title"></div>\t\t\t\t<div class="baudio-artist"></div>\t\t\t</div>\t\t\t<div class="baudio-progress"></div>\t\t\t<div class="baudio-progress-click"></div>\t\t</div>'),$fraudio.find("audio").replaceWith(d(this).clone()),$fraudio.find(".baudio-title").html(d(this).attr("data-title")),$fraudio.find(".baudio-artist").html(d(this).attr("data-artist")),d(this).attr("autoplay")&&($fraudio.find("audio").data("played_already",1),$fraudio.find(".baudio-play").html(a)),d(this).replaceWith($fraudio)}),d(".baudio-play").click(function(){o(d(this).closest(".baudio-wrap").find("audio")[0])}),d(".baudio").on("timeupdate",function(){if(!s){var t=d(this).siblings(".baudio-progress")[0];d(t).css("width",this.currentTime/this.duration*100+"%")}}),d("audio").on("ended",function(){d(this).parent().find(".baudio-play").html(i)}),d(".baudio-progress-click").on("mousedown",function(){var t=d(this).siblings("audio")[0];d(t).data("played_already")?s=d(this):o(t)}),d(document).on("mousemove",r),d(document).on("mouseup mouseleave",function(t){if(s){r(t);var i=s.siblings("audio")[0];i.currentTime=t.offsetX/s.width()*i.duration,s=!1}})},d(function(){d(".baudio").fraudio()})}(jQuery);