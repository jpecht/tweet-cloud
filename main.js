
if (user.hasOwnProperty('errors')) {
	$('#debugText').text('Error: ' + user.errors[0].message);
	$('#signInButton').show();
} else {
	$('#debugText').text('Authenticated!');

	$.get('stop_list.txt', function(ignore_str) {
		var ignore_list = ignore_str.split('\n');
		ignore_list.push('');

		var tweet_str_array = [];
		for (var i = 0; i < tweets.length; i++) {
			var tw_arr = tweets[i].text.split(' ');
			for (var j = 0; j < tw_arr.length; j++) {
				var word = tw_arr[j].toLowerCase();
				if (word.charAt(0) !== '@') {
					var ignore_me = false;
					for (var k = 0; k < ignore_list.length; k++) {
						if (word === ignore_list[k]) {
							ignore_me = true;
							break;
						}
					}
					if (!ignore_me) tweet_str_array.push(tw_arr[j].toLowerCase());
				}
			}
		}

		// test: to see the duplicate count of words
		var obj = {}, count_obj = {}
		for (var i = 0; i < tweet_str_array.length; i++) {
			var word = tweet_str_array[i];
			if (!obj.hasOwnProperty(word)) obj[word] = 1;
			else obj[word]++;
		}
		for (var ind in obj) {
			var count = obj[ind];
			if (!count_obj.hasOwnProperty(count)) count_obj[count] = [];
			count_obj[count].push(ind);
			//if (!count_obj.hasOwnProperty(count)) count_obj[count] = 1;
			//else count_obj[count]++;
		}
		console.log(tweet_str_array.length);
		console.log(count_obj);

		// make word cloud
		var fill = d3.scale.category20();

		d3.layout.cloud().size([300, 300])
		.words(tweet_str_array.map(function(d) {
				return {text: d, size: 10 + Math.random() * 90};
			}))
		.padding(5)
		.rotate(function() { return ~~(Math.random() * 2) * 90; })
		.font("Impact")
		.fontSize(function(d) { return d.size; })
		.on("end", draw)
		.start();

		function draw(words) {
			d3.select("#word_cloud_container").append("svg")
			.attr('id', 'word_cloud')
			.attr("width", 300)
			.attr("height", 300)
			.append("g")
			.attr("transform", "translate(150,150)")
			.selectAll("text")
			.data(words)
			.enter().append("text")
			.style("font-size", function(d) { return d.size + "px"; })
			.style("font-family", "Impact")
			.style("fill", function(d, i) { return fill(i); })
			.attr("text-anchor", "middle")
			.attr("transform", function(d) {
				return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
			})
			.text(function(d) { return d.text; });
		}
	});
}