function setup(){
	$("html").html("");
	socket.close();
	if (window.adsbygoogle) {adsbygoogle.unwatch()}
	utils.findBootstrapEnvironment = function(){return ""}
	var css = '<style>'+
		'*{font-family:monospace;font-size:12pt}'+
		'#controls{display: inline-block; width: 120px;}'+
		'#urlbox{width:calc(100% - 145px);}'+
		'#tabs{padding:6pt;overflow-x:scroll;white-space:nowrap;height:23px}'+
		'#tabs button{margin-right:10px;cursor:pointer}'+
		'#tabs button.active{font-weight:bold}'+
		'#urlbox{margin-left:8px}'+
		'body{margin:0}'+
		'#cont{margin-top:75px;margin-bottom:12px;padding:12pt;}'+
		'#nav{position:fixed;top:0;left:0;height:75px;width:100%;z-index:9;background-color:lightgray}'+
		'#main{padding-left:0;margin:0;list-style:none;}'+
		'#main>li>ul{list-style:none;padding-left:24pt}'+
		'p,blockquote{margin-bottom:6pt;margin-top:6pt;}'+
		'#replyText,#postText{width:100%;height:100px}'+
		'input[type="text"]{width:100%}'+
		'#username{width:inherit}'+
		'blockquote p:before{content:"> "}'+
		'img{max-width:100%}'+
		'.highlighted{background-color:#eee}'+
		'.upvote.done,.downvote.done{color:red}'+
		'</style>';
	$("html").append(css);
	$("body").append("<div id='nav'></div>");
	$("#nav").append("<div id='tabs'></div>");
	$("#nav").append("<input id='urlbox' type='text'/>");
	$("#nav").append("<span id='controls'></span>");
	$("#controls").append("<button id='go' onclick='goToUrl()'>&gt;&gt;&gt;</button>");
	$("#controls").append("<button id='cl' onclick='currentTab.close()'>Close</button>");
	$("body").append("<div id='cont'></div>");
}
function goToUrl() {
	display($("#urlbox").val());
}
function preprocess(html) {
	var r = $(html);
	r.find("iframe[src^='//www.youtube.com']").each(function(){
		var src = $(this).attr("src");
		var id = src.replace(/^.*\//,"").replace(/[^A-Za-z0-9_-].*$/,"");
		$(this).replaceWith(
			"<a href='//www.youtube.com/watch?v="+id+
			"'><img style='max-width:616px' src='//i.ytimg.com/vi/"+id+
			"/hqdefault.jpg'></img></a>"
		);
	});
	return r;
}
function isOwn(url) {
	if (url==="/" ||
		url.indexOf("https://"+location.host)===0 ||
		url.indexOf("http://"+location.host)===0 ||
		url.indexOf("//"+location.host)===0) {
		return true;
	}
	var m = url.match(/\/[^\/]/);
	return m && m.index===0;
}
function displayContents(data){
	var name=data.template.name;
	if (name==="category"||name==="recent"){
		data.topics.forEach(function(topic){
			var item = "<li>"+(topic.unread?"*":"")+
				"<a href='/topic/"+topic.slug+"'><b>"+topic.title+"</b></a> "+
				(topic.postcount-1)+
				" replies <a href='/user/"+topic.user.userslug+
				"'>@"+topic.user.userslug+"</a></li>";
			var x = $(item).appendTo("#main");
		});
		if (name==="category"){
			var form = "<li><input type='hidden' id='cid' value='"+data.cid+
				"'/><br/><input type='text' id='postTitle' placeholder='Title' /><br/>"+
				"<textarea id='postText'></textarea><br/>"+
				"<input type='text' id='postTags' placeholder='Tags (comma separated)' /><br/>"+
				"<button id='postButton' onclick='submitPost()'>New post</button> "+
				"<span id='postError'></span></li>";
			$(form).appendTo("#main");
		}
	} else if (name==="topic"){
		data.posts.forEach(function(post){
			var item = "<li id='post"+post.pid+"'><a href='/user/"+post.user.userslug+
				"'>@"+post.user.userslug+"</a> "+
				"<span class='votes'>"+posOrNeg(post.votes)+"</span>"+
				" <a href='' class='upvote"+  (post.upvoted?" done":"")+  "' onclick='upvote(this,event)'>+</a>"+
				" <a href='' class='downvote"+(post.downvoted?" done":"")+"' onclick='downvote(this,event)'>-</a>"+
				" <span class='timestamp'>["+post.relativeTime+
				"]</span> <a href='' onclick='setToPid(event,"+post.pid+",\""+post.user.userslug+"\")'>Reply</a>"+
				"</li>";
			var details = "<ul><li>"+post.content+"</li></ul>";
			details = preprocess(details);
			$(item).appendTo("#main").append(details);
		});
		var form = "<li><input type='hidden' id='tid' value='"+data.tid+
			"'/><textarea id='replyText'></textarea><br/>"+
			"<input type='hidden' id='toPid'/>"+
			"<button id='replyButton' onclick='submitReply()'>Reply</button> "+
			"<span id='toPidInfo' style='display:none'><a href='' onclick='goToCurrentPid(event)'>Goto</a> "+
			"<a href='' onclick='setToPid(event,0)'>Clear</a> </span>"+
			"<span id='replyError'></span></li>";
		$(form).appendTo("#main");
	} else if (name==="categories") {
		data.categories.forEach(function(c){
			var item = "<li><b><a href='/category/"+c.slug+"'>"+c.name+"</a></b> "+c.description+"</li>";
			var details = c.teaser ? 
				"<ul><li><a href='"+c.teaser.url+"'>"+
				c.teaser.url+"</a> ["+c.teaser.timestampISO+
				"]</li></ul>" : "";
			$(item).appendTo("#main").append(details);
		})
	} else {
		var item = "<li>Unknown data type: "+name+"</li>";
		$(item).appendTo("#main");
	}
	$("a[href]").each(function(){
		var href = $(this).attr("href");
		if (href) {
			if (isOwn(href)) {
				$(this).attr("data-href", href);
				$(this).attr("href", "#");
				$(this).on("click",function(c){
					display(
						$(this).attr("data-href"),
						(c.which > 1 || c.shiftKey || c.altKey || c.metaKey || c.ctrlKey)
					);
					c.preventDefault();
				});
			} else {
				$(this).attr("target","_blank");
			}
		}
	});
}
function setToPid(event,pid,username) {
	if (pid) {
		$("#replyButton").text("Reply to @"+username);
		$(".highlighted").removeClass("highlighted");
		$("#post"+pid).addClass("highlighted");
		$("#toPidInfo").show();
		$("#toPid").val(pid);
		$("#replyText").get(0).scrollIntoView();
	} else {
		$("#replyButton").text("Reply");
		$(".highlighted").removeClass("highlighted");
		$("#toPidInfo").hide();
		$("#toPid").val("");
	}
	event.preventDefault();
}
function goToCurrentPid(event) {
	var toPid = $("#toPid").val();
	if (toPid) {
		$("#post"+toPid+" .timestamp").get(0).scrollIntoView(true);
		window.scrollBy(0,-1*$("#nav").height());
	}
	event.preventDefault();
}
function strip(url) {
	var m = url.match(/(^|[^\/])\/[^\/]/);
	if (m) {
		if (m.index===0) {
			url = url.slice(m.index);
		} else {
			url = url.slice(m.index+1);
		}
	}
	return url;
}
function shorten(title) {
	var max = 20;
	if (title.length <= max) {
		return title;
	} else {
		return title.slice(0,max-1)+"…";
	}
}
var tabs = {};
function Tab(id, title){
	$("#tabs").append(
		"<button onclick='changeTab(this)' id='"+id+"'>"+
		shorten(title)+"</button>"
	);
	this.id = id;
	this.title = title;
	this.active = false;
	this.data = false;
	this.status = ">>>";
	tabs[id] = this;
	if (!currentTab) {
		currentTab = this;
		this.activate();
	}
}
Tab.prototype.setData = function(data) {
	this.data = data;
	if (this.active) {
		$("#cont").html("");
		var h = "";
		if (data.breadcrumbs) {
			data.breadcrumbs.forEach(function(b,i){
				var text = b.text;
				if (text==="[[global:home]]") {text="Home";}
				if (i!==data.breadcrumbs.length-1) {
					h+="<a href='"+b.url+"'>"+text+"</a> &gt; ";
				} else {
					h+="<b>"+text+"</b>";
				}
			});
		}
		if (data.pagination && data.pagination.pageCount > 1) {
			h+=" | ";
			var url=this.url;
			data.pagination.pages.forEach(function(p,i){
				if (p.separator) {
					h+=("… ");
				} else if (p.active) {
					h+=(p.page+" ");
				} else {
					var u = url;
					if (u.indexOf("?")!==-1) {
						u = u.slice(0,u.indexOf("?"))
					}
					h+="<a href='"+u+"?"+p.qs+"'>"+p.page+"</a> "
				}
			});
		}
		$("#cont").append("<p>"+h+"</p>");
		$("#cont").append("<ol id='main'></ol>");
		displayContents(data);
	}
}
Tab.prototype.setURL = function(url){
	this.url = url;
	if (this.active) {
		$("#urlbox").val(url);
	}
}
Tab.prototype.setTitle = function(title){
	this.title = title;
	$("#"+this.id).html(shorten(title));
}
Tab.prototype.setStatus = function(status){
	this.status = status;
	if (this.active) {
		$("#go").html(status);
	}
}
var currentTab = false;
Tab.prototype.activate = function() {
	currentTab.active = false;
	this.active = true;
	$("#"+currentTab.id).removeClass("active");
	$("#"+this.id).addClass("active");
	$("#urlbox").val(this.url);
	$("#go").html(this.status);
	currentTab = this;
	if (this.data) {
		this.setData(this.data);
	}
}
Tab.prototype.close = function() {
	var button = $("#"+this.id);
	var nextButton = button.next();
	if (!nextButton.length) {
		nextButton = button.prev();
	}
	if (!nextButton.length) {
		return;
	}
	tabs[nextButton.attr("id")].activate();
	button.remove();
	delete tabs[this.id];
}
function changeTab(button) {
	tabs[$(button).attr("id")].activate();
}
function display(url, newTab, intoTab) {
	url = strip(url);
	var tab;
	if (newTab) {
		tab = new Tab("tab"+(1+Math.round(999999999999*Math.random())), url);
	} else {
		tab = intoTab || currentTab;
	}
	tab.setStatus("...")
	tab.setTitle(url);
	tab.setURL(url);
	$.get("/api"+url, function(data, status){
		console.log("Data:",data);
		console.log("Status:",status);
		tab.setTitle(data.title);
		tab.setStatus(">>>");
		tab.setData(data);
	}).error(function(e){
		// needs to go by tab
		$("#go").html(">>>");
		$("#cont").html("");
		$("#cont").append("<p>"+e.status+" "+e.statusText+"</p>");
		$("#cont").append("<p><a href='javascript:display(\"/\")'>Home</a></p>");
	});
}
function submitLogin() {
	$("#loginbutton").prop("disabled",true);
	login($("#username").val(), $("#password").val());
}
function login(username, password) {
	$.get("/api/config", function(data){
		console.log("C", data);
		var csrf = data.csrf_token;
		$.ajax("/login", {
			headers:{"x-csrf-token":csrf},
			data:{username:username,password:password,remember:"off",returnTo:"/"},
			method:"POST",
			fail:function(e){alert(e)},
			success:function(){display("/",true)}
		});
	});
}
function submitReply() {
	var text = $("#replyText").val();
	if (!text) {return}
	$("#replyButton").prop("disabled",true);
	$("#replyError").html("");
	var u = currentTab.url;
	if (u.indexOf("?")!==-1) {
		u = u.slice(0,u.indexOf("?"));
	}
	var tab = currentTab;
	var params = {
		tid: $("#tid").val(),
		content: text
	};
	var toPid = $("#toPid").val();
	if (toPid) {
		params.toPid = toPid;
	}
	emitPostRequest("posts.reply", params, function(error, post){
		if (error) {
			$("#replyButton").prop("disabled",false);
			$("#replyError").html(error.message || "An error occurred");
		} else {
			var page = 1+Math.floor(post.index / 20);
			display(u+"?page="+page, false, tab);
		}
	});
}
function submitPost() {
	var title = $("#postTitle").val();
	var text = $("#postText").val();
	var tags = $("#postTags").val();
	if (!title || !text){return}

	var tagsArray = tags.split(",").map(String.trim).filter(function(x){return x!==""});

	$("#postButton").prop("disabled",true);
	$("#postError").html("");

	var tab = currentTab;
	var params = {
		category_id: $("#cid").val(),
		title: title,
		content: text
	};
	if (tagsArray.length) {
		params.tags = tagsArray;
	}

	emitPostRequest("topics.post", params, function(error, post){
		if (error) {
			$("#postButton").prop("disabled",false);
			$("#postError").html(error.message || "An error occurred");
		} else {
			display("/topic/"+post.slug, false, tab);
		}
	});
}
function posOrNeg(number) {
	return (number>0?"+":"")+number;
}
function upvote(a,event){
	vote(a, event, true, $(a).hasClass("done"));
}
function downvote(t,event){
	vote(a, event, false, $(a).hasClass("done"));
}
function vote(a, event, up, un) {
	var li = $(a).closest("li");
	var v = li.find(".votes");
	li.find(".upvote,.downvote").removeClass("done");
	var score = parseInt(v.text());
	if (un) {
		if (up) {
			score--;
		} else {
			score++;
		}
	} else {
		if (up) {
			li.find(".upvote").addClass("done");
			score++;
		} else {
			li.find(".downvote").addClass("done");
			score--;
		}
	}
	v.text(posOrNeg(score));

	var pid = li.attr("id").slice(4); // post123 -> 123
	var room = "topic_"+$("#tid").val();
	var action = un ? "unvote" : (up ? "upvote" : "downvote");
	emitPostRequest("posts."+action, {pid:pid, room_id:room}, function(error) {
		console.log("Voted", error);
	});
	event.preventDefault();
}

function emitPostRequest(type, data, callback) {
	var t = setTimeout(function(){
		socket.close();
		socket.off("connect");
		callback({message:"Request timed out"});
	}, 7000);
	socket.on("connect", function() {
	 	socket.emit(type, data, function(error, result){
			socket.close();
			socket.off("connect");
			clearTimeout(t);
			callback(error, result);
		});
	});
	socket.connect();
}
setup();
$.get("/api/login", function(r){
	console.log("r",r);
	if (r.breadcrumbs) {
		$("#cont").append("<input id='username' placeholder='Username' type='text'/>");
		$("#cont").append("<input id='password' placeholder='Password' type='password'/>");
		$("#cont").append("<button id='loginbutton' onclick='submitLogin()'>Log in</button>");
	}
}).error(function(e){
	console.log("e",e);
	if (e.responseText.indexOf("\"/user/") === 0) {
		display("/", true);
	} else {
		$("#cont").append(e.status + " " + e.statusText);
	}
});
