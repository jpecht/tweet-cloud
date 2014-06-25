$.noty.defaults.layout = 'center';
$.noty.defaults.timeout = 3000;
$.noty.defaults.type = 'information';
var fill = d3.scale.category20();

$.get('auth_check.php', function(data) {
	console.log(data);
	if (data === '1') {
		// signed in to twitter
		$('#username-form').css('display', 'inline-block');
	} else {
		// not signed in to twitter
		$('#sign-in-button').css('display', 'inline-block');
	}
});

$.get('stop_list.txt', function(ignore_str) {
	ignore_list = ignore_str.split('\n');
	ignore_list.push('');
});

$('#form-submit').on('click', function() {
	$.ajax({
		url: 'connect.php', 
		data: {username: $('#twitterName').val()},
		success: function(data) {
			var twitter_data = $.parseJSON(data);
			if (twitter_data.hasOwnProperty('error')) {
				console.log('Error in requesting data from connect.php');
				console.log(twitter_data.error);
			} else {
				if (twitter_data.tweets.length === 0) noty({text: 'No tweets on this account!'});
				else createWordCloud(twitter_data.tweets);
			}
		}
	});
});

var createWordCloud = function(tweets) {
	$('#word-cloud-container').empty();
	$('#word-cloud-container').css('display', 'inline-block');

	// first split tweets into words
	var tweet_str_array = [];
	for (var i = 0; i < tweets.length; i++) {
		var tw_arr = tweets[i].text.split(' ');
		for (var j = 0; j < tw_arr.length; j++) {
			var word = tw_arr[j].toLowerCase();
			//word = word.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, '');
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

	// strip out words that only appear once
	var word_count = {};
	for (var i = 0; i < tweet_str_array.length; i++) {
		var word = tweet_str_array[i];
		if (!word_count.hasOwnProperty(word)) word_count[word] = 1;
		else word_count[word]++;
	}
	tweet_str_array = [];
	for (var ind in word_count) {
		if (word_count[ind] !== 1) tweet_str_array.push(ind);
	}

	var max_count = 2;
	for (var ind in word_count) {
		if (word_count[ind] > max_count) max_count = word_count[ind];
	}


	// reverse index of word_count, for testing
	var count_obj = {};
	for (var ind in word_count) {
		var count = word_count[ind];
		if (!count_obj.hasOwnProperty(count)) count_obj[count] = [];
		count_obj[count].push(ind);
	}
	console.log(count_obj);



	// make word cloud
	d3.layout.cloud().size([300, 300])
	.words(tweet_str_array.map(function(d) {
		var size = map(word_count[d], 2, max_count, 10, 100); // size ranges from 10-100
		return {text: d, size: size}; 
	}))
	.padding(5)
	.rotate(function() { return ~~(Math.random() * 2) * 90; })
	.font("Impact")
	.fontSize(function(d) { return d.size; })
	.on("end", draw)
	.start();

	function draw(words) {
		d3.select("#word-cloud-container").append("svg")
		.attr('id', 'word_cloud')
		.attr("width", 300)
		.attr("height", 300)
		.append("g")
		.attr("transform", "translate(150,150)")
		.selectAll("text")
		.data(words)
		.enter().append("text")
		.style("font-size", function(d) { return d.size + "px"; })
		.style("fill", function(d, i) { return fill(i); })
		.attr("text-anchor", "middle")
		.attr("transform", function(d) {
			return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
		})
		.text(function(d) { return d.text; });
	}
}

var map = function(val, old_min, old_max, new_min, new_max) {
	return (val-old_min)*(new_max-new_min)/(old_max-old_min) + new_min;
}