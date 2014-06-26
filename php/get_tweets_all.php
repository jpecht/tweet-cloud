<?php 
	session_start();
	require_once('twitteroauth.php');
	require_once('config.php');

	if (array_key_exists('access_token', $_SESSION)) {
		/* Get user access tokens out of the session. */
		$access_token = $_SESSION['access_token'];

		/* Create a TwitterOauth object with consumer/user tokens. */
		$connection = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET, $access_token['oauth_token'], $access_token['oauth_token_secret']);
		
		$user = $connection->get('account/verify_credentials');

		// get the last 200
		//$tweet_array = $connection->get('statuses/user_timeline', $send_data);

		// twitter api lets you retrieve max of 3200, 200 at a time
		$tweet_array = array();
		$last_max_id = -1;
		for ($i = 0; $i < 16; $i++) {
			$send_data = array(
				'screen_name' => $_REQUEST['username'],
				'count' => 200,
				'trim_user' => true,
				'include_rts' => true
			);
			if ($i != 0) $send_data['max_id'] = $last_max_id;

			$tweets = $connection->get('statuses/user_timeline', $send_data); // get t3h tweets
			
			if (count($tweets) == 0) break; // no more tweets :(
			else {
				if ($i != 0) array_shift($tweets); // shift off first tweet because repeat
				if (count($tweets) == 0) break; // no more tweets :(
				for ($j = 0; $j < count($tweets); $j++) {
					array_push($tweet_array, $tweets[$j]->{'text'});
				}

				$last_max_id = $tweets[count($tweets) - 1]->{'id_str'}; // store earliest tweet id from request
			}
		}

		$data = array("user" => $user, "tweets" => $tweet_array);

		echo json_encode($data);
	} else {
		echo json_encode(array("error" => "not signed in to twitter"));
	}
?>