/* TIMELINE */
!function(t){var i=function(i){var e={top:t(window).scrollTop(),left:t(window).scrollLeft(),right:t(window).scrollLeft()+t(window).width(),bottom:t(window).scrollTop()+t(window).height()},n=i.offset();return n.right=n.left+i.outerWidth(),n.bottom=n.top+i.outerHeight(),!(e.right<n.left||e.left>n.right||e.bottom<n.top||e.top>n.bottom)};t.fn.verticalTimeline=function(e){var n=t.extend({startLeft:!0,alternate:!0,animate:!1,arrows:!0},e);return this.each(function(){var e=t(this).children("div");t(this).addClass("timeline"),e.each(function(){t(this).addClass("timeline-content").wrap('<div class="timeline-point"><div class="timeline-block"></div></div>')}),t(this).find(".timeline-point").each(function(){if(t(this).prepend('<div class="timeline-icon"></div>'),t(this).find("[data-vticon=true]").length){var i=t(this).find("[data-vticon=true]").html();t(this).find(".timeline-icon").append(i),t(this).find("[data-vticon=true]").remove()}}),n.alternate?n.startLeft?t(this).find(".timeline-point:odd").each(function(){t(this).find(".timeline-block").addClass("timeline-right")}):t(this).find(".timeline-point:even").each(function(){t(this).find(".timeline-block").addClass("timeline-right")}):t(this).find(".timeline-block").addClass("timeline-"+n.startSide),n.animate&&t(this).find(".timeline-block").each(function(){var e=this;t(this).addClass("vt-animate-"+n.animate),i(t(this))&&t(this).removeClass("vt-animate-"+n.animate),t(window).on("scroll",function(){i(t(e))&&t(e).removeClass("vt-animate-"+n.animate)})}),t(this).find(".timeline-content").each(function(){var i=t(this).data("tldate"),e=t(this).data("vtside");i&&t(this).parent().prepend('<span class="timeline-date">'+i+"</span>"),e&&(t(this).parent().removeClass("timeline-right"),t(this).parent().addClass("timeline-"+e))}),n.arrows||t(this).find(".timeline-block").addClass("vt-noarrows")})}}(jQuery);
$(document).ready(function(){
	$('.timeline').verticalTimeline();
	$('.timeline-r').verticalTimeline({startLeft: false});
	$('.timeline-na').verticalTimeline({alternate: false});
	$('.timeline-san').verticalTimeline({animate: 'slide'});
	$('.timeline-r-san').verticalTimeline({startLeft: false, animate: 'slide'});
});