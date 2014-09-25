$.noty.defaults.layout = 'center';
$.noty.defaults.timeout = 3000;
$.noty.defaults.type = 'warning';
$.noty.defaults.killer = true;

(function() {

	var cloud_width = 400;
	var cloud_height = 400;
	var min_font_size = 10;
	var max_font_size = 100;
	var rotate_values = [-90, 0, 0, 90];
	var cloud_padding = 5;

	var spring_colors = ['#67E491', '#64BCD9', '#6D81DF'];	
	var fall_colors = ['#FFCE00', '#FFA400', '#FF6A00'];
	var blue_colors = ['rgb(107,174,214)','rgb(49,130,189)','rgb(7,81,156)','rgb(28,53,99)'];


	// check if signed in to twitter
	$.get('php/auth_check.php', function(data) {
		$('.button-curtain').css('display', function() {
			return (data === '') ? 'block' : 'none';
		});
		$('#login-info-container').css('display', function() {
			return (data === '') ? 'none' : 'block';
		});
		$('#login-info').html('logged in as <strong>' + data + '</strong>');
	});

	
	// load list of words that are ignored when creating word cloud
	$.get('stop_list.txt', function(ignore_str) {
		ignore_list = ignore_str.split('\n');
		ignore_list.push('');
	});


	// define form and button behavior
	$('#submit-button').on('click', function() {
		submitRequest();
	});
	$('#twitter-name-input').on('keypress', function(event) {
		if (event.which === 13) submitRequest();
	});
	$('#show-stats').on('click', function() {
		$('#show-stats').hide();
		$('#stats-block').css('display', 'inline-block');
	});
	$('#logout-button').on('click', function() {
		$.ajax({
			url: 'php/logout.php',
			success: function(data) {
				console.log(data);
			},
			error: function() {

			}
		})
	});


	var submitRequest = function() {
		NProgress.start();	
		$('#submit-button').html('Grabbing tweets...');
		$('#word-cloud-container').hide();
		$('#word-cloud-container').empty();
		$('#show-stats').hide();
		$('#stats-block').hide();
		$.ajax({
			url: 'php/get_tweets_all.php', 
			data: {username: $('#twitter-name-input').val()},
			success: function(data) {
				var twitter_data = $.parseJSON(data);
				if (twitter_data.hasOwnProperty('error')) {
					if (twitter_data.error === "Not authorized.") {
						noty({text: "<strong>You don't have access to this twitter account!</strong><br />Try another one!"});
					} else {
						noty({text: "<strong>Sorry something didn't work!</strong><br />" + twitter_data.error});
					}
				} else if (twitter_data.hasOwnProperty('errors')) {
					noty({text: "<strong>This twitter name doesn't exist!</strong><br />Try another one!"});
				} else {
					//console.log(twitter_data.tweets);
					if (twitter_data.tweets.length === 0) noty({text: 'No tweets on this account!'});
					else {
						NProgress.set(0.8);
						var c_data = analyzeTweets(twitter_data.tweets);
						if (c_data === false) return;
						else {
							createWordCloud(c_data);
							$('#word-cloud-container').css('display', 'inline-block');

							writeStats(c_data);
							$('#show-stats').css('display', 'inline-block');
						}
	
						if (twitter_data.user.hasOwnProperty('profile_background_image_url_https')) {
							var img_str = 'url('+twitter_data.user.profile_background_image_url_https +')';
							$('#header').css('background', img_str + ' no-repeat center');
						} else {
							$('#header').css('background', 'rgba(255,255,255,0.8)');
						}
					}
				}
			},
			complete: function() {
				$('#submit-button').html('Create a Word Cloud');
				NProgress.done();
			}
		});
	}

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
			row.append('td').text(mo_words[i].text);
			row.append('td').text(mo_words[i].count);
		}
	}

	var analyzeTweets = function(tweets) {			
		var min_words = 100; // min number of words needed to create a nice looking word cloud
		var include_hashtag = $('#hashtag-checkbox').prop('checked');
	
		// first split tweets into words (tweet_str_array = ['hello', 'foo', 'bar', 'foo', 'foo'])
		var tweet_str_array = [];
		for (var i = 0; i < tweets.length; i++) {
			var tw_arr = tweets[i].split(' ');
			for (var j = 0; j < tw_arr.length; j++) {
				var word = tw_arr[j].toLowerCase();
				
				// slows it down a lot! should replace this part with regex
				//var strippers = ['"', '.', ',', '!', '?'];
				//for (var i = 0; i < strippers.length; i++) word.replace(strippers[i], '');

				if (word.charAt(0) !== '@' && (include_hashtag || word.charAt(0) !== '#')) {
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

		// counting the words! e.g. word_count = {'hello': 1, 'foo': 3}
		var word_count = {};
		for (var i = 0; i < tweet_str_array.length; i++) {
			var word = tweet_str_array[i];
			if (!word_count.hasOwnProperty(word)) word_count[word] = 1;
			else word_count[word]++;
		}
		tweet_str_array = [];
		for (var ind in word_count) {
			// strip out words that only appear once 
			if (word_count[ind] !== 1) tweet_str_array.push(ind);
		}

		// reverse index of word_count, for testing (count_obj = [ 1: ['hello', 'bar'], 3: ['foo'] ])
		var count_obj = [];
		for (var ind in word_count) {
			var count = word_count[ind];
			if (!count_obj.hasOwnProperty(count)) count_obj[count] = [];
			count_obj[count].push(ind);
		}

		// sorts tweet_str_array by occurence and takes top 100 words
		tweet_str_array.sort(function(a, b) {
			if (word_count[a] < word_count[b]) return 1;
			else if (word_count[a] == word_count[b]) return 0;
			else return -1;
		});
		if (tweet_str_array.length < 25) {
			noty({text: 'Sorry this account doesnt tweet enough =/'});
			return false;
		}
		else if (tweet_str_array.length > 100) tweet_str_array = tweet_str_array.splice(0, 99);

		return {
			min_count: word_count[tweet_str_array[tweet_str_array.length-1]],
			max_count: count_obj.length - 1,
			tweet_str_array: tweet_str_array, 
			word_count: word_count,
			count_obj: count_obj
		};
	};
	
	var createWordCloud = function(c_data) {
		d3.layout.cloud().size([cloud_width, cloud_height])
			.words(c_data.tweet_str_array.map(function(d) {
				 // size ranges from 10-100, consider using log scale d3.scale.log()
				var size = mapNum(c_data.word_count[d], c_data.min_count, c_data.max_count, min_font_size, max_font_size);
				return {text: d, size: size}; 
			}))
			.padding(cloud_padding)
			.rotate(function() {
				return rotate_values[~~(Math.random() * rotate_values.length)];
			})
			//.font("Impact")
			.fontSize(function(d) { return d.size; })
			.on("end", draw)
			.start();
	};
	
	var draw = function(words) {
		var scale = d3.scale.linear();
		var domain = [];
		
		switch($('#color-select').val()) {
			case 'fall':
				var range = fall_colors;
				break;
			case 'blue':
				var range = blue_colors;
				break;
			default:
				var range = spring_colors;
		}

		for (var i = 0; i < range.length; i++) {
			domain.push(min_font_size + (max_font_size - min_font_size)*i/(range.length-1));
		}
		scale.domain(domain).range(range);
		
		d3.select("#word-cloud-container").append("svg")
			.attr('id', 'word_cloud')
			.attr("width", cloud_width)
			.attr("height", cloud_height)
		.append("g")
			.attr("transform", "translate("+cloud_width/2+","+cloud_height/2+")")
		.selectAll("text")
			.data(words)
		.enter().append("text")
			.style("font-size", function(d) { return d.size + "px"; })
			.style("fill", function(d, i) {
				return scale(d.size);
			})
			.attr("text-anchor", "middle")
			.attr("transform", function(d) {
				return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
			})
			.text(function(d) { return d.text; });
	};

	var mapNum = function(val, old_min, old_max, new_min, new_max) {
		return (val-old_min)*(new_max-new_min)/(old_max-old_min) + new_min;
	};
})();