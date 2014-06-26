$.noty.defaults.layout = 'center';
$.noty.defaults.timeout = 3000;
$.noty.defaults.type = 'information';
var fill = d3.scale.category20();

// check if signed in to twitter
$.get('php/auth_check.php', function(data) {
	if (data === '1') {
		// signed in to twitter
		$('#username-form').css('display', 'inline-block');
	} else {
		// not signed in to twitter
		$('#sign-in-button').css('display', 'inline-block');
	}
});

// load list of words that are ignored when creating word cloud
$.get('stop_list.txt', function(ignore_str) {
	ignore_list = ignore_str.split('\n');
	ignore_list.push('');
});

$('#form-submit').on('click', function() {
	NProgress.start();

	$.ajax({
		url: 'php/get_tweets_all.php', 
		data: {username: $('#twitterName').val()},
		success: function(data) {
			//console.log(data);
			var twitter_data = $.parseJSON(data);
			if (twitter_data.hasOwnProperty('error')) {
				console.log('Error in requesting data from connect.php');
				console.log(twitter_data.error);
			} else {
				//console.log(twitter_data.tweets);
				if (twitter_data.tweets.length === 0) noty({text: 'No tweets on this account!'});
				else {
					NProgress.set(0.8);
					var c_data = analyzeTweets(twitter_data.tweets);

					$('#word-cloud-container').empty();
					createWordCloud(c_data);
					$('#word-cloud-container').css('display', 'inline-block');

					writeStats(c_data);
					$('#show-stats').css('display', 'inline-block');
				}
			}
		}
	});
});

$('#show-stats').on('click', function() {
	$('#show-stats').hide();
	$('#stats-container').css('display', 'inline-block');
});

var writeStats = function(data) {
	$('#stats-table tr:not("#stats-table-header")').remove();

	var mo_words = []; // most occuring words
	loop1:
	for (var i = data.count_obj.length - 1; i >= 0; i--) {
		if (typeof data.count_obj[i] !== 'undefined') {
	loop2:
			for (var j = 0; j < data.count_obj[i].length; j++) {
				mo_words.push({text: data.count_obj[i][j], count: i});
				if (mo_words.length === 10) break loop1;
			}
		}
	}

	for (var i = 0; i < mo_words.length; i++) {
		var row = d3.select('#stats-table tbody').append('tr');
		row.append('td').text(i + 1);
		row.append('td').text(mo_words[i].text);
		row.append('td').text(mo_words[i].count);
	}
}

var analyzeTweets = function(tweets) {			
	var min_words = 100; // min number of words needed to create a nice looking word cloud

	// first split tweets into words (tweet_str_array = ['hello', 'foo', 'bar', 'foo', 'foo'])
	var tweet_str_array = [];
	for (var i = 0; i < tweets.length; i++) {
		var tw_arr = tweets[i].split(' ');
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

	// strip out words that only appear once (word_count = {'hello': 1, 'foo': 3})
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

	// reverse index of word_count, for testing (count_obj = [ 1: ['hello', 'bar'], 3: ['foo'] ])
	var count_obj = [];
	for (var ind in word_count) {
		var count = word_count[ind];
		if (!count_obj.hasOwnProperty(count)) count_obj[count] = [];
		count_obj[count].push(ind);
	}
	console.log(count_obj);

	// rejects if not enough re-occurring words
	if (count_obj.length < 3) {
		noty({text: 'Sorry this account doesnt tweet enough =/'});
		return;
	}

	// if there's enough words, get rid of the least occurring words
	var occurence_threshold = 2;
	for (var i = 2; i <= 5; i++) {
		var iwc = 0; // individual word count
		for (var j = i + 1; j < count_obj.length; j++) {
			if (typeof count_obj[j] !== 'undefined') iwc += count_obj[j].length;
		}
		if (iwc >= min_words) occurence_threshold = i;
		else break;
	}
	for (var i = 0; i < tweet_str_array.length; i++) {
		if (word_count[tweet_str_array[i]] <= occurence_threshold) {
			tweet_str_array.splice(i, 1);
		}
	}
	var min_count = occurence_threshold + 1;
	var max_count = count_obj.length - 1;

	return {
		min_count: min_count,
		max_count: max_count,
		tweet_str_array: tweet_str_array, 
		word_count: word_count,
		count_obj: count_obj
	};
}

var createWordCloud = function(c_data) {
	d3.layout.cloud().size([300, 300])
		.words(c_data.tweet_str_array.map(function(d) {
			 // size ranges from 10-100, consider using log scale d3.scale.log()
			var size = mapNum(c_data.word_count[d], c_data.min_count, c_data.max_count, 10, 100);
			return {text: d, size: size}; 
		}))
		.padding(5)
		.rotate(function() { return ~~(Math.random() * 2) * 90; })
		.font("Impact")
		.fontSize(function(d) { return d.size; })
		.on("end", draw)
		.start();
}

var draw = function(words) {
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

	NProgress.done();
}

var mapNum = function(val, old_min, old_max, new_min, new_max) {
	return (val-old_min)*(new_max-new_min)/(old_max-old_min) + new_min;
}