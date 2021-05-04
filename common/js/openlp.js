window.OpenLP = {
	loadService: function (event) {
		$.getJSON(
			'/api/service/list',
			function (data, status) {
				OpenLP.currentItemTitle = ""
				OpenLP.currentItemType = ""
				for (var idx in data.results.items) {
					idx = parseInt(idx, 10);
					if (data.results.items[idx]["selected"]) {
						OpenLP.currentItemTitle = data.results.items[idx]["title"].replace(/\n/g, "<br />")
						OpenLP.currentItemType = data.results.items[idx]["plugin"]
						break;
					}
				}
				OpenLP.updateSlide();
			}
		);
	},
	loadSlides: function (event) {
		$.getJSON(
			'/api/controller/live/text',
			function (data, status) {
				OpenLP.currentSlides = data.results.slides;
				OpenLP.currentSlide = 0;
				$.each(data.results.slides, function(idx, slide) {
					if (slide["selected"]) OpenLP.currentSlide = idx;
				})
				OpenLP.loadService();
			}
		);
	},
	updateSlide: function() {
		var html = "";
		if (OpenLP.currentItemTitle.slice(0,3).toLowerCase() == 'dia') {
			$('#alt-3-name')[0].value = ""
			$('#alt-3-info')[0].value = ""
			$('#alt-4-name')[0].value = `${OpenLP.currentSlides[OpenLP.currentSlide]["html"].replace(/(<div class='dia'.*?>|<\/div>)/g,"")}{font-variant:small-caps;text-shadow:1px 1px .2em rgba(0,0,0,0.75);}`
			$('#alt-4-info')[0].value = " "
			$('#alt-4-align-left').prop('checked', true)
		} else if (OpenLP.currentItemTitle.slice(0,20).toLowerCase() == 'gondolatok elvitelre') {
			$('#alt-3-name')[0].value = ""
			$('#alt-3-info')[0].value = ""
			$('#alt-4-name')[0].value = `${OpenLP.currentSlides[OpenLP.currentSlide]["html"].replace(/(<div class='dia'.*?>|<\/div>)/g,"")}{text-shadow:1px 1px .2em rgba(0,0,0,0.75);font-size:1.5em;padding-bottom:.2em;text-align:justify}`
			$('#alt-4-info')[0].value = `${OpenLP.currentItemTitle}{text-shadow:1px 1px .2em rgba(0,0,0,0.75);padding-bottom:.2em;}%text-align:right;%`
			$('#alt-4-align-right').prop('checked', true)
		} else if ((OpenLP.currentItemType != "songs") && (OpenLP.currentItemTitle.slice(0,5)) != "[---]") {// if ((OpenLP.currentItemType == "bibles") || ((OpenLP.currentItemType == "custom") && )) {
			$('#alt-3-name')[0].value = ""
			$('#alt-3-info')[0].value = ""
			$('#alt-4-name')[0].value = `${OpenLP.currentSlides[OpenLP.currentSlide]["html"]}{text-shadow:1px 1px .2em rgba(0,0,0,0.75);font-size:1.5em;padding-bottom:.2em;text-align:justify}`
			if (OpenLP.currentItemTitle.length > 0) {
				$('#alt-4-info')[0].value = `${OpenLP.currentItemTitle.replace(/ Magyar .*/, "")}{text-shadow:1px 1px .2em rgba(0,0,0,0.75);padding-bottom:.2em;}%text-align:right;%`
			} else {
				$('#alt-4-info')[0].value = " "
			}
			$('#alt-4-align-right').prop('checked', true)
		}else if (OpenLP.currentItemType == "songs") {
			$('#alt-4-name')[0].value = ""
			$('#alt-4-info')[0].value = ""
			$('#alt-3-name')[0].value = `${OpenLP.currentSlides[OpenLP.currentSlide]["html"].replace(/(<em>|<\/em>|<span class="chord" style="display:none"><span><strong>.*?<\/strong><\/span><\/span>|<div class="notes" style="display:none">.*?<\/div>|<div id="sheet" style="display:none">.*?<\/div>)/g,"")}{text-shadow:0 0 .2em #000, 0 0 .1em #000, 0 0 .1em #000;padding-bottom:.2em;text-align:center;}`
			$('#alt-3-info')[0].value = " "
			//$('#alt-3-align-right').prop('checked', true)
		} else {
			$('#alt-3-name')[0].value = ""
			$('#alt-3-info')[0].value = ""
			$('#alt-4-name')[0].value = ""
			$('#alt-4-info')[0].value = ""
		}
		refreshData()
	},
	pollServer: function () {
		$.getJSON(
			'/api/poll',
			function (data, status) {
				if (OpenLP.currentItem != data.results.item ||
					OpenLP.currentService != data.results.service) {
					OpenLP.currentItem = data.results.item;
					OpenLP.currentService = data.results.service;
					OpenLP.loadSlides();
					console.log("OpenLP.loadslides()")
				} else if (OpenLP.currentSlide != data.results.slide) {
					OpenLP.currentSlide = parseInt(data.results.slide, 10);
					OpenLP.updateSlide();
					console.log("OpenLP.updateslide()")
				}
			}
		);
	},
	pollServer1: function() {
		$.ajax({
			url: `/api/poll`, // <== Make sure this DOESN'T have ?callback= on it
			dataType: "json"
		})
		.done(function(data) {
			if (OpenLP.currentItem != data.results.item ||
				OpenLP.currentService != data.results.service) {
				OpenLP.currentItem = data.results.item;
				OpenLP.currentService = data.results.service;
				OpenLP.loadSlides();
			} else if (OpenLP.currentSlide != data.results.slide) {
				OpenLP.currentSlide = parseInt(data.results.slide, 10);
				OpenLP.updateSlide();
			}
		})
		.fail(function(error) {
			console.log(error);
		});
	}
}

$.ajaxSetup({ cache: false })
//OpenLP.pollServer()
//setInterval("OpenLP.pollServer()", 500)

$(document).ready(function() {
	const host = window.location.hostname
	const websocket_port = 4317
	function wsstart(){
		//if (ws) {ws = null}
		ws = new WebSocket(`ws://${host}:${websocket_port}`)
		ws.onmessage = (event) => {
			const reader = new FileReader()
			reader.onload = () => {
				const state = JSON.parse(reader.result.toString()).results
				OpenLP.pollServer()
				console.log(state)
			}
			reader.readAsText(event.data)
		}
		ws.onclose = function(){
			console.log('closed!')
			wscheck()
		}
	}
	function wscheck(){
		if(!ws || ws.readyState == 3) wsstart()
	}
	wsstart()
	setInterval(wscheck, 5000)
})