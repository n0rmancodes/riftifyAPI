const d = require("deezer-node");
const deez = new d();
const url = require("url");
const http = require("http");
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const req = require('request');
http.createServer(detectedReq).listen(process.env.PORT || 3000);

function detectedReq(request, response) {
	var oUrl = url.parse(request.url, true);
	
	if (oUrl.query.search) {
		if (!oUrl.query.type) {
			deez.findTracks(oUrl.query.search).then(function(result) {
				response.writeHead(200, {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
				})
				response.end(JSON.stringify(result));
			});
		} else if (oUrl.query.type == "artist") {
			deez.findArtists(oUrl.query.search).then(function(result) {
				response.writeHead(200, {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
				})
				response.end(JSON.stringify(result));
			})
		} else if (oUrl.query.type == "album") {
			deez.findAlbums(oUrl.query.search).then(function(result) {
				response.writeHead(200, {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
				})
				response.end(JSON.stringify(result));
			})
		}
		return;
	}
	
	if (oUrl.query.getSong) {
		if (oUrl.query.getSong == "NaN") {
			response.end("err");
			return;
		}
		req("https://api.deezer.com/track/" + oUrl.query.getSong, function(err,res,body) {
			var md = JSON.parse(body);
			var at = md.artist.name;
			console.log(at);
			var tr = md.title_short;
			console.log(tr);
			var qu = tr + " " + at + " lyrics";
			console.log(qu);
			ytsr.getFilters(qu, function(err, filters) {
				console.log(filters);
				filter = filters.get('Type').find(o => o.name === 'Video');
				var options = {
					limit: 5,
					nextpageRef: filter.ref,
				}
				ytsr(qu, options, function(err, searchResults) {
					var url = searchResults.items[0].link;
					ytdl(url, function(err,info) {
						if (!info.formats) {
							var json = JSON.stringify ({
								"err": "noFormats"
							})
							response.writeHead(404, {
								"Content-Type": "application/json",
								"Access-Control-Allow-Origin": "*"
							});
							response.end(json)
							return;
						}
						let formats = ytdl.filterFormats(info.formats, 'audioonly');
						var fData = JSON.stringify({
							"metadata": md,
							"formats": formats
						})
						response.writeHead(200, {
							"Content-Type": "application/json",
							"Access-Control-Allow-Origin": "*"
						})
						response.end(fData);
						return;
					})
				})
			})
		})
		return;
	}
	
	if (oUrl.query.getArtist) {
		deez.getArtist(oUrl.query.getArtist).then(data => {
			var md = JSON.stringify(data);
			req("https://api.deezer.com/artist/" + oUrl.query.getArtist + "/top?limit=100", function (err,res,body) {
				var fData = JSON.stringify({
					"metadata": JSON.parse(md),
					"topTracks": JSON.parse(body)
				})
				response.writeHead(200, {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
				})
				response.end(fData);
				return;
			})
		});
		return;
	}
	
	if (oUrl.query.getAlbum) {
		deez.getAlbum(oUrl.query.getAlbum).then(data => {
			var md = JSON.stringify(data);
			response.writeHead(200, {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*"
			})
			response.end(md);
			return;
		})
		return;
	}
	
	response.writeHead(404, {
		"Access-Control-Allow-Origin": "*"
	})
	response.end("invalid request")
}