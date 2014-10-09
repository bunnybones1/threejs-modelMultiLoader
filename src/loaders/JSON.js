var JSONLoader = {
	load: function(url, callback, error) {
		var xmlhttp = new XMLHttpRequest();

		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4) {
				if(xmlhttp.status == 200) {
					var jsonData = JSON.parse(xmlhttp.responseText);
					callback(jsonData, url);
				} else {
					error(xmlhttp);
				}
			}
		}
		xmlhttp.open("GET", url, true);
		xmlhttp.send();
	}
}

module.exports = JSONLoader;